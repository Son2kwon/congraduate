import { describe, expect, it } from "vitest";
import type { CoursesAll, CreditsMax, CreditsMin, GroupsEachMinCredits } from "../schema";
import { ctx, plan, realRules, rec, student } from "../test-utils";
import { evalCoursesAll, evalCreditsMax, evalCreditsMin, evalGroupsEachMinCredits } from "./credit";

const abeekReq = (id: string) => realRules.rule_sets.abeek.requirements.find((r) => r.id === id)!;

const majorMin: CreditsMin = {
  id: "x_major",
  label: "전공",
  type: "credits_min",
  match: { "general.category": ["전공필수", "전공"] },
  min: 9,
};

describe("credits_min (최소학점)", () => {
  it("match된 취득 과목 학점을 더하고, 기준 이상이면 충족", () => {
    const rs = [
      rec("가", { general_category: "전공", credits: 3 }),
      rec("나", { general_category: "전공필수", credits: 3 }),
      rec("다", { general_category: "전공", credits: 3 }),
      rec("라", { general_category: "전공기초", credits: 3 }),
    ];
    const r = evalCreditsMin(majorMin, rs, ctx());
    expect(r.status).toBe("met");
    expect(r.current).toBe(9);
    expect(r.required).toBe(9);
    expect(r.counted.map((c) => c.name)).toEqual(["가", "나", "다"]);
  });

  it("부족하면 미충족, 부족 학점 표시", () => {
    const r = evalCreditsMin(majorMin, [rec("가", { general_category: "전공", credits: 3 })], ctx());
    expect(r.status).toBe("unmet");
    expect(r.missing.credits).toBe(6);
  });

  it("F 과목은 학점에 넣지 않는다", () => {
    const rs = [
      rec("가", { general_category: "전공", credits: 6 }),
      rec("나", { general_category: "전공", credits: 3, grade: "F" }),
    ];
    const r = evalCreditsMin(majorMin, rs, ctx());
    expect(r.current).toBe(6);
    expect(r.status).toBe("unmet");
  });

  it("계획 과목으로만 채워지면 잠정, 계획 학점은 따로", () => {
    const rs = [rec("가", { general_category: "전공", credits: 6 }), plan("나", { general_category: "전공", credits: 3 })];
    const r = evalCreditsMin(majorMin, rs, ctx());
    expect(r.status).toBe("tentative");
    expect(r.current).toBe(6);
    expect(r.planned).toBe(3);
    expect(r.missing.credits).toBe(0);
    expect(r.counted.find((c) => c.name === "나")?.planned).toBe(true);
  });

  it("must_include 과목이 없으면 학점이 충분해도 미충족", () => {
    const bsm = abeekReq("a_bsm") as CreditsMin;
    const rs = Array.from({ length: 6 }, (_, i) => rec(`수학${i}`, { abeek_category: "BSM", credits: 3 }));
    rs.push(rec("일반물리실험(1)", { abeek_category: "BSM", credits: 1 }));
    const r = evalCreditsMin(bsm, rs, ctx());
    expect(r.current).toBe(19);
    expect(r.status).toBe("unmet");
    expect(r.missing.courses).toEqual(["이산수학"]);
  });

  it("must_include_any 묶음에서 하나도 없으면 미충족", () => {
    const bsm = abeekReq("a_bsm") as CreditsMin;
    const rs = Array.from({ length: 6 }, (_, i) => rec(`수학${i}`, { abeek_category: "BSM", credits: 3 }));
    rs.push(rec("이산수학", { abeek_category: "BSM", credits: 3 }));
    const r = evalCreditsMin(bsm, rs, ctx());
    expect(r.status).toBe("unmet");
    expect(r.missing.courses).toEqual(["일반물리실험(1)"]);
  });

  it("warn_if_missing은 경고만 붙이고 충족 여부는 바꾸지 않는다", () => {
    const bsm = abeekReq("a_bsm") as CreditsMin;
    const rs = Array.from({ length: 5 }, (_, i) => rec(`수학${i}`, { abeek_category: "BSM", credits: 3 }));
    rs.push(rec("이산수학", { abeek_category: "BSM", credits: 3 }), rec("일반물리실험(1)", { abeek_category: "BSM", credits: 1 }));
    const r = evalCreditsMin(bsm, rs, ctx());
    expect(r.status).toBe("met");
    expect(r.warnings.some((w) => w.includes("일반물리(1)"))).toBe(true);
  });

  it("must_include 과목을 계획에 담으면 잠정", () => {
    const bsm = abeekReq("a_bsm") as CreditsMin;
    const rs = Array.from({ length: 6 }, (_, i) => rec(`수학${i}`, { abeek_category: "BSM", credits: 3 }));
    rs.push(rec("일반물리실험(1)", { abeek_category: "BSM", credits: 1 }), plan("이산수학", { abeek_category: "BSM", credits: 3 }));
    expect(evalCreditsMin(bsm, rs, ctx()).status).toBe("tentative");
  });
});

describe("credits_min — 전문교양 pool (decisions.md 8번)", () => {
  const prof = () => abeekReq("a_prof_liberal") as CreditsMin;

  it("pool 과목은 포털 구분이 '미지정'이어도 전문교양으로 세고 경고를 붙인다", () => {
    const rs = [
      rec("글쓰기", { abeek_category: "전문교양", credits: 2 }),
      rec("앙트레프레너십시대의회계", { abeek_category: "전문교양", credits: 2 }),
      rec("한국사", { abeek_category: "미지정", credits: 2, term: "2023-2" }),
      rec("AI시대문제해결을위한디자인사고", { abeek_category: "미지정", credits: 2, term: "2022-2" }),
    ];
    const r = evalCreditsMin(prof(), rs, ctx());
    expect(r.current).toBe(8);
    expect(r.status).toBe("met");
    expect(r.warnings).toHaveLength(2);
    expect(r.warnings[0]).toContain("한국사");
    expect(r.warnings[0]).toContain("미지정");
  });

  it("pool 밖의 '미지정' 과목은 세지 않는다", () => {
    const r = evalCreditsMin(prof(), [rec("창의융합과미래설계", { abeek_category: "미지정", credits: 2 })], ctx());
    expect(r.current).toBe(0);
    expect(r.warnings).toEqual([]);
  });

  it("pool 과목을 계획에 담으면 전문교양으로 센다 (planning: counts)", () => {
    const rs = [
      rec("글쓰기", { abeek_category: "전문교양", credits: 2 }),
      rec("한국사", { abeek_category: "전문교양", credits: 2 }),
      plan("앙트레프레너십시대의회계", { abeek_category: null, credits: 2 }),
    ];
    const r = evalCreditsMin(prof(), rs, ctx());
    expect(r.status).toBe("tentative");
    expect(r.planned).toBe(2);
  });

  it("계획 과목은 포털 값이 없으므로 '미지정' 경고를 붙이지 않는다", () => {
    const r = evalCreditsMin(prof(), [plan("한국사", { abeek_category: null, credits: 2 })], ctx());
    expect(r.warnings).toEqual([]);
  });
});

describe("credits_max (최대학점)", () => {
  const cap: CreditsMax = {
    id: "x_cap",
    label: "교양 최대",
    type: "credits_max",
    match: { "general.category": ["교양"] },
    max: 6,
    over_cap: "none",
  };

  it('"교양" 그룹(공통·핵심·선택교양)을 더해 현재값을 보여 준다', () => {
    const rs = [
      rec("가", { general_category: "공통교양", credits: 2 }),
      rec("나", { general_category: "핵심교양", credits: 3 }),
      rec("다", { general_category: "선택교양", credits: 1 }),
      rec("라", { general_category: "자유선택", credits: 3 }),
    ];
    const r = evalCreditsMax(cap, rs, ctx());
    expect(r.current).toBe(6);
    expect(r.required).toBe(6);
    expect(r.status).toBe("met");
  });

  it('over_cap "none": 초과해도 처리·경고 없음 (decisions.md 11번)', () => {
    const rs = [rec("가", { general_category: "핵심교양", credits: 9 })];
    const r = evalCreditsMax(cap, rs, ctx());
    expect(r.current).toBe(9);
    expect(r.status).toBe("met");
    expect(r.warnings).toEqual([]);
  });
});

describe("courses_all (과목 전부 이수)", () => {
  const two: CoursesAll = { id: "x_req", label: "필수", type: "courses_all", courses: ["자료구조", "알고리즘"] };

  it("모두 이수하면 충족, 과목 수로 표시", () => {
    const r = evalCoursesAll(two, [rec("자료구조"), rec("알고리즘")], ctx());
    expect(r.status).toBe("met");
    expect(r.current).toBe(2);
    expect(r.required).toBe(2);
  });

  it("빠진 과목을 알려 준다", () => {
    const r = evalCoursesAll(two, [rec("자료구조")], ctx());
    expect(r.status).toBe("unmet");
    expect(r.missing.courses).toEqual(["알고리즘"]);
  });

  it("F 과목은 이수로 보지 않는다", () => {
    const r = evalCoursesAll(two, [rec("자료구조"), rec("알고리즘", { grade: "F" })], ctx());
    expect(r.missing.courses).toEqual(["알고리즘"]);
  });

  it("계획에 담으면 잠정", () => {
    const r = evalCoursesAll(two, [rec("자료구조"), plan("알고리즘")], ctx());
    expect(r.status).toBe("tentative");
    expect(r.planned).toBe(1);
  });

  it("min_credits 미달이면 미충족", () => {
    const req: CoursesAll = { ...two, min_credits: 6 };
    const r = evalCoursesAll(req, [rec("자료구조", { credits: 3 }), rec("알고리즘", { credits: 2 })], ctx());
    expect(r.status).toBe("unmet");
    expect(r.missing.credits).toBe(1);
  });

  describe("학번별 cohort_rules (공학인증 전공필수)", () => {
    const required = () => abeekReq("a_required") as CoursesAll;
    const six = ["자료구조", "컴퓨터구조", "소프트웨어공학", "운영체제", "프로그래밍언어론", "알고리즘"].map((n) => rec(n, { abeek_category: "공학주제" }));

    it("2025학번: 6과목이면 충족", () => {
      const r = evalCoursesAll(required(), six, ctx(student({ entry_year: 2025 })));
      expect(r.status).toBe("met");
      expect(r.required).toBe(6);
    });

    it("2026학번: 인공지능이 추가되어 6과목만으로는 미충족", () => {
      const r = evalCoursesAll(required(), six, ctx(student({ entry_year: 2026 })));
      expect(r.status).toBe("unmet");
      expect(r.required).toBe(7);
      expect(r.missing.courses).toEqual(["인공지능"]);
    });

    it("들은 과목은 포털 공학인증 구분이 공학주제여야 센다 (같은 이름 다른 코드 방지)", () => {
      const rs = six.map((r) => (r.name === "자료구조" ? { ...r, code: "56116", abeek_category: "미지정" } : { ...r, abeek_category: "공학주제" }));
      const r = evalCoursesAll(required(), rs, ctx(student({ entry_year: 2025 })));
      expect(r.status).toBe("unmet");
      expect(r.missing.courses).toEqual(["자료구조"]);
    });

    it("계획 과목에는 공학주제 조건을 적용하지 않는다", () => {
      const rs = six.map((r) => (r.name === "운영체제" ? plan("운영체제", { abeek_category: null }) : { ...r, abeek_category: "공학주제" }));
      expect(evalCoursesAll(required(), rs, ctx(student({ entry_year: 2025 }))).status).toBe("tentative");
    });

    it("2026학번: 인공지능까지 이수하면 충족", () => {
      const r = evalCoursesAll(required(), [...six, rec("인공지능", { abeek_category: "공학주제" })], ctx(student({ entry_year: 2026 })));
      expect(r.status).toBe("met");
    });
  });
});

describe("groups_each_min_credits (영역별 최소)", () => {
  const core: GroupsEachMinCredits = {
    id: "x_core",
    label: "핵심교양",
    type: "groups_each_min_credits",
    groups: ["핵심-도전", "핵심-창의"],
    min_each: 3,
  };

  it("모든 영역이 기준 이상이면 충족, 영역별 결과를 준다", () => {
    const rs = [rec("가", { liberal_area: "핵심-도전" }), rec("나", { liberal_area: "핵심-창의" })];
    const r = evalGroupsEachMinCredits(core, rs, ctx());
    expect(r.status).toBe("met");
    expect(r.groups?.map((g) => [g.group, g.current, g.met])).toEqual([
      ["핵심-도전", 3, true],
      ["핵심-창의", 3, true],
    ]);
  });

  it("한 영역이라도 부족하면 미충족, 부족한 영역과 학점 표시", () => {
    const r = evalGroupsEachMinCredits(core, [rec("가", { liberal_area: "핵심-도전" })], ctx());
    expect(r.status).toBe("unmet");
    expect(r.missing.items).toEqual(["핵심-창의"]);
    expect(r.missing.credits).toBe(3);
    expect(r.current).toBe(1);
    expect(r.required).toBe(2);
  });

  it("부족한 영역을 계획으로 채우면 잠정", () => {
    const rs = [rec("가", { liberal_area: "핵심-도전" }), plan("나", { liberal_area: "핵심-창의" })];
    expect(evalGroupsEachMinCredits(core, rs, ctx()).status).toBe("tentative");
  });

  it("영역별 기준이 따로 있으면(min_by_group) 그 값을 쓴다", () => {
    const req = { ...core, min_by_group: { "핵심-창의": 0 } };
    const r = evalGroupsEachMinCredits(req, [rec("가", { liberal_area: "핵심-도전" })], ctx());
    expect(r.status).toBe("met");
  });
});
