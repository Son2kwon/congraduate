import type { EnglishLecture, Season, Term } from "../engine/types";

/** 졸업관련성적내역의 과목 한 줄 */
export type GradDetailRow = {
  term: Term;
  /** 이수구분 (전공기초·전공·전공필수·교양·자유선택·복수전공 …) */
  general_category: string;
  /** 영역구분 (공통교양, 핵심-신뢰 …). 없으면 null */
  liberal_area: string | null;
  code: string;
  section: string;
  name: string;
  credits: number;
  grade: string;
  english: EnglishLecture;
};

const SEASONS: Record<string, Season> = { "1": "1", "2": "2", 하계: "S", 동계: "W" };

/** 년도 · 학기 · 이수구분 · [영역구분] · 교과목-분반 · 과목 · 학점 · 등급 · [평점] · [원어구분] */
const ROW =
  /^(\d{4})\t(1|2|하계|동계)\t([^\t]+)\t(?:([^\t]+)\t)?(\d{5})-(\d{1,3})\t(.+?)\t(\d+(?:\.\d+)?)\t([^\t]+)(?:\t(\d+(?:\.\d+)?))?(?:\t\(영어([AB])\))?$/;
const LOOKS_LIKE_ROW = /^\d{4}\t(1|2|하계|동계)\t/;

/** 성적내역 텍스트(칸=탭, 줄=줄바꿈) → 과목 행 */
export function parseGradDetailText(text: string): { rows: GradDetailRow[]; unparsed: string[] } {
  const rows: GradDetailRow[] = [];
  const unparsed: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    // PDF에서 "핵심-" / "신뢰"처럼 영역이 두 칸으로 갈라지는 경우를 합친다
    const line = raw.trim().replace(/(핵심|선택)-\s*\t\s*/g, "$1-");
    const m = ROW.exec(line);
    if (!m) {
      if (LOOKS_LIKE_ROW.test(line)) unparsed.push(line);
      continue;
    }
    const [, year, season, category, area, code, section, name, credits, grade, , english] = m;
    rows.push({
      term: { year: Number(year), season: SEASONS[season!]! },
      general_category: category!.trim(),
      liberal_area: area ? area.replace(/\s+/g, "") : null,
      code: code!,
      section: section!,
      name: name!.trim(),
      credits: Number(credits),
      grade: grade!.trim(),
      english: english === "A" || english === "B" ? english : null,
    });
  }
  return { rows, unparsed };
}
