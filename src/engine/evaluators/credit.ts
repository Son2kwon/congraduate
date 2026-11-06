import type { EvalContext } from "../context";
import { earnedRecords, isPlanned, matchesRecord, sameCourse } from "../records";
import type { CoursesAll, CreditsMax, CreditsMin, GroupsEachMinCredits } from "../schema";
import type { CourseRecord, GroupResult, RequirementResult } from "../types";
import { counted, courseState, newResult, recordLabel, statusOf, sumValue, type CourseState } from "./result";

/** 최소학점 (+ pool, must_include, must_include_any, warn_if_missing) */
export function evalCreditsMin(req: CreditsMin, records: CourseRecord[], c: EvalContext): RequirementResult {
  const earned = earnedRecords(records, c);
  const inPool = (r: CourseRecord) => req.pool?.some((ref) => sameCourse(r, ref, c)) ?? false;
  const matched = earned.filter((r) => matchesRecord(req.match, r, c) || inPool(r));
  const cs = matched.map((r) => counted(r, r.credits));
  const current = sumValue(cs, false);
  const planned = sumValue(cs, true);

  const warnings: string[] = [];
  // pool 과목인데 포털 분류가 다르면: 규칙대로 세고 경고 (decisions.md 8번)
  for (const r of matched) {
    if (inPool(r) && !isPlanned(r) && !matchesRecord(req.match, r, c)) {
      warnings.push(`${recordLabel(r)}: 포털 공학인증 구분 '${r.abeek_category ?? "없음"}' — 규칙상 ${req.label}으로 인정`);
    }
  }

  // 필수 과목: must_include 각각, must_include_any 묶음마다 하나
  const musts: { label: string; state: CourseState }[] = [
    ...(req.must_include ?? []).map((ref) => ({ label: ref, state: courseState(ref, earned, c) })),
    ...(req.must_include_any ?? []).map((group) => {
      const states = group.map((ref) => courseState(ref, earned, c));
      const state: CourseState = states.includes("done") ? "done" : states.includes("planned") ? "planned" : "missing";
      return { label: group.join(" 또는 "), state };
    }),
  ];
  const missingCourses = musts.filter((m) => m.state === "missing").map((m) => m.label);

  for (const ref of req.warn_if_missing ?? []) {
    if (courseState(ref, earned, c) === "missing") warnings.push(`${ref} 미이수 — 확인 권장`);
  }

  const shortDone = Math.max(0, req.min - current);
  const shortPlan = Math.max(0, req.min - current - planned);
  const status = statusOf(
    shortDone === 0 && musts.every((m) => m.state === "done"),
    shortPlan === 0 && missingCourses.length === 0,
  );
  const reasons = [
    ...(shortPlan > 0 ? [`${shortPlan}학점 부족`] : []),
    ...missingCourses.map((m) => `${m} 미이수`),
  ];

  return newResult(req, {
    status,
    current,
    planned,
    required: req.min,
    counted: cs,
    missing: { courses: missingCourses, credits: shortPlan, items: [] },
    reasons,
    warnings,
  });
}

/** 최대학점. over_cap "none": 초과해도 처리·경고 없음 (decisions.md 11번) — 현재값과 기준만 보여 준다 */
export function evalCreditsMax(req: CreditsMax, records: CourseRecord[], c: EvalContext): RequirementResult {
  const cs = earnedRecords(records, c)
    .filter((r) => matchesRecord(req.match, r, c))
    .map((r) => counted(r, r.credits));
  return newResult(req, {
    status: "met",
    current: sumValue(cs, false),
    planned: sumValue(cs, true),
    required: req.max,
    counted: cs,
  });
}

/** 과목 전부 이수 (+ min_credits, 들은 과목 조건 taken_match, 학번별 cohort_rules) */
export function evalCoursesAll(req: CoursesAll, records: CourseRecord[], c: EvalContext): RequirementResult {
  const taken = req.taken_match;
  const earned = earnedRecords(records, c).filter((r) => isPlanned(r) || !taken || matchesRecord(taken, r, c));
  const refs = [
    ...req.courses,
    ...(req.cohort_rules ?? []).filter((r) => c.student.entry_year >= r.entry_year_gte).flatMap((r) => r.add_courses),
  ];
  const states = refs.map((ref) => ({ ref, state: courseState(ref, earned, c) }));
  const cs = earned.filter((r) => refs.some((ref) => sameCourse(r, ref, c))).map((r) => counted(r, r.credits));
  const missingCourses = states.filter((s) => s.state === "missing").map((s) => s.ref);

  const minCredits = req.min_credits ?? 0;
  const creditsDone = sumValue(cs, false);
  const creditsShort = Math.max(0, minCredits - creditsDone - sumValue(cs, true));

  const status = statusOf(
    states.every((s) => s.state === "done") && creditsDone >= minCredits,
    missingCourses.length === 0 && creditsShort === 0,
  );
  return newResult(req, {
    status,
    current: states.filter((s) => s.state === "done").length,
    planned: states.filter((s) => s.state === "planned").length,
    required: refs.length,
    counted: cs,
    missing: { courses: missingCourses, credits: creditsShort, items: [] },
    reasons: [...missingCourses.map((m) => `${m} 미이수`), ...(creditsShort > 0 ? [`${creditsShort}학점 부족`] : [])],
  });
}

/** 영역별 최소. 영역별 기준은 min_by_group(xlsx 대체값)이 있으면 그 값, 없으면 min_each */
export function evalGroupsEachMinCredits(req: GroupsEachMinCredits, records: CourseRecord[], c: EvalContext): RequirementResult {
  const earned = earnedRecords(records, c);
  const all = earned.filter((r) => r.liberal_area && req.groups.includes(r.liberal_area)).map((r) => ({ r, cc: counted(r, r.credits) }));

  const groups: GroupResult[] = req.groups.map((group) => {
    const cs = all.filter((x) => x.r.liberal_area === group).map((x) => x.cc);
    const required = req.min_by_group?.[group] ?? req.min_each;
    const current = sumValue(cs, false);
    return { group, current, planned: sumValue(cs, true), required, met: current >= required };
  });
  const shortOf = (g: GroupResult) => Math.max(0, g.required - g.current - g.planned);
  const short = groups.filter((g) => shortOf(g) > 0);

  return newResult(req, {
    status: statusOf(groups.every((g) => g.met), short.length === 0),
    current: groups.filter((g) => g.met).length,
    planned: groups.filter((g) => !g.met && shortOf(g) === 0).length,
    required: groups.length,
    counted: all.map((x) => x.cc),
    missing: { courses: [], credits: short.reduce((s, g) => s + shortOf(g), 0), items: short.map((g) => g.group) },
    reasons: short.map((g) => `${g.group} ${shortOf(g)}학점 부족`),
    groups,
  });
}
