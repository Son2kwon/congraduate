import type { Season, Term } from "../engine/types";

/** 공학교육인증 이수현황의 과목 한 줄 */
export type AbeekStatusRow = {
  /** 이수구분 = 공학인증 구분 */
  abeek_category: string;
  term: Term;
  code: string;
  section: string;
  name: string;
  grade: string;
  credits: number;
  design_credits: number;
  /** 영어강의 O/X. 칸이 없으면 null */
  english_lecture: boolean | null;
  /** 재수강 여부 O */
  retake: boolean;
};

const CATEGORY = "(전문교양|BSM|MSC|공학주제|미지정|기타)";
const NUM = "(\\d+(?:\\.\\d+)?)";

/**
 * 이수구분 · 년도/학기 · 과목코드 · 분반 · 과목명 · 성적 · 학점(설계학점) · 영어강의 · 재수강 여부
 * 영어강의는 항상 O/X가 있다고 보고, 그 뒤 O/X를 재수강 여부로 읽는다.
 */
const ROW = new RegExp(
  `^${CATEGORY}\\t(\\d{4})/(1|2|S|W)\\t(\\d{5})\\t(\\d{1,3})\\t(.+?)\\t(\\S+)\\t${NUM}\\(${NUM}\\)(?:\\t([OX]))?(?:\\t([OX]))?$`,
);
/** 과목 줄처럼 시작하는 줄 — ROW에 안 맞으면 unparsed로 알린다 */
const LOOKS_LIKE_ROW = new RegExp(`^${CATEGORY}\\t\\d{4}/`);

/** 이수현황 텍스트(칸=탭, 줄=줄바꿈) → 과목 행. 소계·총계·합계 표·머리글·신원 정보는 읽지 않는다 */
export function parseAbeekStatusText(text: string): { rows: AbeekStatusRow[]; unparsed: string[] } {
  const rows: AbeekStatusRow[] = [];
  const unparsed: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const m = ROW.exec(line);
    if (!m) {
      if (LOOKS_LIKE_ROW.test(line)) unparsed.push(line);
      continue;
    }
    const [, category, year, season, code, section, name, grade, credits, design, english, retake] = m;
    rows.push({
      abeek_category: category!,
      term: { year: Number(year), season: season as Season },
      code: code!,
      section: section!,
      name: name!.trim(),
      grade: grade!,
      credits: Number(credits),
      design_credits: Number(design),
      english_lecture: english === undefined ? null : english === "O",
      retake: retake === "O",
    });
  }
  return { rows, unparsed };
}
