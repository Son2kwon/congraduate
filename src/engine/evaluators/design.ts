import type { EvalContext } from "../context";
import { compareTerm, earnedRecords, isPlanned } from "../records";
import type { DesignCreditsMin } from "../schema";
import type { CourseRecord, RequirementResult, Term } from "../types";
import { counted, courseState, findCourse, nameMatchNotes, newResult, statusOf, sumValue } from "./result";

/**
 * 설계학점.
 * 인정 기간: T(window.from) <= T(과목) <= max(T(window.to_max_of)) — 양 끝 포함, 학기 순서는 counting.term_order.
 * - window.from(창의적설계) 미이수: 과목 설계학점 0(인턴십 입력분만 반영), 미충족
 * - to_max_of(캡스톤) 중 미이수가 있으면 끝을 열어 두고 잠정
 * 설계학점 값은 레코드의 design_credits (들은 과목 = 포털 이수현황, 계획 = 카탈로그 현재 값).
 * 설계 대체(substitutions)는 학생 입력만 쓴다 (규정 제67조①, 별표24):
 * - 인턴십 인정 설계학점: 인정 기간과 무관하게 더함. 규정값(design_credits)을 넘으면 경고
 * - 캡스톤으로 인정받은 과목: 이수로 처리하고 기간 끝 계산에서는 빼며, 나머지 캡스톤 학기로 기간을 닫는다
 * 입력이 반영되면 notes에 "수동 입력 반영"
 */
export function evalDesignCreditsMin(req: DesignCreditsMin, records: CourseRecord[], c: EvalContext): RequirementResult {
  const earned = earnedRecords(records, c);
  const cmp = (a: Term, b: Term) => compareTerm(a, b, c.termOrder);
  // 설계필수·인정 기간 과목은 들은 과목의 포털 구분(taken_match)도 확인
  const taken = req.taken_match;
  const firstOf = (ref: string): CourseRecord | undefined =>
    findCourse(ref, earned, c, taken).sort((a, b) => cmp(a.term, b.term))[0];

  // 학생 입력 대체
  const manual = c.student.manual.design;
  const internshipRule = req.substitutions.find((s) => s.kind === "internship");
  const capstoneAllowed = req.substitutions.some((s) => s.kind === "internship_as_capstone");
  const internship = internshipRule ? manual.internship_design_credits : 0;
  const substituted = capstoneAllowed && manual.capstone_by_internship
    ? req.window.to_max_of.find((ref) => c.courses.canonical(ref) === c.courses.canonical(manual.capstone_by_internship!))
    : undefined;
  const notes: string[] = nameMatchNotes([...req.must_include, req.window.from, ...req.window.to_max_of], earned, c, taken);
  const warnings: string[] = [];
  if (internship > 0) notes.push(`수동 입력 반영: 인턴십 인정 설계학점 ${internship}`);
  if (internshipRule && internship > internshipRule.design_credits) {
    warnings.push(`인턴십 인정 설계학점 입력값 ${internship}이 규정상 값 ${internshipRule.design_credits}보다 큼 — 확인 필요`);
  }
  if (substituted) notes.push(`수동 입력 반영: ${substituted}를 인턴십으로 인정`);

  const mustStates = req.must_include.map((ref) => ({ ref, state: ref === substituted ? "done" : courseState(ref, earned, c, taken) }));
  const missingCourses = mustStates.filter((m) => m.state === "missing").map((m) => m.ref);

  const start = firstOf(req.window.from);
  if (!start) {
    return newResult(req, {
      status: "unmet",
      current: internship,
      required: req.min,
      missing: { courses: missingCourses, credits: Math.max(0, req.min - internship), items: [] },
      reasons: [`${req.window.from} 미이수`],
      warnings,
      notes,
    });
  }

  const ends = req.window.to_max_of.filter((ref) => ref !== substituted).map((ref) => ({ ref, rec: firstOf(ref) }));
  const openEnds = ends.filter((e) => !e.rec).map((e) => e.ref);
  const endTerm = openEnds.length || ends.length === 0
    ? null
    : ends.map((e) => e.rec!.term).reduce((a, b) => (cmp(a, b) >= 0 ? a : b));
  const windowPlanned = isPlanned(start) || ends.some((e) => e.rec && isPlanned(e.rec));

  const cs = earned
    .filter((r) => r.design_credits > 0 && cmp(r.term, start.term) >= 0 && (endTerm === null || cmp(r.term, endTerm) <= 0))
    .map((r) => counted(r, r.design_credits));
  const current = sumValue(cs, false) + internship;
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
    warnings,
    notes,
  });
}
