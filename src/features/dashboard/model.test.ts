import { describe, expect, it } from "vitest";
import { compareEvaluations, dashboardCards, missingItems, statusCounts, statusLabels } from "./model";
import { realRules, realIndex, rec, plan, student, ctx } from "../../engine/test-utils";

const input = (records = [rec("가상과목")]) => ({ rules: realRules, courses: realIndex, records, student: student() });
describe("대시보드 표시 모델", () => {
  it("현재 이력과 계획 포함 판정을 분리한다", () => {
    const out = compareEvaluations(input([rec("가상기초", { credits: 2 }), plan("가상계획", { credits: 3 })]));
    expect(out.current.summary.total.current).toBe(2);
    expect(out.current.summary.total.planned).toBe(0);
    expect(out.projected.summary.total.planned).toBe(3);
  });
  it("전문교양은 portal_basis가 아니라 규칙 적용 값을 표시한다", () => {
    const out = compareEvaluations(input([rec("한국사", { credits: 2, abeek_category: "미지정" })]));
    const card = dashboardCards(out.current, realRules, {records:[],context:ctx()}).abeek.find(c => c.id === "a_prof_liberal")!;
    expect(card.current).toBe(2); expect(card.warnings.length).toBeGreaterThan(0);
  });
  it("공학인증 필수는 과목 수, 핵심교양은 영역 수 단위다", () => {
    const out = compareEvaluations(input([]));
    const cards = dashboardCards(out.current, realRules, {records:[],context:ctx()});
    expect(cards.abeek.find(c => c.id === "a_required")).toMatchObject({ unit: "과목", required: 6 });
    expect(cards.general.find(c => c.id === "g_core")).toMatchObject({ unit: "영역", required: 5 });
  });
  it("공통교양 과목 수를 학점으로 오표시하지 않는다", () => {
    const out = compareEvaluations(input([rec("글쓰기", { credits: 2, general_category: "교양", liberal_area: "공통교양" })]));
    expect(dashboardCards(out.current, realRules, {records:[],context:ctx()}).general.find(c => c.id === "g_common")).toMatchObject({ current: 2, required: 14, unit: "학점" });
  });
  it("xlsx 학생 기준을 카드에 반영한다", () => {
    const out = compareEvaluations({ ...input([]), standard: { source: "grad_summary_xlsx", rows: [{ name: "전공", criterion: 72 }] } });
    expect(dashboardCards(out.current, realRules, {records:[],context:ctx()}).general.find(c => c.id === "g_major")?.required).toBe(72);
  });
  it("2026학번의 인공지능 필수와 CAU세미나를 남은 목록에 포함한다", () => {
    const out = compareEvaluations({ ...input([]), student: student({ entry_year: 2026 }) });
    expect(missingItems(out.current).some(i => i.label === "인공지능")).toBe(true);
    expect(missingItems(out.current).some(i => i.label.includes("CAU세미나"))).toBe(true);
  });
  it("미충족·잠정·확인 필요를 각각 센다", () => {
    expect(statusCounts([{ status: "met" }, { status: "unmet" }, { status: "tentative" }, { status: "needs_review" }])).toEqual({ met: 1, unmet: 1, tentative: 1, needs_review: 1 });
  });
  it("재수강 계획의 영향은 현재값에 단순 더하지 않고 전체 재평가한다", () => {
    const out = compareEvaluations(input([rec("가상과목", { code: "11111", credits: 3, term: "2024-1" }), plan("가상과목", { code: "11111", credits: 3, retake: true, term: "2025-1" })]));
    expect(out.current.summary.total.current).toBe(3);
    expect(out.projected.summary.total.current + out.projected.summary.total.planned).toBe(3);
  });
  it("설계학점 0인 필수 계획도 실제 이수로 표시하지 않는다", () => {
    const records=["창의적설계","캡스톤디자인(1)","캡스톤디자인(2)"].map(name=>plan(name,{design_credits:0,abeek_category:"공학주제"}));
    const out=compareEvaluations(input(records));
    expect(dashboardCards(out.projected,realRules,{records,context:ctx()}).abeek.find(c=>c.id==="a_design_required")).toMatchObject({current:0,planned:3,status:"tentative"});
  });
  it("설계필수를 이미 이수했으면 다른 설계 계획 때문에 잠정으로 바뀌지 않는다", () => {
    const records=[... ["창의적설계","캡스톤디자인(1)","캡스톤디자인(2)"].map(name=>rec(name,{abeek_category:"공학주제",design_credits:3})),plan("가상설계",{design_credits:2})];
    const out=compareEvaluations(input(records));
    expect(dashboardCards(out.projected,realRules,{records,context:ctx()}).abeek.find(c=>c.id==="a_design_required")).toMatchObject({current:3,planned:0,status:"met"});
  });
  it("설계필수의 인턴십 캡스톤 대체도 이수 개수에 반영한다", () => {
    const s=student({manual:{design:{internship_design_credits:0,capstone_by_internship:"캡스톤디자인(2)"}}});
    const records=["창의적설계","캡스톤디자인(1)"].map(name=>rec(name,{abeek_category:"공학주제"}));
    const out=compareEvaluations({...input(records),student:s});
    expect(dashboardCards(out.current,realRules,{records,context:ctx(s)}).abeek.find(c=>c.id==="a_design_required")).toMatchObject({current:3,status:"met"});
  });
  it("설계 인정 기간이 열려 부족 학점이 남으면 잠정을 충족으로 설명하지 않는다", () => {
    const out=compareEvaluations(input([rec("창의적설계",{abeek_category:"공학주제",design_credits:3})]));
    const result=out.current.abeek.find(r=>r.id==="a_design")!;
    expect(result.missing.credits).toBe(9);
    expect(statusLabels[result.status]).toBe("잠정");
  });
});
