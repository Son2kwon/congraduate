// 테스트 전용 헬퍼. 엔진 진입점(index.ts)에서 내보내지 않는다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LiberalCatalog, MajorCatalog, RuleFile } from "./schema";
import { createCourseIndex } from "./courses";
import type { EvalContext } from "./context";
import type { CourseRecord, ManualInput, Season, StudentInfo, Term } from "./types";

const ROOT = join(__dirname, "../..");
const readJson = (rel: string): unknown => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

export const realRules = RuleFile.parse(readJson("data/rules/cau_sw_2022.rules.json"));
export const realMajor = MajorCatalog.parse(readJson("data/catalog/courses_cau_sw.json"));
export const realLiberal = LiberalCatalog.parse(readJson("data/catalog/liberal_arts_2026_1.json"));
export const realIndex = createCourseIndex(realMajor, realLiberal);

/** "2023-2" → { year: 2023, season: "2" } */
export function t(s: string): Term {
  const [y, season] = s.split("-");
  return { year: Number(y), season: season as Season };
}

let seq = 0;
/** 과목 레코드. 지정하지 않은 값은 무난한 기본값 (B+, 3학점, 수동 입력) */
export function rec(name: string, over: Partial<Omit<CourseRecord, "term">> & { term?: string | Term } = {}): CourseRecord {
  const { term, ...rest } = over;
  seq += 1;
  return {
    code: String(90000 + seq),
    section: "01",
    name,
    term: typeof term === "string" ? t(term) : (term ?? t("2023-1")),
    credits: 3,
    design_credits: 0,
    grade: "B+",
    general_category: null,
    liberal_area: null,
    abeek_category: null,
    english: null,
    retake: false,
    source: "manual",
    ...rest,
  };
}

/** 계획 과목 */
export function plan(name: string, over: Parameters<typeof rec>[1] = {}): CourseRecord {
  return rec(name, { grade: null, source: "plan", ...over });
}

export const emptyManual = (): ManualInput => ({
  language_tests: [],
  topcit: [],
  thesis_passed: false,
  counts: {},
  checked: {},
  design: { internship_design_credits: 0, capstone_by_internship: null },
});

export function student(over: Partial<Omit<StudentInfo, "manual">> & { manual?: Partial<ManualInput> } = {}): StudentInfo {
  return {
    entry_year: over.entry_year ?? 2022,
    expected_graduation: over.expected_graduation ?? t("2026-2"),
    manual: { ...emptyManual(), ...over.manual },
  };
}

/** 실제 규칙 파일·카탈로그를 쓰는 판정 문맥 */
export function ctx(s: StudentInfo = student()): EvalContext {
  return {
    termOrder: realRules.counting.term_order,
    categoryGroups: realRules.classification.category_groups,
    courses: realIndex,
    student: s,
  };
}
