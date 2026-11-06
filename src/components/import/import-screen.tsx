"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluate } from "../../engine/evaluate";
import { visibleRecords } from "../../features/import/model";
import { combineDocuments } from "../../features/import/portal";
import { rules, courseIndex } from "../../features/import/data";
import { useImport } from "./import-provider";
import { Navigation } from "./navigation";
import { InputPanel } from "./input-panel";
import { CourseTable } from "./course-table";
import { SessionTools } from "./session-tools";

const poolRequirementIds = new Set(rules.rule_sets.abeek.requirements.filter(req => req.type === "credits_min" && req.pool).map(req => req.id));

export function ImportScreen() {
  const { workspace, ready, storageError, save, discard } = useImport();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (ready && !workspace.student) router.replace("/"); }, [ready, workspace.student, router]);
  const records = useMemo(() => visibleRecords(workspace.draft), [workspace.draft]);
  const merged = useMemo(() => combineDocuments(workspace.abeek, workspace.grad), [workspace.abeek, workspace.grad]);
  // 판정 숫자 표시는 6단계. 여기서는 기존 엔진의 규칙 경고와 알 수 없는 기준만 확인에 쓴다.
  const evaluated = useMemo(() => workspace.student ? evaluate({ rules, courses: courseIndex, records, student: workspace.student, standard: workspace.standard ?? undefined }) : null, [records, workspace.student, workspace.standard]);
  const ruleWarnings = [...new Set(evaluated?.abeek.filter(result => poolRequirementIds.has(result.id)).flatMap(result => result.warnings) ?? [])];
  const unknown = evaluated?.general.unknown_rows ?? [];
  const uncertain = workspace.standard?.rows.filter(row => row.criterion === null && !unknown.some(u => u.name === row.name)) ?? [];
  const warningCount = merged.warnings.length + ruleWarnings.length + unknown.length + uncertain.length;
  return <>
    <Navigation active="import" />
    {!ready || !workspace.student ? <main className="import-main"><p role="status">학생 정보를 확인하고 있습니다.</p></main> : <main className="import-main">
      <div className="page-title"><h1>수강 이력 가져오기</h1><p className="muted">파일은 이 브라우저 안에서만 처리되고 서버로 전송되지 않습니다.</p></div>
      <ol className="steps" aria-label="가져오기 순서"><li className="current"><span>1</span>가져오기</li><li><span>2</span>확인 · 수정</li><li><span>3</span>저장</li></ol>
      {storageError && <p role="alert" className="notice warning">{storageError}</p>}
      <fieldset className="workspace-fields" disabled={busy} aria-busy={busy}>
        <InputPanel busy={busy} setBusy={setBusy} />
        <div className={`notice ${workspace.standard ? "info" : "warning"}`}>
          {workspace.standard ? `학교 기준: 이수내역 xlsx에서 읽은 ${workspace.standard.rows.length}행을 사용합니다.` : "학교 기준: 현재 2022학번 기본값입니다. 학번에 따라 다를 수 있음 — xlsx를 올리면 정확해집니다."}
        </div>
        <CourseTable warningCount={warningCount} />
        {warningCount > 0 && <aside className="notice warning" aria-label="확인 필요"><h2>확인 필요</h2><ul>
          {merged.warnings.map((warning, i) => <li key={`merge-${i}`}>{warning}</li>)}
          {ruleWarnings.map((warning, i) => <li key={`rule-${i}`}>{warning}</li>)}
          {unknown.map((row, i) => <li key={`unknown-${i}`}>알 수 없는 기준: {row.name} ({row.criterion ?? row.raw ?? "빈 값"}). 기준을 보존했으며 자동 적용하지 않았습니다.</li>)}
          {uncertain.map((row, i) => <li key={`uncertain-${i}`}>학교 기준 확인 필요: {row.name}의 이수기준을 숫자로 읽지 못해 기본값을 유지합니다.</li>)}
        </ul></aside>}
        <div className="save-bar"><p className="muted" role="status">{busy ? "브라우저에서 파일을 읽고 있습니다…" : workspace.dirty ? "저장하지 않은 변경이 있습니다." : "브라우저에 저장된 내용입니다."}</p><div className="actions">
          <button type="button" disabled={!workspace.dirty} onClick={() => {
            if (!window.confirm("저장하지 않은 변경을 취소하고 마지막 저장 내용으로 돌아갈까요?")) return;
            try { discard(); setMessage("마지막 저장 내용으로 돌아왔습니다."); setError(""); }
            catch { setError("저장 내용을 읽지 못했습니다. 현재 초안은 유지했습니다."); }
          }}>취소</button>
          <button type="button" className="primary" onClick={() => { try { save(); setMessage("확인한 내용을 이 브라우저에 저장했습니다."); setError(""); } catch { setError("저장하지 못했습니다. 입력값과 브라우저 저장 공간을 확인하거나 JSON으로 내보내 주세요."); } }}>확인한 내용 저장</button>
        </div></div>
        {message && !workspace.dirty && <p role="status" className="notice success">{message}</p>}
        {error && <p role="alert" className="notice warning">{error}</p>}
        <SessionTools disabled={busy} onBusyChange={setBusy} />
      </fieldset>
    </main>}
  </>;
}
