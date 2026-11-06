"use client";

import { useState, type FormEvent } from "react";
import type { EvalContext } from "../../engine/context";
import type { NonCreditRequirement } from "../../engine/schema";
import type { CourseRecord, ManualInput, RequirementResult } from "../../engine/types";
import { checklistItems, toggleItem } from "../../features/noncredit/model";
import { statusLabels } from "../../features/dashboard/model";
import { useImport } from "../import/import-provider";
import { RequirementDetails } from "./requirement-card";

const testLabels:Record<string,string>={TOEFL_iBT_legacy:"TOEFL iBT (기존 점수)",TOEFL_iBT_2026:"TOEFL iBT (2026 점수)","G-TELP_L2":"G-TELP Level 2","G-TELP_L3":"G-TELP Level 3",TOEIC_Speaking:"TOEIC Speaking (증빙용)"};
export function NoncreditPanel({requirements,results,records,context}:{requirements:NonCreditRequirement[];results:RequirementResult[];records:CourseRecord[];context:EvalContext}) {
  const {workspace,setManual}=useImport();
  const manual=workspace.student!.manual;
  const [error,setError]=useState("");
  const apply=(next:ManualInput)=>{try{setManual(next);setError("");return true;}catch{setError("점수·실제 응시일·정수 상담 횟수를 확인해 주세요.");return false;}};
  const addScore=(event:FormEvent<HTMLFormElement>,type:"language_tests"|"topcit")=>{
    event.preventDefault();const form=event.currentTarget;const data=new FormData(form);
    const score=Number(data.get("score"));const date=String(data.get("date")??"")||null;
    const next=type==="topcit"?{...manual,topcit:[...manual.topcit,{score,date}]}:{...manual,language_tests:[...manual.language_tests,{kind:String(data.get("kind")),score,date}]};
    if(apply(next))form.reset();
  };
  const today=new Date().toLocaleDateString("sv-SE");
  return <section className="noncredit-section" aria-labelledby="noncredit-title">
    <h2 id="noncredit-title">비학점 요건</h2>
    <div className="panel noncredit-list">{requirements.map(req=>{
      const result=results.find(r=>r.id===req.id)!;
      const test=req.type==="any_of"?req.options.find(o=>o.kind==="test"):undefined;
      const topcit=req.type==="any_of"&&req.options.some(o=>o.kind==="topcit");
      const thesis=req.type==="any_of"&&req.options.some(o=>o.kind==="thesis");
      const items=req.type==="checklist"||req.type==="choose_n"?checklistItems(req,manual,records,context):[];
      const counts=manual.counts[req.id]??{main:0,external:0};
      return <details className="noncredit-item" key={req.id}>
        <summary><span aria-hidden="true" className={`derived-check ${result.status==="met"?"checked":""}`}>{result.status==="met"?"✓":""}</span><span><strong>{req.label}</strong><small>{req.type==="choose_n"?`${result.current}/${req.items.length}개 완료 · ${req.n}개 필요 · 필수 항목 별도 확인`:req.type==="checklist"||req.type==="count_min"?`${result.current} / ${result.required}${req.type==="count_min"?"회":"개"}`:result.options?.map(o=>o.detail).join(" 또는 ")}</small><span className={`status-label status-${result.status}`}>{statusLabels[result.status]}</span></span></summary>
        <div className="noncredit-form">
          {test&&test.kind==="test"&&<>
            <p className="help">시험 기준: {Object.entries(test.thresholds).map(([kind,min])=>`${testLabels[kind]??kind} ${min}`).join(" · ")}</p>
            <form onSubmit={e=>addScore(e,"language_tests")} className="score-form">
              <label>어학 시험<select name="kind">{[...Object.keys(test.thresholds),"TOEIC_Speaking"].map(kind=><option key={kind} value={kind}>{testLabels[kind]??kind}</option>)}</select></label>
              <label>점수<input name="score" type="number" min="0" step="any" required /></label>
              <label>응시일 (모르면 비움)<input name="date" type="date" max={today} /></label>
              <button type="submit">어학 성적 추가</button>
            </form>
            <ul className="score-list">{manual.language_tests.map((s,i)=><li key={i}><span>{testLabels[s.kind]??s.kind}: {s.score} · {s.date??"응시일 미입력"}</span><button type="button" onClick={()=>apply({...manual,language_tests:manual.language_tests.filter((_,j)=>j!==i)})}>삭제</button></li>)}</ul>
            <p className="help">TOEIC Speaking은 증빙 보관용입니다. SW중심대학의 해당 복합 항목은 아래에서 직접 확인해 체크해 주세요.</p>
          </>}
          {thesis&&<label className="inline-check"><input type="checkbox" checked={manual.thesis_passed} onChange={e=>apply({...manual,thesis_passed:e.target.checked})} />졸업논문 심사 통과</label>}
          {topcit&&<>
            <form onSubmit={e=>addScore(e,"topcit")} className="score-form">
              <label>TOPCIT 점수<input name="score" type="number" min="0" step="any" required /></label>
              <label>TOPCIT 응시일 (모르면 비움)<input name="date" type="date" max={today} /></label>
              <button type="submit">TOPCIT 성적 추가</button>
            </form>
            <ul className="score-list">{manual.topcit.map((s,i)=><li key={i}><span>{s.score}점 · {s.date??"응시일 미입력"}</span><button type="button" onClick={()=>apply({...manual,topcit:manual.topcit.filter((_,j)=>j!==i)})}>삭제</button></li>)}</ul>
          </>}
          {req.type==="count_min"&&<form className="score-form" key={`${counts.main}-${counts.external}`} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);apply({...manual,counts:{...manual.counts,[req.id]:{main:Number(f.get("main")),external:Number(f.get("external"))}}});}}>
            <label>지도교수 상담 횟수<input name="main" type="number" min="0" step="1" defaultValue={counts.main} required /></label>
            <label>교내 상담센터 등 횟수<input name="external" type="number" min="0" step="1" defaultValue={counts.external} required /></label>
            <p className="help">외부 인정 상한: {req.external_max??"제한 없음"}회. 입력 횟수는 보존하고 인정 상한은 엔진이 적용합니다.</p>
            <button type="submit">상담 횟수 반영</button>
          </form>}
          {items.length>0&&<div className="manual-checklist">{items.map(item=><label key={item.id} className="inline-check"><input type="checkbox" disabled={item.automatic} checked={item.checked} onChange={e=>{if(req.type==="choose_n"||req.type==="checklist")apply(toggleItem(manual,req,item.id,e.target.checked));}} /><span>{item.label}{item.automatic&&<small>이수 기록으로 자동 판정</small>}</span></label>)}</div>}
          {result.options&&<ul className="option-results">{result.options.map(o=><li key={o.kind}><span className={`status-label status-${o.status}`}>{statusLabels[o.status]}</span> {o.detail}</li>)}</ul>}
          <RequirementDetails result={result} />
        </div>
      </details>;
    })}</div>
    {error&&<p role="alert" className="notice warning">{error}</p>}
  </section>;
}
