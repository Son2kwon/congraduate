import { describe, expect, it } from "vitest";
import { evaluate, resolveGeneral } from "./evaluate";
import type { SchoolStandardOverride } from "./schema";
import { plan, realIndex, realRules, rec, student } from "./test-utils";

const general = realRules.rule_sets.general;
const req = (rs: { id: string }[], id: string) => rs.find((r) => r.id === id) as Record<string, unknown>;
const xlsx = (rows: [string, number | null][]): SchoolStandardOverride => ({
  source: "grad_summary_xlsx",
  rows: rows.map(([name, criterion]) => ({ name, criterion })),
});

describe("resolveGeneral — 학교 기준 (decisions.md 14번)", () => {
  it('xlsx가 없으면 규칙 기본값 그대로, basis "default_2022"', () => {
    const g = resolveGeneral(general);
    expect(g.basis).toBe("default_2022");
    expect(g.requirements).toEqual(general.requirements);
    expect(g.unknown_rows).toEqual([]);
  });

  it("행 이름이 portal_rows와 같으면 기준값을 xlsx 값으로 바꾼다 (최소·최대·과목 전부 이수의 min_credits)", () => {
    const g = resolveGeneral(general, xlsx([["전공", 72], ["교양", 50], ["공통교양-기타", 8], ["졸업", 130]]));
    expect(g.basis).toBe("xlsx");
    expect(req(g.requirements, "g_major").min).toBe(72);
    expect(req(g.requirements, "g_liberal_cap").max).toBe(50);
    expect(req(g.requirements, "g_common_etc").min_credits).toBe(8);
    expect(req(g.requirements, "g_total").min).toBe(130);
    expect(g.overridden.g_major).toEqual([{ name: "전공", criterion: 72 }]);
  });

  it("영역별 최소는 영역마다 따로 바꾼다 (min_by_group)", () => {
    const g = resolveGeneral(general, xlsx([["핵심-도전", 3], ["핵심-소통", 0]]));
    expect(req(g.requirements, "g_core").min_by_group).toEqual({ "핵심-도전": 3, "핵심-소통": 0 });
    expect(req(g.requirements, "g_core").min_each).toBe(3);
  });

  it("규칙에 없는 행은 버리지 않고 unknown_rows로 남긴다", () => {
    const g = resolveGeneral(general, xlsx([["전공", 84], ["복수전공", 36], ["새로운영역", 3]]));
    expect(g.unknown_rows).toEqual([
      { name: "복수전공", criterion: 36 },
      { name: "새로운영역", criterion: 3 },
    ]);
  });

  it("행 이름 앞뒤 공백은 무시한다", () => {
    const g = resolveGeneral(general, xlsx([[" 전공기초 ", 18]]));
    expect(req(g.requirements, "g_major_basic").min).toBe(18);
  });

  it("이수기준이 빈칸(null)이면 기본값을 유지한다", () => {
    const g = resolveGeneral(general, xlsx([["전공", null]]));
    expect(req(g.requirements, "g_major").min).toBe(84);
    expect(g.overridden.g_major).toBeUndefined();
  });

  it("portal_rows가 없는 요구사항(CAU세미나)은 규칙 값 그대로", () => {
    const g = resolveGeneral(general, xlsx([["CAU세미나", 0]]));
    expect(req(g.requirements, "g_cau_seminar")).toEqual(req(general.requirements, "g_cau_seminar"));
    expect(g.unknown_rows).toEqual([{ name: "CAU세미나", criterion: 0 }]);
  });

  it("규칙 객체를 바꾸지 않는다", () => {
    const before = JSON.stringify(general);
    resolveGeneral(general, xlsx([["전공", 1], ["핵심-도전", 0]]));
    expect(JSON.stringify(general)).toBe(before);
  });
});

describe("evaluate — 전체 판정", () => {
  const run = (records = [rec("가")], s = student(), standard?: SchoolStandardOverride) =>
    evaluate({ rules: realRules, courses: realIndex, records, student: s, standard });

  it("규칙의 모든 요구사항에 결과를 하나씩 낸다", () => {
    const out = run();
    const ids = [...out.general.results, ...out.abeek, ...out.non_credit].map((r) => r.id);
    const ruleIds = [...general.requirements, ...realRules.rule_sets.abeek.requirements, ...realRules.non_credit].map((r) => r.id);
    expect(ids).toEqual(ruleIds);
  });

  it("학교 기준의 basis를 함께 돌려준다", () => {
    expect(run().general.basis).toBe("default_2022");
    const out = run([rec("가", { general_category: "전공", credits: 3 })], student(), xlsx([["전공", 3]]));
    expect(out.general.basis).toBe("xlsx");
    expect(out.general.results.find((r) => r.id === "g_major")?.status).toBe("met");
  });

  it("학번에 따라 공학인증 필수가 달라진다 (2025 vs 2026)", () => {
    const six = ["자료구조", "컴퓨터구조", "소프트웨어공학", "운영체제", "프로그래밍언어론", "알고리즘"].map((n) => rec(n));
    const status = (y: number) => run(six, student({ entry_year: y })).abeek.find((r) => r.id === "a_required")?.status;
    expect(status(2025)).toBe("met");
    expect(status(2026)).toBe("unmet");
  });

  it("계획 과목은 결과에서 planned로 구분된다", () => {
    const out = run([rec("가", { general_category: "전공", credits: 3 }), plan("나", { general_category: "전공", credits: 3 })]);
    const major = out.general.results.find((r) => r.id === "g_major")!;
    expect(major.current).toBe(3);
    expect(major.planned).toBe(3);
    expect(major.counted.filter((c) => c.planned).map((c) => c.name)).toEqual(["나"]);
  });

  it("지원 학번(2018~2026) 밖이면 오류", () => {
    expect(() => run([], student({ entry_year: 2017 }))).toThrow(/2018~2026/);
    expect(() => run([], student({ entry_year: 2027 }))).toThrow(/2018~2026/);
  });
});
