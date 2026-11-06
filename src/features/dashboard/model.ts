import { evaluate, type EvaluateInput, type EvaluateOutput } from "../../engine/evaluate";
import type { RuleFile } from "../../engine/schema";
import type { RequirementResult, Status } from "../../engine/types";
import type { CourseRecord } from "../../engine/types";
import type { EvalContext } from "../../engine/context";
import { earnedRecords } from "../../engine/records";
import { courseState } from "../../engine/evaluators/result";

export const statusLabels: Record<Status, string> = { met: "충족", unmet: "미충족", tentative: "잠정", needs_review: "확인 필요" };
export function compareEvaluations(input: EvaluateInput) {
  return { current: evaluate({ ...input, records: input.records.filter(r => r.source !== "plan") }), projected: evaluate(input) };
}
export function statusCounts(results: { status: Status }[]) {
  const counts = { met: 0, unmet: 0, tentative: 0, needs_review: 0 };
  for (const result of results) counts[result.status]++;
  return counts;
}
export type AreaCard = RequirementResult & { unit: "학점" | "과목" | "영역" };
const card = (r: RequirementResult): AreaCard => ({ ...r, unit: r.type === "courses_all" ? "과목" : r.type === "groups_each_min_credits" ? "영역" : "학점" });
export function dashboardCards(out: EvaluateOutput, rules: RuleFile, input:{records:CourseRecord[];context:EvalContext}): { abeek: AreaCard[]; general: AreaCard[] } {
  const abeek = out.abeek.filter(r => r.id !== "a_total").map(card);
  const design = out.abeek.find(r => r.type === "design_credits_min");
  const req = rules.rule_sets.abeek.requirements.find(r => r.type === "design_credits_min");
  if (design && req?.type === "design_credits_min") {
    const {records,context:c}=input;
    const earned=earnedRecords(records,c);
    const substitution=req.substitutions.some(s=>s.kind==="internship_as_capstone") ? req.window.to_max_of.find(ref=>c.courses.canonical(ref)===c.courses.canonical(c.student.manual.design.capstone_by_internship??"")) : undefined;
    const states=req.must_include.map(ref=>ref===substitution?"done":courseState(ref,earned,c,req.taken_match));
    const current=states.filter(s=>s==="done").length, planned=states.filter(s=>s==="planned").length;
    abeek.push({ ...design, id: "a_design_required", label: "설계필수", current, planned, required: req.must_include.length, unit: "과목", status: current===states.length?"met":current+planned===states.length?"tentative":"unmet" });
  }
  const general = out.general.results.filter(r => ["g_major_basic", "g_major", "g_core"].includes(r.id)).map(card);
  const common = out.general.results.filter(r => r.id.startsWith("g_common_"));
  if (common.length) {
    const current = common.flatMap(r => r.counted).filter(c => !c.planned).reduce((n,c) => n+c.value,0);
    const planned = common.flatMap(r => r.counted).filter(c => c.planned).reduce((n,c) => n+c.value,0);
    const required = out.general.requirements.filter(r => r.id.startsWith("g_common_")).reduce((n,r) => n + (r.type === "courses_all" ? r.min_credits ?? 0 : r.type === "credits_min" ? r.min : 0),0);
    const status: Status = common.every(r=>r.status==="met") ? "met" : common.every(r=>r.status==="met"||r.status==="tentative") ? "tentative" : "unmet";
    general.splice(2,0,{ ...common[0]!, id:"g_common",label:"공통교양",type:"credits_min",current,planned,required,unit:"학점",status, counted:common.flatMap(r=>r.counted),missing:{courses:common.flatMap(r=>r.missing.courses),credits:Math.max(0,required-current-planned),items:[]},reasons:common.flatMap(r=>r.reasons),warnings:common.flatMap(r=>r.warnings),notes:common.flatMap(r=>r.notes) });
  }
  return { abeek, general };
}
export function missingItems(out: EvaluateOutput, rules?: RuleFile): { id: string; label: string; category: string; course?:string }[] {
  const items: { id: string; label: string; category: string; course?:string }[] = [];
  for (const [category,results] of [["공학인증",out.abeek],["학교",out.general.results]] as const) {
    for (const result of results) {
      for (const label of result.missing.courses) items.push({id:`${result.id}-${label}`,label,course:label,category:result.label});
      for (const group of result.groups ?? []) if (!group.met) items.push({id:`${result.id}-${group.group}`,label:`${group.group} ${Math.max(0,group.required-group.current)}학점 부족`,category});
    }
  }
  for (const req of rules?.non_credit ?? []) if (req.type === "choose_n") {
    const result=out.non_credit.find(r=>r.id===req.id);
    for (const id of result?.missing.items ?? []) {
      const item=req.items.find(i=>i.id===id);
      if(item?.auto_from_course) items.push({id:`${req.id}-${id}`,label:item.label,course:item.auto_from_course,category:req.label});
    }
  }
  return items;
}
