import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { compareWithExpected, portalValues } from "./portal-compare";
import { plan, realIndex, realRules, rec, student } from "./test-utils";

// 손으로 만든 작은 이수 기록
const records = () => [
  rec("글쓰기", { abeek_category: "전문교양", general_category: "교양", liberal_area: "공통교양", credits: 2 }),
  rec("한국사", { abeek_category: "미지정", general_category: "교양", liberal_area: "공통교양", credits: 2 }),
  rec("이산수학", { abeek_category: "BSM", general_category: "전공기초", credits: 3 }),
  rec("창의적설계", { abeek_category: "공학주제", general_category: "전공", credits: 3, design_credits: 3, term: "2022-1" }),
  rec("자료구조", { abeek_category: "공학주제", general_category: "전공필수", credits: 3 }),
  rec("가상생물", { abeek_category: "미지정", general_category: "복수전공", credits: 3 }),
  rec("가상자유", { abeek_category: "미지정", general_category: "자유선택", credits: 1 }),
  rec("가상핵심", { abeek_category: "미지정", general_category: "교양", liberal_area: "핵심-신뢰", credits: 3 }),
  plan("운영체제", { abeek_category: "공학주제", general_category: "전공필수", credits: 3 }),
];
const run = () => evaluate({ rules: realRules, courses: realIndex, records: records(), student: student() });

describe("전문교양: 포털 기준 값과 규칙 적용 값", () => {
  it("pool 요구사항은 포털 구분 그대로의 값(portal_basis)도 낸다", () => {
    const r = run().abeek.find((x) => x.id === "a_prof_liberal")!;
    expect(r.current).toBe(4); // 규칙 적용: 한국사(미지정)도 전문교양
    expect(r.portal_basis).toEqual({ current: 2, planned: 0 });
  });

  it("pool이 없는 요구사항에는 portal_basis가 없다", () => {
    expect(run().abeek.find((x) => x.id === "a_bsm")!.portal_basis).toBeUndefined();
  });
});

describe("영역별 합계 (summary)", () => {
  it("공학인증 구분별 합계 — 포털 기준과 규칙 적용(pool 과목을 전문교양으로)", () => {
    const s = run().summary;
    expect(s.abeek.portal["전문교양"]).toEqual({ current: 2, planned: 0 });
    expect(s.abeek.portal["미지정"]).toEqual({ current: 9, planned: 0 });
    expect(s.abeek.rule["전문교양"]).toEqual({ current: 4, planned: 0 });
    expect(s.abeek.rule["미지정"]).toEqual({ current: 7, planned: 0 });
    expect(s.abeek.portal["공학주제"]).toEqual({ current: 6, planned: 3 });
  });

  it("일반 이수구분별 합계와 전체", () => {
    const s = run().summary;
    expect(s.general["복수전공"]).toEqual({ current: 3, planned: 0 });
    expect(s.general["교양"]).toEqual({ current: 7, planned: 0 });
    expect(s.total).toEqual({ current: 20, planned: 3 });
  });
});

describe("포털 숫자 형식으로 옮기기 (portalValues)", () => {
  it("공학인증 7항목 + 학교 기준 15항목(정답 22개) + 선택교양(정답에 없는 xlsx 행)", () => {
    const v = portalValues(run(), "portal");
    expect(Object.keys(v.abeek).sort()).toEqual(["BSM", "공학주제", "미지정", "설계", "인증총합", "전문교양", "전체"].sort());
    expect(Object.keys(v.general)).toHaveLength(16);
    expect(v.general["선택교양"]).toEqual([0, 0]);
  });

  it("포털 기준: 전문교양·인증총합·미지정은 포털 구분 그대로", () => {
    const v = portalValues(run(), "portal").abeek;
    expect(v["전문교양"]).toEqual([2, 6]);
    expect(v["인증총합"]).toEqual([2 + 3 + 6, 6 + 18 + 60]);
    expect(v["미지정"]).toBe(9);
    expect(v["전체"]).toBe(20);
  });

  it("규칙 적용: pool 과목이 전문교양으로 옮겨 간다", () => {
    const v = portalValues(run(), "rule").abeek;
    expect(v["전문교양"]).toEqual([4, 6]);
    expect(v["인증총합"]).toEqual([4 + 3 + 6, 84]);
    expect(v["미지정"]).toBe(7);
  });

  it("학교 기준은 portal_rows 이름으로: 과목 전부 이수는 학점 합계, 영역별 최소는 영역마다", () => {
    const v = portalValues(run(), "portal").general;
    expect(v["공통교양-기타"]).toEqual([2, 10]); // 한국사 2학점
    expect(v["핵심-신뢰"]).toEqual([3, 3]);
    expect(v["핵심-도전"]).toEqual([0, 3]);
    expect(v["전공필수"]).toEqual([3, 12]);
    expect(v["교양"]).toEqual([7, 45]);
    expect(v["복수전공"]).toBe(3);
    expect(v["자유선택"]).toEqual([1, 0]); // 요구사항 값은 [취득, 기준]. 정답이 숫자 하나면 대조 때 취득값만 비교
    expect(v["졸업"]).toEqual([20, 140]);
  });
});

describe("정답 대조 (compareWithExpected)", () => {
  it("항목마다 정답·엔진 값·일치 여부. 정답이 숫자 하나면 취득값만 비교", () => {
    const rows = compareWithExpected({ abeek: { A: [1, 2], B: 3 }, general: { C: [4, 5] } }, { abeek: { A: [1, 2], B: [3, 0] }, general: { C: [4, 6] } });
    expect(rows).toEqual([
      { set: "abeek", key: "A", expected: [1, 2], actual: [1, 2], ok: true },
      { set: "abeek", key: "B", expected: 3, actual: [3, 0], ok: true },
      { set: "general", key: "C", expected: [4, 5], actual: [4, 6], ok: false },
    ]);
  });

  it("엔진 값이 없으면 불일치", () => {
    expect(compareWithExpected({ abeek: { A: 1 }, general: {} }, { abeek: {}, general: {} })[0]!.ok).toBe(false);
  });
});
