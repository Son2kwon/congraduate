import { describe, expect, it } from "vitest";
import { planTerms, defaultTerms, prerequisiteWarnings, designWarnings, toPlannedRecord, duplicatePlan, filterPlanCatalog } from "./model";
import { ctx, rec, plan, t, realRules, realIndex, student } from "../../engine/test-utils";
import { compareEvaluations, missingItems } from "../dashboard/model";

describe("수강 계획", () => {
  it("학기 중복을 제거하고 1,S,2,W 순서로 정렬한다", () => {
    expect(planTerms([t("2027-W"),t("2027-1"),t("2027-2"),t("2027-S"),t("2027-1")])).toEqual([t("2027-1"),t("2027-S"),t("2027-2"),t("2027-W")]);
  });
  it("현재 정규 학기부터 졸업까지 만들고 과거 졸업이면 빈 목록이다", () => {
    expect(defaultTerms(t("2028-2"),t("2027-2"))).toEqual([t("2027-2"),t("2028-1"),t("2028-2")]);
    expect(defaultTerms(t("2026-2"),t("2027-1"))).toEqual([]);
  });
  it("계획 레코드는 성적을 비우고 source=plan으로 만든다", () => {
    expect(toPlannedRecord(rec("가상설계", { grade: "F", design_credits: 2 }),t("2027-S"))).toMatchObject({ source: "plan", grade: null, design_credits: 2, term: t("2027-S") });
  });
  it("같은 과목·학기 계획은 중복으로 보고 다른 코드는 이름이 같아도 구분한다", () => {
    const a = plan("가상과목", { code: "11111", term: "2027-1" });
    expect(duplicatePlan(a,[a])).toBe(true);
    expect(duplicatePlan({ ...a, code: "22222" },[a])).toBe(false);
    expect(duplicatePlan({ ...a, term:t("2027-2") },[a])).toBe(false);
  });
  it("카탈로그 이름·코드 검색과 필수/설계 필터를 함께 적용한다", () => {
    const catalog=[{code:"11111",name:"가상필수",aliases:["옛필수"],credits:3,design_credits:2,general_category:"전공필수",liberal_area:null,abeek_category:"공학주제"},{code:"22222",name:"가상교양",aliases:[],credits:2,design_credits:0,general_category:"교양",liberal_area:"공통교양",abeek_category:null}];
    expect(filterPlanCatalog(catalog,"","required",["가상필수"],[],realIndex).map(c=>c.code)).toEqual(["11111"]);
    expect(filterPlanCatalog(catalog,"옛필수","design",[],[],realIndex).map(c=>c.code)).toEqual(["11111"]);
    expect(filterPlanCatalog(catalog,"22222","liberal",[],[],realIndex).map(c=>c.code)).toEqual(["22222"]);
  });
  it("자동 필수 항목은 표시명 대신 과목 참조로 필수 필터에 포함한다", () => {
    const out=compareEvaluations({rules:realRules,courses:realIndex,records:[],student:student()});
    const remaining=missingItems(out.current,realRules);
    const bootcamp=remaining.find(i=>i.label==="코딩부트캠프 Pass")!;
    expect(bootcamp.course).toBe("코딩부트캠프");
    const c={code:null,name:"코딩부트캠프",aliases:[],credits:0,design_credits:0,general_category:"전공",liberal_area:null,abeek_category:null};
    expect(filterPlanCatalog([c],"코딩부트캠프","required",remaining.map(i=>i.course??i.label),[],realIndex)).toEqual([c]);
  });
});

describe("선수과목 경고", () => {
  const catalog = [{ name: "가상후수", codes: ["33333"], prerequisites_any: [["가상선수A", "가상선수B"], ["가상선수C"]] }];
  const target = plan("가상후수", { code: "33333", term: "2027-2" });
  it("OR 묶음마다 하나씩 이전 학기에 이수하면 경고하지 않는다", () => {
    expect(prerequisiteWarnings([rec("가상선수B", { term:"2027-1" }),rec("가상선수C", { term:"2027-S" }),target],catalog,ctx())).toEqual([]);
  });
  it("같은 학기·이후 학기·F·NP 과목은 선수 이수로 인정하지 않는다", () => {
    for (const prerequisite of [rec("가상선수A", { term:"2027-2" }), rec("가상선수A", { term:"2027-W" }),rec("가상선수A", { term:"2027-1",grade:"F" }),rec("가상선수A", { term:"2027-1",grade:"NP" })]) {
      expect(prerequisiteWarnings([prerequisite,rec("가상선수C",{term:"2027-1"}),target],catalog,ctx())).toHaveLength(1);
    }
  });
  it("이전 학기 계획으로 충족되는 선수는 계획에 의존함을 알린다", () => {
    const warnings = prerequisiteWarnings([plan("가상선수B",{term:"2027-1"}),rec("가상선수C",{term:"2027-1"}),target],catalog,ctx());
    expect(warnings).toHaveLength(1); expect(warnings[0]).toContain("계획");
  });
  it("같은 이름 다른 코드는 카탈로그 대상 선택 시 섞지 않는다", () => {
    expect(prerequisiteWarnings([{...target,code:"44444"}],catalog,ctx())).toEqual([]);
  });
});

describe("설계 기간과 계획 판정", () => {
  const designReq = realRules.rule_sets.abeek.requirements.find(r=>r.type==="design_credits_min")!;
  it("캡스톤을 모두 수강한 학기 이후의 설계 계획에 경고한다", () => {
    const records = [rec("창의적설계",{term:"2024-1",abeek_category:"공학주제",design_credits:3}),rec("캡스톤디자인(1)",{term:"2026-1",abeek_category:"공학주제",design_credits:3}),rec("캡스톤디자인(2)",{term:"2026-2",abeek_category:"공학주제",design_credits:3}),plan("가상설계",{term:"2027-1",design_credits:2})];
    expect(designWarnings(records,designReq,ctx()).some(w=>w.includes("가상설계"))).toBe(true);
  });
  it("필수 과목을 계획에 넣으면 실제 이수와 구분해 잠정 충족한다", () => {
    const names = ["자료구조","컴퓨터구조","소프트웨어공학","프로그래밍언어론","알고리즘"];
    const records = [...names.map(n=>rec(n,{abeek_category:"공학주제"})),plan("운영체제",{term:"2027-1",abeek_category:"공학주제"})];
    const out = compareEvaluations({rules:realRules,courses:realIndex,records,student:student()});
    expect(out.current.abeek.find(r=>r.id==="a_required")?.status).toBe("unmet");
    expect(out.projected.abeek.find(r=>r.id==="a_required")?.status).toBe("tentative");
  });
});
