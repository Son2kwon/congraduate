import type { EvalContext } from "./context";
import type { CourseIndex } from "./courses";
import { evalCoursesAll, evalCreditsMax, evalCreditsMin, evalGroupsEachMinCredits } from "./evaluators/credit";
import { evalDesignCreditsMin } from "./evaluators/design";
import { evalAnyOf, evalChecklist, evalChooseN, evalCountMin } from "./evaluators/noncredit";
import type {
  CreditRequirement,
  NonCreditRequirement,
  ResolvedGeneral,
  RuleFile,
  SchoolStandardOverride,
  SchoolStandardRow,
} from "./schema";
import { earnedRecords, isPlanned, sameCourse } from "./records";
import type { Amount, CourseRecord, RequirementResult, StudentInfo, Summary } from "./types";

// ---------- 학교 기준 대체 ----------

/**
 * 학교 기준(general) 확정 (decisions.md 14번).
 * xlsx 행 이름이 요구사항의 portal_rows와 같으면 그 행의 이수기준으로 기준값을 바꾼다.
 * - credits_min → min, credits_max → max, courses_all → min_credits, groups_each_min_credits → min_by_group[영역]
 * - 이수기준이 빈칸(null)이면 기본값 유지
 * - 어느 portal_rows에도 없는 행은 unknown_rows로 남긴다
 */
export function resolveGeneral(general: RuleFile["rule_sets"]["general"], override?: SchoolStandardOverride): ResolvedGeneral {
  const default_entry_year = general.basis.default_entry_year;
  const requirements: CreditRequirement[] = structuredClone(general.requirements);
  if (!override) {
    return { basis: `default_${default_entry_year}`, default_entry_year, requirements, overridden: {}, unknown_rows: [] };
  }

  const owner = new Map<string, CreditRequirement>();
  for (const r of requirements) {
    if ("portal_rows" in r) for (const row of r.portal_rows ?? []) owner.set(row, r);
  }

  const overridden: Record<string, SchoolStandardRow[]> = {};
  const unknown_rows: SchoolStandardRow[] = [];
  for (const raw of override.rows) {
    const row = { ...raw, name: raw.name.trim() };
    const r = owner.get(row.name);
    if (!r) {
      unknown_rows.push(row);
      continue;
    }
    if (row.criterion === null) continue;
    switch (r.type) {
      case "credits_min":
        r.min = row.criterion;
        break;
      case "credits_max":
        r.max = row.criterion;
        break;
      case "courses_all":
        r.min_credits = row.criterion;
        break;
      case "groups_each_min_credits":
        r.min_by_group = { ...r.min_by_group, [row.name]: row.criterion };
        break;
      case "design_credits_min":
        unknown_rows.push(row); // 스키마상 portal_rows가 없어 도달하지 않음
        continue;
    }
    (overridden[r.id] ??= []).push(row);
  }
  return { basis: "xlsx", default_entry_year, requirements, overridden, unknown_rows };
}

// ---------- 판정 ----------

export type EvaluateInput = {
  rules: RuleFile;
  courses: CourseIndex;
  /** 들은 과목 + 계획 과목 (계획은 source: "plan") */
  records: CourseRecord[];
  student: StudentInfo;
  /** 이수내역 xlsx의 학교 기준 (없으면 규칙 기본값) */
  standard?: SchoolStandardOverride;
};

export type EvaluateOutput = {
  /** 학교 기준: 확정된 요구사항(xlsx 대체 반영)과 결과 (같은 순서) */
  general: ResolvedGeneral & { results: RequirementResult[] };
  abeek: RequirementResult[];
  non_credit: RequirementResult[];
  summary: Summary;
};

/** 영역별 합계. 규칙 적용 값은 pool이 있는 공학인증 최소학점 요구사항(전문교양)의 pool 과목을 그 구분으로 옮긴다 */
export function summarize(records: CourseRecord[], rules: RuleFile, c: EvalContext): Summary {
  const earned = earnedRecords(records, c);
  const add = (m: Record<string, Amount>, key: string, r: CourseRecord) => {
    const a = (m[key] ??= { current: 0, planned: 0 });
    if (isPlanned(r)) a.planned += r.credits;
    else a.current += r.credits;
  };
  const pools = rules.rule_sets.abeek.requirements.flatMap((q) => {
    const cats = q.type === "credits_min" && q.pool && q.match !== "all" ? q.match["abeek.category"] : undefined;
    return q.type === "credits_min" && q.pool && cats?.length === 1 ? [{ pool: q.pool, category: cats[0]! }] : [];
  });
  const NONE = "(없음)";
  const portal: Record<string, Amount> = {};
  const rule: Record<string, Amount> = {};
  const general: Record<string, Amount> = {};
  const total: Amount = { current: 0, planned: 0 };
  for (const r of earned) {
    const cat = r.abeek_category ?? NONE;
    add(portal, cat, r);
    const moved = pools.find((p) => p.pool.some((ref) => sameCourse(r, ref, c)));
    add(rule, moved?.category ?? cat, r);
    add(general, r.general_category ?? NONE, r);
    if (isPlanned(r)) total.planned += r.credits;
    else total.current += r.credits;
  }
  return { abeek: { portal, rule }, general, total };
}

function evalRequirement(req: CreditRequirement | NonCreditRequirement, records: CourseRecord[], c: EvalContext): RequirementResult {
  switch (req.type) {
    case "credits_min":
      return evalCreditsMin(req, records, c);
    case "credits_max":
      return evalCreditsMax(req, records, c);
    case "courses_all":
      return evalCoursesAll(req, records, c);
    case "groups_each_min_credits":
      return evalGroupsEachMinCredits(req, records, c);
    case "design_credits_min":
      return evalDesignCreditsMin(req, records, c);
    case "any_of":
      return evalAnyOf(req, records, c);
    case "choose_n":
      return evalChooseN(req, records, c);
    case "checklist":
      return evalChecklist(req, records, c);
    case "count_min":
      return evalCountMin(req, records, c);
  }
}

/** 졸업요건 전체 판정 — 순수 함수 */
export function evaluate(input: EvaluateInput): EvaluateOutput {
  const { rules, records, student } = input;
  const { from, to } = rules.meta.supported_entry_years;
  if (student.entry_year < from || student.entry_year > to) {
    throw new RangeError(`지원 학번은 ${from}~${to}학번입니다 (입력: ${student.entry_year})`);
  }
  const c: EvalContext = {
    termOrder: rules.counting.term_order,
    categoryGroups: rules.classification.category_groups,
    courses: input.courses,
    student,
  };
  const resolved = resolveGeneral(rules.rule_sets.general, input.standard);
  return {
    general: { ...resolved, results: resolved.requirements.map((r) => evalRequirement(r, records, c)) },
    abeek: rules.rule_sets.abeek.requirements.map((r) => evalRequirement(r, records, c)),
    non_credit: rules.non_credit.map((r) => evalRequirement(r, records, c)),
    summary: summarize(records, rules, c),
  };
}
