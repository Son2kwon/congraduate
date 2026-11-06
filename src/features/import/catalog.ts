import type { CourseRecord, Term } from "../../engine/types";

export type CatalogEntry = {
  code: string | null; name: string; aliases: string[]; credits: number | null;
  design_credits: number; general_category: string | null; liberal_area: string | null; abeek_category: string | null;
};
type MajorInput = { courses: { name: string; aliases: string[]; codes?: string[]; credits: number | null; general: { category: string | null }; abeek: { category: string | null; design_credits: number } }[] };
type LiberalInput = {
  common: { code: string; name: string; aliases: string[]; credits: number }[];
  courses: { code: string; name: string; credits: number; area: string }[];
  other: { code: string; name: string; credits: number; general_category: string }[];
};
export function buildCatalog(major: MajorInput, liberal: LiberalInput): CatalogEntry[] {
  return [
    ...major.courses.flatMap(c => (c.codes?.length ? c.codes : [null]).map(code => ({ code, name: c.name, aliases: c.aliases, credits: c.credits, design_credits: c.abeek.design_credits, general_category: c.general.category, liberal_area: null, abeek_category: c.abeek.category }))),
    ...liberal.common.map(c => ({ code: c.code, name: c.name, aliases: c.aliases, credits: c.credits, design_credits: 0, general_category: "교양", liberal_area: "공통교양", abeek_category: null })),
    ...liberal.courses.map(c => ({ code: c.code, name: c.name, aliases: [], credits: c.credits, design_credits: 0, general_category: "교양", liberal_area: c.area, abeek_category: null })),
    ...liberal.other.map(c => ({ code: c.code, name: c.name, aliases: [], credits: c.credits, design_credits: 0, general_category: c.general_category, liberal_area: null, abeek_category: null })),
  ];
}
const normalize = (s: string) => s.replace(/\s+/g, "").toUpperCase();
export const searchCatalog = (catalog: CatalogEntry[], query: string): CatalogEntry[] => {
  const q = normalize(query);
  return q ? catalog.filter(c => [c.code ?? "", c.name, ...c.aliases].some(s => normalize(s).includes(q))) : [];
};
export function catalogRecord(c: CatalogEntry, term: Term): CourseRecord {
  if (c.credits === null) throw new Error("학점을 직접 입력해 주세요.");
  return { code: c.code, section: null, name: c.name, credits: c.credits, design_credits: c.design_credits, general_category: c.general_category, liberal_area: c.liberal_area, abeek_category: c.abeek_category, grade: null, english: null, retake: false, source: "manual", term };
}
