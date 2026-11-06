import { describe, expect, it } from "vitest";
import type { DesignCreditsMin } from "../schema";
import { ctx, plan, realRules, rec, student } from "../test-utils";
import { evalDesignCreditsMin } from "./design";

const design = realRules.rule_sets.abeek.requirements.find((r) => r.id === "a_design") as DesignCreditsMin;

const creative = (term: string, dc = 3) => rec("창의적설계", { term, design_credits: dc });
const cap1 = (term: string, dc = 3) => rec("캡스톤디자인(1)", { term, design_credits: dc });
const cap2 = (term: string, dc = 3) => rec("캡스톤디자인(2)", { term, design_credits: dc });
const course = (name: string, term: string, dc: number) => rec(name, { term, design_credits: dc });

describe("design_credits_min (설계학점) — 인정 기간", () => {
  it("창의적설계 학기 ~ 캡스톤 두 과목을 모두 들은 학기, 양 끝 포함", () => {
    const rs = [
      course("이전과목", "2022-W", 2), // 창의적설계 직전 학기 → 제외
      creative("2023-1"),
      course("같은학기시작", "2023-1", 1), // 시작 학기 → 포함
      cap1("2024-1"),
      cap2("2024-2"),
      course("같은학기끝", "2024-2", 1), // 끝 학기 → 포함
      course("이후과목", "2024-W", 2), // 끝 다음 학기 → 제외
    ];
    const r = evalDesignCreditsMin(design, rs, ctx());
    expect(r.counted.map((x) => x.name).sort()).toEqual(["같은학기끝", "같은학기시작", "창의적설계", "캡스톤디자인(1)", "캡스톤디자인(2)"].sort());
    expect(r.current).toBe(11);
  });

  it("학기 순서 1 < S < 2 < W로 경계를 정한다 (하계는 1학기 뒤, 동계는 2학기 뒤)", () => {
    const rs = [
      creative("2023-S"),
      course("1학기", "2023-1", 1), // S보다 앞 → 제외
      course("2학기", "2023-2", 1), // S보다 뒤 → 포함
      cap1("2024-2"),
      cap2("2024-2"),
      course("동계", "2024-W", 1), // 2학기보다 뒤 → 제외
    ];
    const r = evalDesignCreditsMin(design, rs, ctx());
    expect(r.counted.map((x) => x.name).sort()).toEqual(["2학기", "창의적설계", "캡스톤디자인(1)", "캡스톤디자인(2)"].sort());
  });

  it("기간이 닫히고 기준 이상이며 설계필수 3과목을 들었으면 충족", () => {
    const rs = [creative("2023-1"), course("설계A", "2023-2", 3), cap1("2024-1"), cap2("2024-2")];
    const r = evalDesignCreditsMin(design, rs, ctx());
    expect(r.current).toBe(12);
    expect(r.required).toBe(12);
    expect(r.status).toBe("met");
  });

  it("기간이 닫혔는데 기준 미달이면 미충족", () => {
    const rs = [creative("2023-1"), cap1("2024-1"), cap2("2024-2")];
    const r = evalDesignCreditsMin(design, rs, ctx());
    expect(r.status).toBe("unmet");
    expect(r.missing.credits).toBe(3);
  });

  it("설계학점은 레코드 값(포털 이수현황)을 그대로 쓴다", () => {
    const rs = [creative("2022-2", 2), cap1("2023-2", 2), cap2("2024-1", 2)];
    expect(evalDesignCreditsMin(design, rs, ctx()).current).toBe(6);
  });

  it("F 과목은 설계학점에 넣지 않는다", () => {
    const rs = [creative("2023-1"), rec("설계A", { term: "2023-2", design_credits: 3, grade: "F" }), cap1("2024-1"), cap2("2024-2")];
    expect(evalDesignCreditsMin(design, rs, ctx()).current).toBe(9);
  });
});

describe("design_credits_min — 열린 기간·미이수", () => {
  it("캡스톤 두 과목을 아직 다 듣지 않았으면 끝을 열어 두고 잠정", () => {
    const rs = [creative("2023-1"), course("설계A", "2023-2", 3), cap1("2024-1"), course("나중설계", "2025-1", 3)];
    const r = evalDesignCreditsMin(design, rs, ctx());
    expect(r.status).toBe("tentative");
    expect(r.counted.map((x) => x.name)).toContain("나중설계");
    expect(r.reasons.join()).toContain("캡스톤디자인(2)");
  });

  it("캡스톤을 하나도 안 들었어도 기간은 열려 있고 잠정", () => {
    const r = evalDesignCreditsMin(design, [creative("2023-1")], ctx());
    expect(r.status).toBe("tentative");
    expect(r.current).toBe(3);
  });

  it("창의적설계를 안 들었으면 설계학점 0, 미충족, 사유 '창의적설계 미이수'", () => {
    const rs = [course("설계A", "2023-2", 3), cap1("2024-1"), cap2("2024-2")];
    const r = evalDesignCreditsMin(design, rs, ctx());
    expect(r.current).toBe(0);
    expect(r.counted).toEqual([]);
    expect(r.status).toBe("unmet");
    expect(r.reasons).toContain("창의적설계 미이수");
  });

  it("창의적설계가 F면 미이수로 본다", () => {
    const r = evalDesignCreditsMin(design, [rec("창의적설계", { term: "2023-1", design_credits: 3, grade: "F" })], ctx());
    expect(r.current).toBe(0);
    expect(r.reasons).toContain("창의적설계 미이수");
  });

  it("남은 캡스톤을 계획에 담으면 계획 학기로 기간을 닫고 잠정, 계획 설계학점은 따로", () => {
    const rs = [creative("2023-1"), course("설계A", "2023-2", 3), cap1("2024-1"), plan("캡스톤디자인(2)", { term: "2025-2", design_credits: 3 }), course("기간밖", "2025-W", 3)];
    const r = evalDesignCreditsMin(design, rs, ctx());
    expect(r.status).toBe("tentative");
    expect(r.current).toBe(9);
    expect(r.planned).toBe(3);
    expect(r.counted.map((x) => x.name)).not.toContain("기간밖");
  });

  it("창의적설계를 계획에 담으면 계획 학기부터 기간을 열고 잠정", () => {
    const rs = [plan("창의적설계", { term: "2025-1", design_credits: 3 }), plan("캡스톤디자인(1)", { term: "2025-2", design_credits: 3 })];
    const r = evalDesignCreditsMin(design, rs, ctx());
    expect(r.status).toBe("tentative");
    expect(r.planned).toBe(6);
  });
});

describe("design_credits_min — 학생 입력 대체 (규정 제67조①, 별표24)", () => {
  const withDesign = (internship_design_credits: number, capstone_by_internship: "캡스톤디자인(1)" | "캡스톤디자인(2)" | null) =>
    ctx(student({ manual: { design: { internship_design_credits, capstone_by_internship } } }));

  it("인턴십 인정 설계학점은 인정 기간과 무관하게 더하고 '수동 입력 반영'을 표시한다", () => {
    const rs = [creative("2023-1"), cap1("2024-1"), cap2("2024-2")];
    const r = evalDesignCreditsMin(design, rs, withDesign(3, null));
    expect(r.current).toBe(12);
    expect(r.status).toBe("met");
    expect(r.notes.join()).toContain("수동 입력 반영");
  });

  it("입력값이 규정상 인턴십 설계학점(3)을 넘으면 경고", () => {
    const rs = [creative("2023-1"), cap1("2024-1"), cap2("2024-2")];
    const r = evalDesignCreditsMin(design, rs, withDesign(4, null));
    expect(r.current).toBe(13);
    expect(r.warnings.join()).toContain("3");
  });

  it("캡스톤으로 인정받은 과목은 이수로 처리 — 다른 캡스톤 학기로 기간을 닫는다", () => {
    const rs = [creative("2023-1"), course("설계A", "2023-2", 6), cap1("2024-1"), course("기간밖", "2024-2", 3)];
    const r = evalDesignCreditsMin(design, rs, withDesign(0, "캡스톤디자인(2)"));
    expect(r.status).toBe("met");
    expect(r.current).toBe(12);
    expect(r.counted.map((x) => x.name)).not.toContain("기간밖");
    expect(r.missing.courses).toEqual([]);
    expect(r.notes.join()).toContain("수동 입력 반영");
  });

  it("입력이 없으면 메모를 붙이지 않는다", () => {
    const r = evalDesignCreditsMin(design, [creative("2023-1")], ctx());
    expect(r.notes).toEqual([]);
  });
});
