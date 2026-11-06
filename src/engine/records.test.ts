import { describe, expect, it } from "vitest";
import { compareTerm, earnedRecords, effectiveRecords, isFailed, matchesRecord, sameCourse } from "./records";
import { ctx, rec, t } from "./test-utils";

const order = ["1", "S", "2", "W"] as const;

describe("학기 순서 (1 < S < 2 < W)", () => {
  it("같은 해에서 1 < S < 2 < W", () => {
    expect(compareTerm(t("2023-1"), t("2023-S"), [...order])).toBeLessThan(0);
    expect(compareTerm(t("2023-S"), t("2023-2"), [...order])).toBeLessThan(0);
    expect(compareTerm(t("2023-2"), t("2023-W"), [...order])).toBeLessThan(0);
  });

  it("해가 다르면 해가 먼저", () => {
    expect(compareTerm(t("2023-W"), t("2024-1"), [...order])).toBeLessThan(0);
  });

  it("같은 학기는 0", () => {
    expect(compareTerm(t("2023-2"), t("2023-2"), [...order])).toBe(0);
  });
});

describe("F·NP 제외", () => {
  it("F와 NP는 미취득", () => {
    expect(isFailed(rec("가", { grade: "F" }))).toBe(true);
    expect(isFailed(rec("가", { grade: "NP" }))).toBe(true);
    expect(isFailed(rec("가", { grade: "P" }))).toBe(false);
    expect(isFailed(rec("가", { grade: "C0" }))).toBe(false);
  });

  it("earnedRecords는 F·NP 과목을 뺀다", () => {
    const a = rec("가", { grade: "A0" });
    const f = rec("나", { grade: "F" });
    expect(earnedRecords([a, f], ctx())).toEqual([a]);
  });
});

describe("재수강: 재수강 여부=O면 같은 코드의 이전 기록을 뺀다", () => {
  it("마지막 기록만 남는다 (이전 기록이 더 높은 등급이어도)", () => {
    const first = rec("자료구조", { code: "40989", term: "2022-2", grade: "D0" });
    const again = rec("자료구조", { code: "40989", term: "2023-2", grade: "B0", retake: true });
    expect(effectiveRecords([first, again], ctx())).toEqual([again]);
  });

  it("재수강 기록이 F면 그 과목은 미취득", () => {
    const first = rec("자료구조", { code: "40989", term: "2022-2", grade: "C0" });
    const again = rec("자료구조", { code: "40989", term: "2023-2", grade: "F", retake: true });
    expect(earnedRecords([first, again], ctx())).toEqual([]);
  });

  it("재수강 표시가 없으면 같은 코드라도 둘 다 남긴다", () => {
    const a = rec("세미나", { code: "11111", term: "2022-1" });
    const b = rec("세미나", { code: "11111", term: "2023-1" });
    expect(effectiveRecords([a, b], ctx())).toHaveLength(2);
  });

  it("같은 이름이라도 코드가 다르면 다른 과목 — 재수강으로 지우지 않는다", () => {
    const free = rec("자료구조", { code: "56116", term: "2022-2", general_category: "자유선택" });
    const req = rec("자료구조", { code: "40989", term: "2023-2", general_category: "전공필수", retake: true });
    expect(effectiveRecords([free, req], ctx())).toEqual([free, req]);
  });

  it("계획 과목의 재수강도 이전 기록을 대체한다", () => {
    const first = rec("운영체제", { code: "12345", term: "2023-2", grade: "F" });
    const again = rec("운영체제", { code: "12345", term: "2025-1", grade: null, source: "plan", retake: true });
    expect(effectiveRecords([first, again], ctx())).toEqual([again]);
  });
});

describe("과목 이름 참조", () => {
  it("카탈로그 별칭과 공백 차이를 같은 과목으로 본다", () => {
    expect(sameCourse(rec("한국사(2학년 대상)"), "한국사", ctx())).toBe(true);
    expect(sameCourse(rec("Communication in English"), "COMMUNICATION IN ENGLISH", ctx())).toBe(true);
    expect(sameCourse(rec("비즈니스 인텔리전스"), "비즈니스인텔리전스", ctx())).toBe(true);
  });

  it("다른 과목은 다르다", () => {
    expect(sameCourse(rec("일반물리(1)"), "일반물리실험(1)", ctx())).toBe(false);
  });
});

describe("match", () => {
  it('"all"은 모든 과목', () => {
    expect(matchesRecord("all", rec("가"), ctx())).toBe(true);
  });

  it("일반 이수구분 중 하나와 같으면 매칭", () => {
    const m = { "general.category": ["전공필수", "전공"] as [string, ...string[]] };
    expect(matchesRecord(m, rec("가", { general_category: "전공" }), ctx())).toBe(true);
    expect(matchesRecord(m, rec("가", { general_category: "전공기초" }), ctx())).toBe(false);
  });

  it('"교양"은 category_groups로 풀어 공통·핵심·선택교양에 매칭', () => {
    const m = { "general.category": ["교양"] as [string, ...string[]] };
    expect(matchesRecord(m, rec("가", { general_category: "공통교양" }), ctx())).toBe(true);
    expect(matchesRecord(m, rec("가", { general_category: "핵심교양" }), ctx())).toBe(true);
    expect(matchesRecord(m, rec("가", { general_category: "선택교양" }), ctx())).toBe(true);
    expect(matchesRecord(m, rec("가", { general_category: "자유선택" }), ctx())).toBe(false);
  });

  it("공학인증 구분", () => {
    const m = { "abeek.category": ["BSM"] as [string, ...string[]] };
    expect(matchesRecord(m, rec("가", { abeek_category: "BSM" }), ctx())).toBe(true);
    expect(matchesRecord(m, rec("가", { abeek_category: "미지정" }), ctx())).toBe(false);
  });

  it("교양영역과 접두어", () => {
    expect(matchesRecord({ "liberal.area": ["핵심-도전"] }, rec("가", { liberal_area: "핵심-도전" }), ctx())).toBe(true);
    expect(matchesRecord({ "liberal.area_prefix": "선택-" }, rec("가", { liberal_area: "선택-소통" }), ctx())).toBe(true);
    expect(matchesRecord({ "liberal.area_prefix": "선택-" }, rec("가", { liberal_area: "핵심-소통" }), ctx())).toBe(false);
  });

  it("여러 키는 AND", () => {
    const m = { "liberal.area": ["공통교양"] as [string, ...string[]], course: ["글쓰기"] as [string, ...string[]] };
    expect(matchesRecord(m, rec("글쓰기", { liberal_area: "공통교양" }), ctx())).toBe(true);
    expect(matchesRecord(m, rec("창의와소통", { liberal_area: "공통교양" }), ctx())).toBe(false);
    expect(matchesRecord(m, rec("글쓰기", { liberal_area: null }), ctx())).toBe(false);
  });
});
