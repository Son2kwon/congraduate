import { describe, expect, it } from "vitest";
import type { AnyOf, Checklist, ChooseN, CountMin } from "../schema";
import { ctx, plan, realRules, rec, student, t } from "../test-utils";
import { evalAnyOf, evalChecklist, evalChooseN, evalCountMin } from "./noncredit";

const nc = <T>(id: string) => realRules.non_credit.find((r) => r.id === id) as T;
const english = () => nc<AnyOf>("nc_english");
const thesis = () => nc<AnyOf>("nc_thesis");

const lecture = (name: string, english: "A" | "B", general_category = "전공", over = {}) =>
  rec(name, { english, general_category, ...over });

describe("any_of (택1) — 영어능력", () => {
  it("어학 점수가 기준 이상이면 충족", () => {
    const s = student({ manual: { language_tests: [{ kind: "TOEIC", score: 750, date: "2025-03-01" }] } });
    const r = evalAnyOf(english(), [], ctx(s));
    expect(r.status).toBe("met");
    expect(r.options?.find((o) => o.kind === "test")?.status).toBe("met");
  });

  it("기준 미만 점수만 있으면 미충족", () => {
    const s = student({ manual: { language_tests: [{ kind: "TOEIC", score: 745, date: "2025-03-01" }] } });
    expect(evalAnyOf(english(), [], ctx(s)).status).toBe("unmet");
  });

  it("전공 영어강의: 영어A = 1, 영어B = 0.5, 합계 3 이상이면 충족", () => {
    const rs = [lecture("가", "A"), lecture("나", "A", "전공기초"), lecture("다", "B", "전공필수"), lecture("라", "B")];
    const r = evalAnyOf(english(), rs, ctx());
    const o = r.options?.find((x) => x.kind === "english_lectures");
    expect(o?.current).toBe(3);
    expect(o?.required).toBe(3);
    expect(r.status).toBe("met");
  });

  it("자유선택·복수전공으로 들은 영어강의와 F 과목은 세지 않는다", () => {
    const rs = [
      lecture("가", "A"),
      lecture("나", "A"),
      lecture("다", "A", "자유선택"),
      lecture("라", "A", "복수전공"),
      lecture("마", "A", "전공", { grade: "F" }),
    ];
    const o = evalAnyOf(english(), rs, ctx()).options?.find((x) => x.kind === "english_lectures");
    expect(o?.current).toBe(2);
    expect(o?.status).toBe("unmet");
  });

  it("계획한 영어강의로 채워지면 잠정", () => {
    const rs = [lecture("가", "A"), lecture("나", "A"), plan("다", { english: "A", general_category: "전공" })];
    expect(evalAnyOf(english(), rs, ctx()).status).toBe("tentative");
  });
});

describe("any_of (택1) — 졸업논문 또는 TOPCIT", () => {
  const grad = (term: string, topcit: { score: number; date: string | null }[], thesis_passed = false) =>
    ctx(student({ expected_graduation: t(term), manual: { topcit, thesis_passed } }));

  it("졸업논문 통과면 충족", () => {
    expect(evalAnyOf(thesis(), [], grad("2026-2", [], true)).status).toBe("met");
  });

  it("TOPCIT 300점 이상 + 졸업 기준 3년 이내면 충족", () => {
    expect(evalAnyOf(thesis(), [], grad("2026-2", [{ score: 300, date: "2025-05-10" }])).status).toBe("met");
  });

  it("TOPCIT 299점은 미충족", () => {
    expect(evalAnyOf(thesis(), [], grad("2026-2", [{ score: 299, date: "2025-05-10" }])).status).toBe("unmet");
  });

  it("3년 경계: 2027-02 졸업이면 2024-02-01 응시는 인정, 2024-01-31은 불인정", () => {
    expect(evalAnyOf(thesis(), [], grad("2026-2", [{ score: 300, date: "2024-02-01" }])).status).toBe("met");
    expect(evalAnyOf(thesis(), [], grad("2026-2", [{ score: 300, date: "2024-01-31" }])).status).toBe("unmet");
  });

  it("1학기·하계 졸업은 그해 8월 기준", () => {
    // 2026-1 졸업 = 2026-08 → 2023-08-01부터 인정
    expect(evalAnyOf(thesis(), [], grad("2026-1", [{ score: 300, date: "2023-08-01" }])).status).toBe("met");
    expect(evalAnyOf(thesis(), [], grad("2026-1", [{ score: 300, date: "2023-07-31" }])).status).toBe("unmet");
  });

  it("2025-08 이전 졸업이면 270점 기준 (history)", () => {
    expect(evalAnyOf(thesis(), [], grad("2025-1", [{ score: 270, date: "2024-05-01" }])).status).toBe("met");
    expect(evalAnyOf(thesis(), [], grad("2025-2", [{ score: 270, date: "2024-05-01" }])).status).toBe("unmet");
  });

  it("응시일을 모르면 확인 필요", () => {
    const r = evalAnyOf(thesis(), [], grad("2026-2", [{ score: 320, date: null }]));
    expect(r.status).toBe("needs_review");
    expect(r.reasons.join()).toContain("응시일");
  });

  it("다른 선택지가 충족이면 확인 필요보다 충족이 우선", () => {
    expect(evalAnyOf(thesis(), [], grad("2026-2", [{ score: 320, date: null }], true)).status).toBe("met");
  });
});

describe("choose_n (n개 중 선택) — SW중심대학", () => {
  const swcu = () => nc<ChooseN>("nc_swcu");
  const checked = (ids: string[]) => student({ manual: { checked: { nc_swcu: ids } } });
  const bootcamp = (over = {}) => rec("코딩부트캠프", { grade: "P", credits: 0, ...over });

  it("코딩부트캠프는 과목 레코드(P)로 자동 판정, 나머지 4개 체크 → 5/10 충족", () => {
    const r = evalChooseN(swcu(), [bootcamp()], ctx(checked(["internship", "startup", "topcit", "open_source"])));
    expect(r.status).toBe("met");
    expect(r.current).toBe(5);
    expect(r.required).toBe(5);
  });

  it("코딩부트캠프를 체크만 하고 과목 기록이 없으면 인정하지 않는다 (필수 항목 → 미충족)", () => {
    const r = evalChooseN(swcu(), [], ctx(checked(["coding_bootcamp", "internship", "startup", "topcit", "open_source"])));
    expect(r.status).toBe("unmet");
    expect(r.current).toBe(4);
    expect(r.missing.items).toContain("coding_bootcamp");
  });

  it("코딩부트캠프 NP는 미이수", () => {
    const r = evalChooseN(swcu(), [bootcamp({ grade: "NP" })], ctx(checked(["internship", "startup", "topcit", "open_source"])));
    expect(r.status).toBe("unmet");
  });

  it("개수가 모자라면 미충족", () => {
    const r = evalChooseN(swcu(), [bootcamp()], ctx(checked(["internship"])));
    expect(r.status).toBe("unmet");
    expect(r.current).toBe(2);
  });

  it("코딩부트캠프를 계획에 담으면 잠정", () => {
    const r = evalChooseN(swcu(), [plan("코딩부트캠프", { credits: 0 })], ctx(checked(["internship", "startup", "topcit", "open_source"])));
    expect(r.status).toBe("tentative");
  });

  it("규칙에 없는 항목 id 체크는 무시한다", () => {
    const r = evalChooseN(swcu(), [bootcamp()], ctx(checked(["nope", "internship"])));
    expect(r.current).toBe(2);
  });
});

describe("checklist (체크리스트) — 포트폴리오", () => {
  const portfolio = () => nc<Checklist>("nc_portfolio");

  it("모든 항목을 체크하면 충족", () => {
    const s = student({ manual: { checked: { nc_portfolio: [...portfolio().items] } } });
    const r = evalChecklist(portfolio(), [], ctx(s));
    expect(r.status).toBe("met");
    expect(r.current).toBe(7);
    expect(r.required).toBe(7);
  });

  it("빠진 항목을 알려 준다", () => {
    const items = portfolio().items;
    const s = student({ manual: { checked: { nc_portfolio: items.slice(1) } } });
    const r = evalChecklist(portfolio(), [], ctx(s));
    expect(r.status).toBe("unmet");
    expect(r.missing.items).toEqual([items[0]]);
  });

  it("입력이 없으면 0개", () => {
    expect(evalChecklist(portfolio(), [], ctx()).current).toBe(0);
  });
});

describe("count_min (횟수) — 지도교수 상담", () => {
  const counseling = () => nc<CountMin>("nc_counseling");
  const counts = (main: number, external: number) => student({ manual: { counts: { nc_counseling: { main, external } } } });

  it("기준 횟수 이상이면 충족", () => {
    const r = evalCountMin(counseling(), [], ctx(counts(4, 0)));
    expect(r.status).toBe("met");
    expect(r.current).toBe(4);
  });

  it("교외·교내 기관 상담은 external_max(2회)까지만 인정", () => {
    const r = evalCountMin(counseling(), [], ctx(counts(1, 5)));
    expect(r.current).toBe(3);
    expect(r.status).toBe("unmet");
    expect(r.missing.items).toEqual([]);
  });

  it("입력이 없으면 0회 미충족", () => {
    const r = evalCountMin(counseling(), [], ctx());
    expect(r.current).toBe(0);
    expect(r.status).toBe("unmet");
  });
});
