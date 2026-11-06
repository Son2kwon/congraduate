import type { EvalContext } from "../../engine/context";
import { compareTerm, earnedRecords, sameCourse } from "../../engine/records";
import { findCourse } from "../../engine/evaluators/result";
import type { DesignCreditsMin } from "../../engine/schema";
import type { CourseRecord, Season, Term } from "../../engine/types";
import type { CourseIndex } from "../../engine/courses";
import { searchCatalog, type CatalogEntry } from "../import/catalog";

const order: Season[] = ["1","S","2","W"];
export const termKey = (t:Term) => `${t.year}-${t.season}`;
export const planTerms = (terms:Term[]) => [...new Map(terms.map(t=>[termKey(t),t])).values()].sort((a,b)=>compareTerm(a,b,order));
export function defaultTerms(graduation:Term,start:Term):Term[] {
  const terms:Term[]=[];
  for(let year=start.year;year<=graduation.year;year++) for(const season of ["1","2"] as const) {
    const term={year,season};
    if(compareTerm(term,start,order)>=0&&compareTerm(term,graduation,order)<=0) terms.push(term);
  }
  return terms;
}
export const toPlannedRecord = (record:CourseRecord,term:Term):CourseRecord => ({...record,source:"plan",grade:null,term});
export type CatalogFilter = "required"|"all"|"major"|"design"|"professional"|"liberal";
export function filterPlanCatalog(catalog:CatalogEntry[],query:string,filter:CatalogFilter,missing:string[],professional:string[],index:CourseIndex):CatalogEntry[] {
  const names=(refs:string[])=>new Set(refs.flatMap(ref=>ref.split(" 또는 ")).map(ref=>index.canonical(ref)));
  const requiredNames=names(missing), professionalNames=names(professional);
  return (query.trim()?searchCatalog(catalog,query):catalog).filter(c=>filter==="all" || (filter==="required"&&requiredNames.has(index.canonical(c.name))) || (filter==="major"&&!!c.general_category?.startsWith("전공")) || (filter==="design"&&c.design_credits>0) || (filter==="professional"&&professionalNames.has(index.canonical(c.name))) || (filter==="liberal"&&!!c.liberal_area));
}
export function duplicatePlan(record:CourseRecord,records:CourseRecord[]):boolean {
  const identity=(r:CourseRecord)=>r.code??`name:${r.name.replace(/\s+/g,"").toUpperCase()}`;
  return records.some(r=>r.source==="plan"&&identity(r)===identity(record)&&termKey(r.term)===termKey(record.term));
}
export type PrerequisiteCourse = { name:string; codes?:string[]; prerequisites_any?:string[][]|null };
export function prerequisiteWarnings(records:CourseRecord[],catalog:PrerequisiteCourse[],c:EvalContext):string[] {
  const warnings:string[]=[];
  for(const target of records.filter(r=>r.source==="plan")) {
    const meta=catalog.find(course=>target.code&&course.codes?.length ? course.codes.includes(target.code) : c.courses.canonical(course.name)===c.courses.canonical(target.name));
    const previous=earnedRecords(records.filter(r=>compareTerm(r.term,target.term,c.termOrder)<0),c);
    for(const group of meta?.prerequisites_any??[]) {
      const hits=previous.filter(r=>group.some(ref=>sameCourse(r,ref,c)));
      if(!hits.length) warnings.push(`${target.name} (${termKey(target.term)}): 선수과목 ${group.join(" 또는 ")}을 이전 학기에 이수해야 합니다. 같은 학기는 인정되지 않습니다.`);
      else if(!hits.some(r=>r.source!=="plan")) warnings.push(`${target.name} (${termKey(target.term)}): 선수과목 ${group.join(" 또는 ")}은 이전 학기 계획에 의존합니다.`);
    }
  }
  return warnings;
}
export function designWarnings(records:CourseRecord[],req:DesignCreditsMin,c:EvalContext):string[] {
  const planned=records.filter(r=>r.source==="plan"&&r.design_credits>0);
  if(!planned.length) return [];
  const earned=earnedRecords(records,c);
  const first=(ref:string)=>findCourse(ref,earned,c,req.taken_match).sort((a,b)=>compareTerm(a.term,b.term,c.termOrder))[0];
  const start=first(req.window.from);
  if(!start) return [`설계 인정 기간: ${req.window.from} 이력 또는 계획이 없어 과목 설계학점이 인정되지 않습니다.`];
  const substituted=c.student.manual.design.capstone_by_internship;
  const endRefs=req.window.to_max_of.filter(ref=>!substituted||c.courses.canonical(ref)!==c.courses.canonical(substituted));
  const ends=endRefs.map(first);
  const end=ends.length&&ends.every(Boolean) ? ends.map(r=>r!.term).reduce((a,b)=>compareTerm(a,b,c.termOrder)>=0?a:b) : null;
  const warnings=planned.filter(r=>compareTerm(r.term,start.term,c.termOrder)<0||(end&&compareTerm(r.term,end,c.termOrder)>0)).map(r=>`${r.name} (${termKey(r.term)}): 설계 인정 기간 밖이므로 설계학점으로 인정되지 않습니다.`);
  if(!end) warnings.push("설계 인정 기간의 끝이 아직 열려 있습니다. 캡스톤 이수 학기에 따라 설계학점이 바뀔 수 있습니다.");
  return warnings;
}
