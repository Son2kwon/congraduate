import type { CourseRecord, Term } from "../engine/types";
import type { AbeekStatusRow } from "./abeek-status";
import type { GradDetailRow } from "./grad-detail";

export type MergeResult = {
  records: CourseRecord[];
  /** 이수현황에만 있는 과목 */
  only_abeek_status: CourseRecord[];
  /** 성적내역에만 있는 과목 */
  only_grad_detail: CourseRecord[];
  warnings: string[];
};

const sameTerm = (a: Term, b: Term) => a.year === b.year && a.season === b.season;
const label = (code: string, t: Term) => `${code} ${t.year}-${t.season}`;

/**
 * 두 PDF를 과목코드 + 학기 (+ 분반)로 합친다.
 * - 이수현황: 공학인증 구분·설계학점·재수강 (과목명도 이쪽을 쓴다 — 공백이 끼지 않음)
 * - 성적내역: 이수구분·영역·등급·원어구분·학점
 * 한쪽에만 있는 과목은 버리지 않고 표시한다.
 */
export function mergePortalRecords(abeek: AbeekStatusRow[], grad: GradDetailRow[]): MergeResult {
  const records: CourseRecord[] = [];
  const only_abeek_status: CourseRecord[] = [];
  const warnings: string[] = [];
  const used = new Set<GradDetailRow>();

  for (const a of abeek) {
    const candidates = grad.filter((g) => !used.has(g) && g.code === a.code && sameTerm(g.term, a.term));
    const g = candidates.find((x) => x.section === a.section) ?? candidates[0];
    if (!g) {
      const r: CourseRecord = {
        code: a.code,
        section: a.section,
        name: a.name,
        term: a.term,
        credits: a.credits,
        design_credits: a.design_credits,
        grade: a.grade,
        general_category: null,
        liberal_area: null,
        abeek_category: a.abeek_category,
        english: null,
        retake: a.retake,
        source: "abeek_status",
      };
      records.push(r);
      only_abeek_status.push(r);
      continue;
    }
    used.add(g);
    if (g.section !== a.section) warnings.push(`${label(a.code, a.term)}: 분반이 다름 (${a.section} / ${g.section})`);
    if (g.credits !== a.credits) warnings.push(`${label(a.code, a.term)}: 학점이 다름 (이수현황 ${a.credits} / 성적내역 ${g.credits})`);
    if (a.english_lecture !== null && a.english_lecture !== (g.english !== null)) {
      warnings.push(`${label(a.code, a.term)}: 영어강의 표시가 다름 (이수현황 ${a.english_lecture ? "O" : "X"} / 성적내역 원어구분 ${g.english ?? "없음"})`);
    }
    records.push({
      code: a.code,
      section: a.section,
      name: a.name,
      term: a.term,
      credits: g.credits,
      design_credits: a.design_credits,
      grade: g.grade,
      general_category: g.general_category,
      liberal_area: g.liberal_area,
      abeek_category: a.abeek_category,
      english: g.english,
      retake: a.retake,
      source: "portal",
    });
  }

  const only_grad_detail: CourseRecord[] = grad
    .filter((g) => !used.has(g))
    .map((g) => ({
      code: g.code,
      section: g.section,
      name: g.name,
      term: g.term,
      credits: g.credits,
      design_credits: 0,
      grade: g.grade,
      general_category: g.general_category,
      liberal_area: g.liberal_area,
      abeek_category: null,
      english: g.english,
      retake: false,
      source: "grad_detail",
    }));
  records.push(...only_grad_detail);
  return { records, only_abeek_status, only_grad_detail, warnings };
}
