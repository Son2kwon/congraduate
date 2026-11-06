import type { RequirementResult } from "../../engine/types";
import type { AreaCard } from "../../features/dashboard/model";
import { statusLabels } from "../../features/dashboard/model";

export function RequirementDetails({ result }: {result:RequirementResult}) {
  return <div className="requirement-details">
    {result.groups && <ul>{result.groups.map(g=><li key={g.group}>{g.group}: {g.current} / {g.required}학점</li>)}</ul>}
    {result.reasons.length>0 && <ul>{result.reasons.map((r,i)=><li key={i}>{r}</li>)}</ul>}
    {result.warnings.map((w,i)=><p className="warning-text" key={`w${i}`}>{w}</p>)}
    {result.notes.map((n,i)=><p className="muted" key={`n${i}`}>{n}</p>)}
    {result.counted.length>0 && <details><summary>반영 과목 {result.counted.length}개</summary><ul>{result.counted.map((c,i)=><li key={i}>{c.name} · {c.term.year}-{c.term.season} · {c.value}{c.planned?" (계획)":""}</li>)}</ul></details>}
  </div>;
}
export function RequirementCard({ result }: {result:AreaCard}) {
  const width=result.required>0?Math.min(100,result.current/result.required*100):100;
  return <article className="area-card panel">
    <div className="area-card-heading"><h3>{result.label}</h3><span>{result.current} / {result.required} {result.unit}</span></div>
    <div className="progress-track" role="progressbar" aria-label={result.label} aria-valuemin={0} aria-valuemax={Math.max(1,result.required)} aria-valuenow={Math.min(result.current,Math.max(1,result.required))} aria-valuetext={`${result.current} / ${result.required} ${result.unit}`}><span style={{width:`${width}%`}} /></div>
    <div className={`status-label status-${result.status}`}>{statusLabels[result.status]}</div>
    <details><summary>세부 내용</summary><RequirementDetails result={result} /></details>
  </article>;
}
