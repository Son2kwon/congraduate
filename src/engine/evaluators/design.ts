import type { EvalContext } from "../context";
import { compareTerm, earnedRecords, isPlanned, sameCourse } from "../records";
import type { DesignCreditsMin } from "../schema";
import type { CourseRecord, RequirementResult, Term } from "../types";
import { counted, courseState, newResult, statusOf, sumValue } from "./result";

/**
 * 설계학점.
 * 인정 기간: T(window.from) <= T(과목) <= max(T(window.to_max_of)) — 양 끝 포함, 학기 순서는 counting.term_order.
 * - window.from(창의적설계) 미이수: 설계학점 0, 미충족
 * - to_max_of(캡스톤) 중 미이수가 있으면 끝을 열어 두고 잠정
 * 설계학점 값은 레코드의 design_credits (들은 과목 = 포털 이수현황, 계획 = 카탈로그 현재 값).
 * substitutions(인턴십 대체)는 아직 판정에 반영하지 않는다.
 */
export function evalDesignCreditsMin(req: DesignCreditsMin, records: CourseRecord[], c: EvalContext): RequirementResult {
  const earned = earnedRecords(records, c);
  const cmp = (a: Term, b: Term) => compareTerm(a, b, c.termOrder);
  const firstOf = (ref: string): CourseRecord | undefined =>
    earned.filter((r) => sameCourse(r, ref, c)).sort((a, b) => cmp(a.term, b.term))[0];

  const mustStates = req.must_include.map((ref) => ({ ref, state: courseState(ref, earned, c) }));
  const missingCourses = mustStates.filter((m) => m.state === "missing").map((m) => m.ref);

  const start = firstOf(req.window.from);
  if (!start) {
    return newResult(req, {
      status: "unmet",
      required: req.min,
      missing: { courses: missingCourses, credits: req.min, items: [] },
      reasons: [`${req.window.from} 미이수`],
    });
  }

  const ends = req.window.to_max_of.map((ref) => ({ ref, rec: firstOf(ref) }));
  const openEnds = ends.filter((e) => !e.rec).map((e) => e.ref);
  const endTerm = openEnds.length
    ? null
    : ends.map((e) => e.rec!.term).reduce((a, b) => (cmp(a, b) >= 0 ? a : b));
  const windowPlanned = isPlanned(start) || ends.some((e) => e.rec && isPlanned(e.rec));

  const cs = earned
    .filter((r) => r.design_credits > 0 && cmp(r.term, start.term) >= 0 && (endTerm === null || cmp(r.term, endTerm) <= 0))
    .map((r) => counted(r, r.design_credits));
  const current = sumValue(cs, false);
  const planned = sumValue(cs, true);
  const shortPlan = Math.max(0, req.min - current - planned);

  const reasons: string[] = [];
  if (openEnds.length) reasons.push(`${openEnds.join("·")} 미이수 — 인정 기간 끝이 열려 있음`);
  if (shortPlan > 0) reasons.push(`설계 ${shortPlan}학점 부족`);
  for (const m of missingCourses) if (!openEnds.includes(m)) reasons.push(`${m} 미이수`);

  const status =
    endTerm === null
      ? "tentative"
      : statusOf(
          !windowPlanned && current >= req.min && mustStates.every((m) => m.state === "done"),
          shortPlan === 0 && missingCourses.length === 0,
        );

  return newResult(req, {
    status,
    current,
    planned,
    required: req.min,
    counted: cs,
    missing: { courses: missingCourses, credits: shortPlan, items: [] },
    reasons,
  });
}
