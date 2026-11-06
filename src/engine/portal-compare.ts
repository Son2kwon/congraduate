/**
 * 엔진 결과 → 포털 화면 숫자 형식 (4단계 통합 검증용).
 * - 학교 기준: 요구사항의 portal_rows 이름 (이수내역 xlsx 행 이름)
 * - 공학인증: 이수현황 합계 표 (전문교양·BSM·공학주제·설계·인증총합·미지정·전체)
 * 값은 [취득, 기준] 또는 숫자 하나. basis "portal"은 포털 공학인증 구분 그대로, "rule"은 규칙 적용(pool 과목 → 전문교양).
 */
import type { EvaluateOutput } from "./evaluate";
import type { RequirementResult } from "./types";

export type PortalValue = number | [number, number];
export type PortalValues = { abeek: Record<string, PortalValue>; general: Record<string, PortalValue> };

/** 이수현황 합계 표의 항목 ↔ 공학인증 요구사항 id */
const ABEEK_ITEMS = { 전문교양: "a_prof_liberal", BSM: "a_bsm", 공학주제: "a_eng_topic" } as const;
const ABEEK_DESIGN = "a_design";
/** 이수현황의 구분값 '미지정' */
const UNASSIGNED = "미지정";
/** 이수내역 xlsx에서 요구사항이 없는 행 → 일반 이수구분 합계 */
const GENERAL_CATEGORY_ROWS = ["복수전공"];

const credited = (r: RequirementResult) => r.counted.filter((x) => !x.planned).reduce((s, x) => s + x.value, 0);

export function portalValues(out: EvaluateOutput, basis: "portal" | "rule"): PortalValues {
  const byId = new Map(out.abeek.map((r) => [r.id, r]));
  const need = (id: string) => {
    const r = byId.get(id);
    if (!r) throw new Error(`공학인증 요구사항 ${id} 결과 없음`);
    return r;
  };
  const current = (r: RequirementResult) => (basis === "portal" && r.portal_basis ? r.portal_basis.current : r.current);

  const abeek: Record<string, PortalValue> = {};
  let sumCur = 0;
  let sumReq = 0;
  for (const [label, id] of Object.entries(ABEEK_ITEMS)) {
    const r = need(id);
    abeek[label] = [current(r), r.required];
    sumCur += current(r);
    sumReq += r.required;
  }
  const design = need(ABEEK_DESIGN);
  abeek["설계"] = [design.current, design.required];
  abeek["인증총합"] = [sumCur, sumReq];
  abeek["미지정"] = out.summary.abeek[basis][UNASSIGNED]?.current ?? 0;
  abeek["전체"] = out.summary.total.current;

  const general: Record<string, PortalValue> = {};
  const reqById = new Map(out.general.requirements.map((q) => [q.id, q]));
  for (const r of out.general.results) {
    const q = reqById.get(r.id);
    const rows = q && "portal_rows" in q ? (q.portal_rows ?? []) : [];
    if (r.type === "groups_each_min_credits") {
      for (const g of r.groups ?? []) if (rows.includes(g.group)) general[g.group] = [g.current, g.required];
      continue;
    }
    // 과목 전부 이수: 포털은 학점으로 표시 → [반영 과목 학점 합, min_credits]
    const value: [number, number] =
      q?.type === "courses_all" ? [credited(r), q.min_credits ?? 0] : [r.current, r.required];
    for (const row of rows) general[row] = value;
  }
  for (const cat of GENERAL_CATEGORY_ROWS) general[cat] = out.summary.general[cat]?.current ?? 0;
  return { abeek, general };
}

export type CompareRow = { set: "abeek" | "general"; key: string; expected: PortalValue; actual: PortalValue | undefined; ok: boolean };

/** 정답과 엔진 값 대조. 정답이 숫자 하나면 엔진 값의 취득(첫 값)만 비교 */
export function compareWithExpected(expected: PortalValues, actual: PortalValues): CompareRow[] {
  const rows: CompareRow[] = [];
  for (const set of ["abeek", "general"] as const) {
    for (const [key, exp] of Object.entries(expected[set])) {
      const act = actual[set][key];
      let ok = false;
      if (act !== undefined) {
        const a = Array.isArray(act) ? act : [act, NaN];
        ok = Array.isArray(exp) ? a[0] === exp[0] && a[1] === exp[1] : a[0] === exp;
      }
      rows.push({ set, key, expected: exp, actual: act, ok });
    }
  }
  return rows;
}
