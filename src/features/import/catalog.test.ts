import { describe, expect, it } from "vitest";
import { buildCatalog, searchCatalog, catalogRecord } from "./catalog";

const catalog = buildCatalog({ courses: [
  { name: "가상 설계", aliases: ["옛가상설계"], codes: ["11111", "22222"], credits: 3, general: { category: "전공" }, abeek: { category: "공학주제", design_credits: 2 } },
  { name: "코드없는가상", aliases: [], credits: null, general: { category: null }, abeek: { category: null, design_credits: 0 } },
] }, { common: [{ code: "33333", name: "가상글쓰기", aliases: ["가상작문"], credits: 2 }], courses: [{ code: "44444", name: "가상핵심", credits: 3, area: "핵심-도전" }], other: [{ code: "55555", name: "가상세미나", credits: 0.5, general_category: "자유선택" }] });
describe("수동 입력 카탈로그", () => {
  it("이름 공백·대소문자·별칭·코드로 검색한다", () => {
    expect(searchCatalog(catalog, "가상설계").map(c => c.code)).toEqual(["11111", "22222"]);
    expect(searchCatalog(catalog, "옛가상설계")).toHaveLength(2);
    expect(searchCatalog(catalog, "44444")[0]?.name).toBe("가상핵심");
    expect(searchCatalog(catalog, "가상작문")[0]?.code).toBe("33333");
    expect(searchCatalog(catalog, "없는과목")).toEqual([]);
  });
  it("서로 다른 코드를 이름으로 합치지 않는다", () => {
    expect(searchCatalog(catalog, "가상 설계")).toHaveLength(2);
  });
  it("카탈로그 값을 수동 레코드 기본값으로 제공한다", () => {
    expect(catalogRecord(searchCatalog(catalog, "11111")[0]!, { year: 2024, season: "S" })).toMatchObject({ code: "11111", credits: 3, design_credits: 2, general_category: "전공", abeek_category: "공학주제", source: "manual", term: { year: 2024, season: "S" }, grade: null });
  });
  it("교양의 영역과 기타 과목의 이수구분을 보존한다", () => {
    expect(catalogRecord(searchCatalog(catalog, "44444")[0]!, { year: 2024, season: "1" })).toMatchObject({ general_category: "교양", liberal_area: "핵심-도전" });
    expect(searchCatalog(catalog, "55555")[0]?.general_category).toBe("자유선택");
  });
  it("카탈로그의 모르는 학점은 0으로 확정하지 않고 입력을 요구한다", () => {
    expect(searchCatalog(catalog, "코드없는가상")[0]?.credits).toBeNull();
    expect(() => catalogRecord(searchCatalog(catalog, "코드없는가상")[0]!, { year: 2024, season: "1" })).toThrow(/학점/);
  });
});
