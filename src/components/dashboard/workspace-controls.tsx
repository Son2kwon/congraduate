"use client";

import { useState } from "react";
import { useImport } from "../import/import-provider";
import { SessionTools } from "../import/session-tools";

export function WorkspaceControls() {
  const {workspace,save,discard,storageError}=useImport();
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  return <section className="workspace-controls" aria-label="변경 내용 보관">
    {storageError&&<p className="notice warning" role="alert">{storageError}</p>}
    <div className="save-bar"><p className="muted" role="status">{workspace.dirty?"저장하지 않은 변경이 있습니다.":"브라우저에 저장된 내용입니다."}</p><div className="actions">
      <button type="button" disabled={!workspace.dirty} onClick={()=>{if(!window.confirm("저장하지 않은 변경을 취소할까요?"))return;try{discard();setMessage("마지막 저장 내용으로 돌아왔습니다.");setError("");}catch{setError("저장 내용을 읽지 못했습니다. 현재 내용은 유지했습니다.");}}}>변경 취소</button>
      <button type="button" className="primary" onClick={()=>{try{save();setMessage("변경 내용을 이 브라우저에 저장했습니다.");setError("");}catch{setError("저장하지 못했습니다. 입력값과 저장 공간을 확인하거나 JSON으로 내보내 주세요.");}}}>변경 내용 저장</button>
    </div></div>
    {message&&!workspace.dirty&&<p className="notice success" role="status">{message}</p>}
    {error&&<p className="notice warning" role="alert">{error}</p>}
    <SessionTools />
  </section>;
}
