"use client";

import { useRef, useState } from "react";
import { parseSession, serializeSession } from "../../features/import/storage";
import { useImport } from "./import-provider";

export function SessionTools({ disabled = false, onBusyChange }: { disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const { workspace, session, importSession, clear } = useImport();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const locked = disabled || reading;
  function exportJson() {
    setError(""); setMessage("");
    try {
      const url = URL.createObjectURL(new Blob([serializeSession(session())], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url; link.download = "congraduate-backup-v1.json"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("현재 확인 중인 내용을 JSON으로 내보냈습니다.");
    } catch { setError("학생 정보와 과목 입력값을 확인해 주세요."); }
  }
  return <section className="session-tools" aria-label="데이터 보관">
    <div className="session-toolbar">
      <span className="muted">이 브라우저에 보관 · 다른 기기로 옮길 때는 JSON</span>
      <button type="button" disabled={locked || !workspace.student} onClick={exportJson}>JSON 내보내기</button>
      <button type="button" disabled={locked} onClick={() => input.current?.click()}>JSON 불러오기</button>
      <input ref={input} type="file" accept=".json,application/json" className="visually-hidden" aria-label="저장 JSON 파일" disabled={locked} onChange={async event => {
        const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
        if (!file) return;
        setError(""); setMessage(""); setReading(true); onBusyChange?.(true);
        try {
          const loaded = parseSession(await file.text());
          if (workspace.dirty && !window.confirm("저장하지 않은 변경을 JSON 내용으로 바꿀까요?")) return;
          importSession(loaded);
          setMessage("JSON을 확인용 초안으로 불러왔습니다. 내용을 확인한 뒤 저장해 주세요.");
        } catch { setError("저장 파일의 형식 또는 버전을 확인해 주세요. 기존 내용은 유지했습니다."); }
        finally { setReading(false); onBusyChange?.(false); }
      }} />
      <button className="danger-text" type="button" disabled={locked} onClick={() => {
        if (!window.confirm("이 브라우저의 저장 내용과 현재 초안을 모두 삭제할까요? 내보낸 JSON 파일은 유지됩니다.")) return;
        try { clear(); setMessage("브라우저 저장 내용과 초안을 삭제했습니다."); setError(""); }
        catch { setError("브라우저 저장 내용을 삭제하지 못했습니다."); }
      }}>저장 내용 삭제</button>
    </div>
    {message && <p className="notice info" role="status">{message}</p>}
    {error && <p className="notice warning" role="alert">{error}</p>}
  </section>;
}
