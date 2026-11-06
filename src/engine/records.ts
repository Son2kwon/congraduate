import type { EvalContext } from "./context";
import type { Match } from "./schema";
import type { CourseRecord, Season, Term } from "./types";

/** 학기 비교. 음수면 a가 먼저 (순서는 규칙 counting.term_order) */
export function compareTerm(a: Term, b: Term, order: Season[]): number {
  if (a.year !== b.year) return a.year - b.year;
  return order.indexOf(a.season) - order.indexOf(b.season);
}

export const termLabel = (t: Term): string => `${t.year}-${t.season}`;

/** F·NP는 취득학점이 없다 */
export const isFailed = (r: CourseRecord): boolean => r.grade === "F" || r.grade === "NP";

export const isPlanned = (r: CourseRecord): boolean => r.source === "plan";

/** 과목 식별 키: 과목코드. 코드가 없는 계획 과목만 과목명으로 */
export function courseIdentity(r: CourseRecord, c: EvalContext): string {
  return r.code ?? `name:${c.courses.canonical(r.name)}`;
}

/**
 * 재수강 처리: 재수강 여부=O인 기록이 있으면, 같은 과목(코드)의 그보다 이전 기록을 뺀다.
 * 재수강 표시가 없으면 같은 코드라도 모두 남긴다.
 */
export function effectiveRecords(records: CourseRecord[], c: EvalContext): CourseRecord[] {
  return records.filter((r) => {
    const id = courseIdentity(r, c);
    return !records.some(
      (o) => o !== r && o.retake && courseIdentity(o, c) === id && compareTerm(r.term, o.term, c.termOrder) < 0,
    );
  });
}

/** 재수강 처리 후 F·NP를 뺀 취득 과목 */
export function earnedRecords(records: CourseRecord[], c: EvalContext): CourseRecord[] {
  return effectiveRecords(records, c).filter((r) => !isFailed(r));
}

const CODE = /^\d{5}$/;

/**
 * 과목 참조(CourseRef)와 같은 과목인지, 어떻게 맞았는지.
 * 과목코드가 같거나 공백 뺀 과목명(카탈로그 별칭 포함)이 같으면 같은 과목 (사용자 결정 2026-11-07).
 * 카탈로그 코드는 빠른 비교용 — 같은 이름 다른 과목의 구분은 규칙의 taken_match(포털 구분 확인)가 맡는다.
 */
export function courseMatch(r: CourseRecord, ref: string, c: EvalContext): "code" | "name" | null {
  const name = c.courses.canonical(r.name);
  if (CODE.test(ref)) {
    if (r.code === ref) return "code";
    return c.courses.nameOfCode(ref) === name ? "name" : null;
  }
  if (r.code && c.courses.codesOf(ref)?.includes(r.code)) return "code";
  return name === c.courses.canonical(ref) ? "name" : null;
}

export const sameCourse = (r: CourseRecord, ref: string, c: EvalContext): boolean => courseMatch(r, ref, c) !== null;

/** 카탈로그에 코드가 있는데 레코드 코드가 그중에 없어 이름으로 맞은 경우 */
export function isUnknownCodeNameMatch(r: CourseRecord, ref: string, c: EvalContext): boolean {
  return !!r.code && !!c.courses.codesOf(ref)?.length && courseMatch(r, ref, c) === "name";
}

/** 묶음 이름(예: "교양")은 그 이름 자체와 구성 이수구분(공통·핵심·선택교양)으로 푼다 */
function expandCategories(values: string[], c: EvalContext): Set<string> {
  return new Set(values.flatMap((v) => [v, ...(c.categoryGroups[v] ?? [])]));
}

/** match 조건 (키끼리 AND, 값끼리 OR) */
export function matchesRecord(m: Match, r: CourseRecord, c: EvalContext): boolean {
  if (m === "all") return true;
  const g = m["general.category"];
  if (g && !(r.general_category && expandCategories(g, c).has(r.general_category))) return false;
  const a = m["abeek.category"];
  if (a && !(r.abeek_category && a.includes(r.abeek_category))) return false;
  const area = m["liberal.area"];
  if (area && !(r.liberal_area && area.includes(r.liberal_area))) return false;
  const prefix = m["liberal.area_prefix"];
  if (prefix && !r.liberal_area?.startsWith(prefix)) return false;
  if (m.course && !m.course.some((ref) => sameCourse(r, ref, c))) return false;
  return true;
}
