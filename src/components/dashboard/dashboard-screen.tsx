"use client";

import Link from "next/link";
import { rules } from "../../features/import/data";
import { dashboardCards, missingItems, statusCounts } from "../../features/dashboard/model";
import { Navigation } from "../import/navigation";
import { SessionTools } from "../import/session-tools";
import { useEvaluation } from "./use-evaluation";
import { RequirementCard, RequirementDetails } from "./requirement-card";
import { NoncreditPanel } from "./noncredit-panel";
import { WorkspaceControls } from "./workspace-controls";

export function DashboardScreen() {
  const {workspace,ready,result,records,context}=useEvaluation();
  if(!ready||!result||!context) return <><Navigation active="dashboard" /><main className="import-main">{ready?<p>학생 정보를 먼저 입력해 주세요. <Link href="/" className="text-link">초기 설정으로 이동</Link></p>:<p role="status">브라우저 저장 내용을 확인하고 있습니다.</p>}</main></>;
  const out=result.current;
  const cards=dashboardCards(out,rules,{records:records.filter(r=>r.source!=="plan"),context});
  const remaining=missingItems(out,rules);
  const results=[...out.abeek,...out.general.results,...out.non_credit];
  const counts=statusCounts(results);
  const warnings=[...new Set(results.flatMap(r=>r.warnings))];
  const total=out.general.results.find(r=>r.id==="g_total")!;
  const certified=out.abeek.filter(r=>["a_prof_liberal","a_bsm","a_eng_topic"].includes(r.id));
  return <><Navigation active="dashboard" /><main className="dashboard-main">
    <h1 className="visually-hidden">졸업요건 대시보드</h1>
    {!records.some(r=>r.source!=="plan")&&<div className="notice info">아직 이수 이력이 없습니다. <Link href="/import/" className="text-link">이력 가져오기</Link>에서 과목을 추가해 주세요.</div>}
    {warnings.length>0&&<div className="notice warning"><strong>확인 필요</strong><ul>{warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div>}
    <section className="summary-grid" aria-label="졸업요건 요약">
      <article className="summary-card panel"><h2>졸업학점</h2><p><strong>{total.current}</strong> / {total.required}</p></article>
      <article className="summary-card panel"><h2>공학인증 총합 <small>전문교양 + BSM + 공학주제</small></h2><p><strong>{certified.reduce((n,r)=>n+r.current,0)}</strong> / {certified.reduce((n,r)=>n+r.required,0)}</p></article>
      <article className="summary-card panel"><h2>미충족 요건</h2><p><strong>{counts.unmet}</strong> 개</p><small>공학인증 {statusCounts(out.abeek).unmet} · 학교 {statusCounts(out.general.results).unmet} · 비학점 {statusCounts(out.non_credit).unmet}</small><small>잠정 {counts.tentative} · 확인 필요 {counts.needs_review}</small></article>
      <article className="summary-card panel"><h2>마지막 저장</h2><p className="saved-date">{workspace.saved_at?new Date(workspace.saved_at).toLocaleDateString("sv-SE"):"저장일 미기록"}</p>{workspace.dirty&&<small>저장하지 않은 변경 있음</small>}<div className="summary-actions"><Link href="/import/" className="button-link">다시 가져오기</Link><SessionTools exportOnly /></div></article>
    </section>
    <div className="dashboard-columns"><div className="dashboard-areas">
      <section><div className="section-heading"><h2>공학인증 기준</h2><span className="tag">{workspace.student!.entry_year>=2026?"2026학번 · 인공지능 필수 포함":"2018~2025학번 공통"}</span></div><div className="area-grid">{cards.abeek.map(c=><RequirementCard key={c.id} result={c} />)}</div></section>
      <section><div className="section-heading"><h2>학교 기준</h2><span className="tag">{workspace.standard?"출처: 이수내역 xlsx":"2022학번 기본 기준"}</span></div>
        {!workspace.standard&&<p className="notice warning">학번에 따라 다를 수 있음 — 이수내역 xlsx를 올리면 정확해집니다.</p>}
        <div className="area-grid">{cards.general.map(c=><RequirementCard key={c.id} result={c} />)}</div>
        <details className="panel all-requirements"><summary>학교 기준 전체 항목 확인</summary>{out.general.results.map(r=><section key={r.id}><h3>{r.label} · {r.current} / {r.required}{r.type==="courses_all"?"과목":r.type==="groups_each_min_credits"?"영역":"학점"}</h3><RequirementDetails result={r} /></section>)}</details>
        {out.general.unknown_rows.length>0&&<div className="notice warning"><h3>알 수 없는 학교 기준</h3><ul>{out.general.unknown_rows.map((r,i)=><li key={i}>{r.name}: {r.criterion??r.raw??"빈 값"} — 보존했으며 자동 적용하지 않았습니다.</li>)}</ul></div>}
      </section>
    </div><aside className="dashboard-aside">
      <section><div className="section-heading"><h2>남은 필수 항목</h2><Link className="text-link" href="/plan/">수강 계획</Link></div><ul className="panel missing-list">{remaining.map(item=><li key={item.id}><span className="tag">{item.category}</span><span>{item.label}</span></li>)}{!remaining.length&&<li>남은 필수 과목·영역이 없습니다. 학점과 비학점 요건도 확인해 주세요.</li>}</ul></section>
      <NoncreditPanel requirements={rules.non_credit} results={out.non_credit} records={records} context={context} />
      <p className="reference-note">참고용 판정입니다. 최종 졸업 여부는 학과 졸업사정 결과를 따릅니다.</p>
    </aside></div>
    <WorkspaceControls />
  </main></>;
}
