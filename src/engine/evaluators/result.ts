import type { EvalContext } from "../context";
import { courseMatch, isPlanned, isUnknownCodeNameMatch, matchesRecord, termLabel } from "../records";
import type { Match } from "../schema";
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
    notes: [],
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

/**
 * 지정 과목(ref)에 해당하는 레코드. taken이 있으면 들은 과목은 포털 구분도 맞아야 한다 (계획 과목은 제외).
 */
export function findCourse(ref: string, earned: CourseRecord[], c: EvalContext, taken?: Match): CourseRecord[] {
  return earned.filter((r) => courseMatch(r, ref, c) !== null && (isPlanned(r) || !taken || matchesRecord(taken, r, c)));
}

/** 지정 과목의 이수 상태 (earned = 재수강 처리·F 제외 후 레코드) */
export function courseState(ref: string, earned: CourseRecord[], c: EvalContext, taken?: Match): CourseState {
  const hits = findCourse(ref, earned, c, taken);
  if (hits.some((r) => !isPlanned(r))) return "done";
  if (hits.length) return "planned";
  return "missing";
}

/** "이름으로 매칭됨" 메모 — 카탈로그에 없는 코드가 이름으로 지정 과목에 맞은 경우 */
export function nameMatchNotes(refs: string[], earned: CourseRecord[], c: EvalContext, taken?: Match): string[] {
  const notes = new Set<string>();
  for (const ref of refs) {
    for (const r of findCourse(ref, earned, c, taken)) {
      if (isUnknownCodeNameMatch(r, ref, c)) notes.add(`이름으로 매칭됨: ${r.name} (${r.code}) → ${ref}`);
    }
  }
  return [...notes];
}

export const recordLabel = (r: CourseRecord): string =>
  `${r.name} (${termLabel(r.term)}${r.section ? ` ${r.section}분반` : ""})`;
