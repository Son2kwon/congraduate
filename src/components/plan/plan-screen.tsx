"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { CourseRecord, Season, Term } from "../../engine/types";
import { compareTerm, courseIdentity, earnedRecords } from "../../engine/records";
import { rules, catalog, major, courseIndex } from "../../features/import/data";
import { catalogRecord, type CatalogEntry } from "../../features/import/catalog";
import { addRow, deleteRow, editRow, rowRecord, TermSchema } from "../../features/import/model";
import { dashboardCards, missingItems, statusLabels, type AreaCard } from "../../features/dashboard/model";
import { defaultTerms, designWarnings, duplicatePlan, filterPlanCatalog, planTerms, prerequisiteWarnings, termKey, toPlannedRecord, type CatalogFilter } from "../../features/plan/model";
import { Navigation } from "../import/navigation";
import { CourseForm } from "../import/course-form";
import { useEvaluation } from "../dashboard/use-evaluation";
import { RequirementDetails } from "../dashboard/requirement-card";
import { WorkspaceControls } from "../dashboard/workspace-controls";

const filters:[CatalogFilter,string][]=[["required","남은 필수"],["all","전체"],["major","전공"],["design","설계"],["professional","전문교양"],["liberal","교양 영역"]];
const termTitle=(t:Term)=>`${t.year}-${t.season==="S"?"하계":t.season==="W"?"동계":t.season}`;

export function PlanScreen() {
  const {workspace,ready,result,records,context,setDraft,setPlanTerms}=useEvaluation();
  const [selected,setSelected]=useState("");
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState<CatalogFilter>("required");
  const [addingTerm,setAddingTerm]=useState(false);
  const [candidate,setCandidate]=useState<CatalogEntry|null>(null);
  const [editing,setEditing]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  if(!ready||!result||!context) return <><Navigation active="plan" /><main className="import-main">{ready?<p>학생 정보를 먼저 입력해 주세요. <Link href="/" className="text-link">초기 설정으로 이동</Link></p>:<p role="status">브라우저 저장 내용을 확인하고 있습니다.</p>}</main></>;
  const student=workspace.student!;
  const plannedRows=workspace.draft.filter(row=>!row.deleted&&rowRecord(row).source==="plan");
  const terms=planTerms([...workspace.plan_terms,...plannedRows.map(row=>rowRecord(row).term)]);
  const selectedTerm=terms.find(t=>termKey(t)===selected)??terms[0]??null;
  const semesterRows=plannedRows.filter(row=>selectedTerm&&termKey(rowRecord(row).term)===termKey(selectedTerm));
  const editingRow=plannedRows.find(row=>row.id===editing);
  const professional=rules.rule_sets.abeek.requirements.flatMap(r=>r.type==="credits_min"?r.pool??[]:[]);
  const missing=missingItems(result.current,rules).map(i=>i.course??i.label);
  const found=filterPlanCatalog(catalog,query,filter,missing,professional,courseIndex);
  const earned=earnedRecords(records.filter(r=>r.source!=="plan"),context);
  const designReq=rules.rule_sets.abeek.requirements.find(r=>r.type==="design_credits_min");
  const warnings=[...new Set([
    ...prerequisiteWarnings(records,major.courses,context),
    ...(designReq?designWarnings(records,designReq,context):[]),
    ...result.projected.abeek.flatMap(r=>r.warnings),
    ...plannedRows.flatMap(row=>{const r=rowRecord(row);return [
      ...(compareTerm(r.term,student.expected_graduation,context.termOrder)>0?[`${r.name}: 예정 졸업 학기 이후의 계획입니다. 설정의 졸업 학기를 확인해 주세요.`]:[]),
      ...(!r.retake&&earned.some(e=>courseIdentity(e,context)===courseIdentity(r,context))?[`${r.name}: 이수 기록이 있습니다. 재수강 계획이면 수정에서 재수강 여부 O를 지정해 주세요.`]:[]),
    ];}),
  ])];
  const before=dashboardCards(result.current,rules,{records:records.filter(r=>r.source!=="plan"),context}), after=dashboardCards(result.projected,rules,{records,context});
  const beforeTotal=result.current.general.results.find(r=>r.id==="g_total")!;
  const afterTotal=result.projected.general.results.find(r=>r.id==="g_total")!;
  const beforeCards=[...before.abeek,...before.general,{...beforeTotal,unit:"학점" as const}];
  const afterCards=[...after.abeek,...after.general,{...afterTotal,unit:"학점" as const}];
  const compareIds=["a_eng_topic","a_design","a_required","a_design_required","g_major","g_total"];
  function applyPlan(record:CourseRecord,id?:string) {
    const next=toPlannedRecord(record,record.term);
    const others=workspace.draft.filter(row=>!row.deleted&&row.id!==id).map(rowRecord);
    if(duplicatePlan(next,others)){const reason="같은 과목이 같은 학기에 이미 계획되어 있습니다.";setError(reason);return reason;}
    setDraft(d=>id?editRow(d,id,next):addRow(d,`plan-${crypto.randomUUID()}`,next));
    setPlanTerms(ts=>[...ts,next.term]);setCandidate(null);setEditing(null);setError("");setMessage(`${next.name} 계획을 반영했습니다.`);
  }
  function addCourse(c:CatalogEntry) {
    if(!selectedTerm){setError("먼저 계획 학기를 추가해 주세요.");return;}
    const currentHit=earned.some(r=>c.code?r.code===c.code:courseIndex.canonical(r.name)===courseIndex.canonical(c.name));
    if(c.credits===null||currentHit){setCandidate(c);return;}
    applyPlan(toPlannedRecord(catalogRecord(c,selectedTerm),selectedTerm));
  }
  function addTerm(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const f=new FormData(event.currentTarget);
    const term=TermSchema.safeParse({year:Number(f.get("year")),season:f.get("season")});
    if(!term.success){setError("학기 년도와 구분을 확인해 주세요.");return;}
    setPlanTerms(ts=>[...ts,term.data]);setSelected(termKey(term.data));setAddingTerm(false);setError("");
  }
  const meta=(record:{code:string|null;name:string})=>major.courses.find(c=>record.code&&c.codes?.length?c.codes.includes(record.code):courseIndex.canonical(c.name)===courseIndex.canonical(record.name));
  const now=new Date();const start:Term={year:now.getFullYear(),season:now.getMonth()<8?"1":"2"};
  return <><Navigation active="plan" /><main className="plan-main">
    <div className="page-title"><h1>수강 계획</h1><p className="muted">졸업까지 남은 학기에 과목을 담으면 두 기준의 변화가 바로 계산됩니다.</p></div>
    <div className="semester-tabs" aria-label="계획 학기">{terms.map(term=><button type="button" key={termKey(term)} className={selectedTerm&&termKey(selectedTerm)===termKey(term)?"active":""} aria-pressed={!!selectedTerm&&termKey(selectedTerm)===termKey(term)} onClick={()=>setSelected(termKey(term))}>{termTitle(term)} · {plannedRows.map(rowRecord).filter(r=>termKey(r.term)===termKey(term)).reduce((n,r)=>n+r.credits,0)}학점</button>)}<button type="button" onClick={()=>setAddingTerm(v=>!v)}>+ 학기 추가</button>
      {!terms.length&&<button type="button" onClick={()=>{const ts=defaultTerms(student.expected_graduation,start);if(!ts.length){setError("예정 졸업 학기가 현재보다 이전입니다. 설정을 바꾸거나 학기를 직접 추가해 주세요.");return;}setPlanTerms(()=>ts);setSelected(termKey(ts[0]!));setError("");}}>남은 정규 학기 만들기</button>}
    </div>
    {addingTerm&&<form className="panel add-term-form" onSubmit={addTerm}><label>계획 년도<input name="year" type="number" min="1900" max="9999" defaultValue={selectedTerm?.year??start.year} required /></label><label>계획 학기<select name="season" defaultValue="1">{([['1','1학기'],['S','하계'],['2','2학기'],['W','동계']] as [Season,string][]).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button type="submit" className="primary">학기 추가</button></form>}
    {error&&<p className="notice warning" role="alert">{error}</p>}{message&&<p role="status" className="visually-hidden">{message}</p>}
    <div className="plan-columns">
      <section className="panel plan-catalog" aria-labelledby="catalog-title"><div className="plan-panel-heading"><h2 id="catalog-title">과목 찾기</h2><label><span className="visually-hidden">과목명 또는 과목코드</span><input type="search" placeholder="과목명 또는 과목코드" value={query} onChange={e=>setQuery(e.target.value)} /></label><div className="catalog-filters">{filters.map(([id,label])=><button type="button" key={id} aria-pressed={filter===id} className={filter===id?"active":""} onClick={()=>setFilter(id)}>{label}</button>)}</div><p className="help">2026 카탈로그 기준입니다. 실제 개설 여부와 수강 학기 분류를 확인해 주세요.</p><small role="status">검색 결과 {found.length}개{found.length>40?" · 앞의 40개 표시":""}</small></div>
        <ul className="plan-course-list">{found.slice(0,40).map((c,i)=>{const m=meta(c);return <li key={`${c.code}-${i}`}><div><strong>{c.name}</strong><small>{c.code??"코드 미상"}{m?` · 권장 ${m.year}-${m.semester}`:""} · {c.credits??"미상"}학점{c.design_credits?` · 설계${c.design_credits}`:""}</small><small>{c.general_category??"분류 확인 필요"}{m?.prerequisites_any?` · 선수: ${m.prerequisites_any.map(g=>g.join(" 또는 ")).join(" + ")}`:""}</small></div><button type="button" disabled={!selectedTerm} onClick={()=>addCourse(c)}>담기</button></li>;})}{!found.length&&<li className="muted">검색 결과가 없습니다. 다른 필터나 검색어를 선택해 주세요.</li>}</ul>
      </section>
      <section className="panel plan-basket" aria-labelledby="basket-title"><div className="plan-panel-heading"><div className="section-heading"><h2 id="basket-title">{selectedTerm?`${termTitle(selectedTerm)} 계획`:"계획 학기를 추가해 주세요"}</h2><small>합계 {semesterRows.map(rowRecord).reduce((n,r)=>n+r.credits,0)}학점</small></div>{selectedTerm&&<button type="button" className="small-button danger-text" onClick={()=>{if(semesterRows.length&&!window.confirm("이 학기와 담긴 과목 계획을 삭제할까요?"))return;const ids=new Set(semesterRows.map(r=>r.id));setDraft(d=>d.map(r=>ids.has(r.id)?{...r,deleted:true}:r));setPlanTerms(ts=>ts.filter(t=>termKey(t)!==termKey(selectedTerm)));setSelected("");}}>학기 삭제</button>}</div>
        <ul className="plan-course-list">{semesterRows.map(row=>{const r=rowRecord(row);return <li key={row.id}><div className="basket-course"><strong>{r.name}</strong><small>{r.credits}학점 · 설계{r.design_credits}{r.retake?" · 재수강 O":""}</small><label><span className="visually-hidden">{r.name} 학기 이동</span><select value={termKey(r.term)} onChange={e=>{const target=terms.find(t=>termKey(t)===e.target.value);if(target)applyPlan({...r,term:target},row.id);}}>{terms.map(t=><option key={termKey(t)} value={termKey(t)}>{termTitle(t)}</option>)}</select></label></div><div className="basket-actions"><button type="button" onClick={()=>setEditing(row.id)}>수정</button><button type="button" onClick={()=>setDraft(d=>deleteRow(d,row.id))}>빼기</button></div></li>;})}{!semesterRows.length&&<li className="muted">이 학기에 담은 과목이 없습니다.</li>}</ul>
      </section>
      <section className="panel impact-panel" aria-labelledby="impact-title"><h2 id="impact-title">계획 반영 시 변화</h2><div className="impact-legend"><span><i />현재 이수</span><span><i />계획 추가분</span></div>
        {compareIds.map(id=>{const base=beforeCards.find(c=>c.id===id),future=afterCards.find(c=>c.id===id);return base&&future?<ImpactRow key={id} before={base} after={future} />:null;})}
        <p className="help">모든 계획 학기를 함께 비교합니다. 잠정 항목은 계획 과목 또는 설계 인정 기간을 확인해 주세요. 재수강 계획은 기존 이수 반영분을 바꿀 수 있습니다.</p>
        {warnings.length>0&&<div className="notice warning"><h3>확인 필요</h3><ul>{warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div>}
      </section>
    </div>
    <WorkspaceControls />
    {candidate&&selectedTerm&&<CourseForm adding unknownCredits={candidate.credits===null} record={toPlannedRecord(catalogRecord({...candidate,credits:candidate.credits??0},selectedTerm),selectedTerm)} onClose={()=>setCandidate(null)} onSave={r=>applyPlan(r)} />}
    {editingRow&&<CourseForm key={editingRow.id} record={rowRecord(editingRow)} onClose={()=>setEditing(null)} onSave={r=>applyPlan(r,editingRow.id)} />}
  </main></>;
}
function ImpactRow({before,after}:{before:AreaCard;after:AreaCard}) {
  const total=after.current+after.planned;
  const ratio=(n:number)=>after.required>0?Math.min(100,Math.max(0,n/after.required*100)):100;
  const dark=Math.min(ratio(before.current),ratio(total));const blue=Math.max(0,ratio(total)-dark);
  return <div className="impact-row"><div className="impact-row-title"><h3>{after.label}</h3><span>{before.current} → {total} / {after.required} {after.unit}</span></div><div className="progress-track"><span style={{width:`${dark}%`}} /><span className="planned-progress" style={{width:`${blue}%`}} /></div><small className={`status-${after.status}`}>{statusLabels[after.status]}</small><details><summary>반영 상세</summary><RequirementDetails result={after} /></details></div>;
}
