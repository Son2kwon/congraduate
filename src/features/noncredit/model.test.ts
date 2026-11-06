import { describe, expect, it } from "vitest";
import { toggleItem, checklistItems } from "./model";
import { emptyManual, ctx, rec } from "../../engine/test-utils";
import type { ChooseN, Checklist } from "../../engine/schema";
const req: ChooseN = { id:"test_items",label:"가상선택",type:"choose_n",n:2,must:["auto"],items:[{id:"auto",label:"자동",auto_from_course:"가상필수"},{id:"manual",label:"직접"}] };
describe("비학점 입력 연결", () => {
  it("자동 항목은 수동 체크로 충족시키지 않는다", () => {
    expect(toggleItem(emptyManual(),req,"auto",true).checked.test_items).toBeUndefined();
    expect(checklistItems(req,emptyManual(),[],ctx())[0]?.checked).toBe(false);
  });
  it("자동 항목은 Pass 기록으로 확인하고 F는 제외한다", () => {
    expect(checklistItems(req,emptyManual(),[rec("가상필수",{grade:"P"})],ctx())[0]).toMatchObject({checked:true,automatic:true});
    expect(checklistItems(req,emptyManual(),[rec("가상필수",{grade:"F"})],ctx())[0]?.checked).toBe(false);
  });
  it("수동 항목 체크·해제와 다른 비학점 정보를 보존한다", () => {
    const before = {...emptyManual(),thesis_passed:true};
    const once = toggleItem(toggleItem(before,req,"manual",true),req,"manual",true);
    expect(once.checked.test_items).toEqual(["manual"]);
    expect(once.thesis_passed).toBe(true);
    expect(toggleItem(once,req,"manual",false).checked.test_items).toEqual([]);
  });
  it("포트폴리오 문자열 항목을 그대로 저장한다", () => {
    const checklist: Checklist = {id:"portfolio",label:"가상포트폴리오",type:"checklist",items:["가상기록"]};
    expect(checklistItems(checklist,toggleItem(emptyManual(),checklist,"가상기록",true),[],ctx())[0]?.checked).toBe(true);
  });
});
