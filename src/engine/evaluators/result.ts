import type { EvalContext } from "../context";
import { isPlanned, sameCourse, termLabel } from "../records";
import type { CountedCourse, CourseRecord, RequirementResult, Status } from "../types";

type Req = { id: string; label: string; type: string };

export function newResult(req: Req, fields: Partial<RequirementResult> & Pick<RequirementResult, "status">): RequirementResult {
  return {
    id: req.id,
    label: req.label,
    type: req.type,
    current: 0,
    planned: 0,
    required: 0,
    counted: [],
    missing: { courses: [], credits: 0, items: [] },
    reasons: [],
    warnings: [],
    ...fields,
  };
}

/** 들은 것만으로 충족 → met, 계획까지 더해 충족 → tentative, 아니면 unmet */
export const statusOf = (doneOk: boolean, withPlanOk: boolean): Status =>
  doneOk ? "met" : withPlanOk ? "tentative" : "unmet";

export const counted = (r: CourseRecord, value: number): CountedCourse => ({
  code: r.code,
  name: r.name,
  term: r.term,
  value,
  planned: isPlanned(r),
});

export const sumValue = (cs: CountedCourse[], planned: boolean): number =>
  cs.filter((x) => x.planned === planned).reduce((s, x) => s + x.value, 0);

export type CourseState = "done" | "planned" | "missing";

/** 과목 참조의 이수 상태 (earned = 재수강 처리·F 제외 후 레코드) */
export function courseState(ref: string, earned: CourseRecord[], c: EvalContext): CourseState {
  const hits = earned.filter((r) => sameCourse(r, ref, c));
  if (hits.some((r) => !isPlanned(r))) return "done";
  if (hits.length) return "planned";
  return "missing";
}

export const recordLabel = (r: CourseRecord): string =>
  `${r.name} (${termLabel(r.term)}${r.section ? ` ${r.section}분반` : ""})`;
