"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CourseRecord, StudentInfo } from "../../engine/types";
import type { SchoolStandardOverride } from "../../engine/schema/standard";
import { createDraft, reconcileDraft, visibleRecords, type Draft } from "../../features/import/model";
import { combineDocuments, type AbeekDocument, type GradDocument, type ParsedDocument } from "../../features/import/portal";
import { clearSession, loadSession, saveSession, type Session } from "../../features/import/storage";

type Workspace = {
  student: StudentInfo | null; draft: Draft; standard: SchoolStandardOverride | null;
  abeek: AbeekDocument | null; grad: GradDocument | null; dirty: boolean;
};
const initial = (): Workspace => ({ student: null, draft: [], standard: null, abeek: null, grad: null, dirty: false });
const fromSession = (s: Session): Workspace => ({ ...initial(), student: s.student, draft: createDraft(s.records), standard: s.standard });
type ImportContextValue = {
  workspace: Workspace; ready: boolean; storageError: string;
  setStudent: (student: StudentInfo) => void;
  setDraft: (update: (draft: Draft) => Draft) => void;
  applyDocument: (doc: ParsedDocument) => void;
  importSession: (session: Session) => void;
  session: () => Session; save: () => void; discard: () => void; clear: () => void;
};
const ImportContext = createContext<ImportContextValue | null>(null);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(initial);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      const saved = loadSession(window.localStorage);
      if (saved) setWorkspace(fromSession(saved));
    } catch { setStorageError("브라우저 저장 내용을 읽지 못했습니다. 기존 저장값은 유지했습니다. JSON 불러오기 또는 저장 내용 삭제를 이용해 주세요."); }
    setReady(true);
  }, []);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (workspace.dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [workspace.dirty]);

  const session = (): Session => {
    if (!workspace.student) throw new Error("학생 정보를 먼저 입력해 주세요.");
    return { version: 1, student: workspace.student, records: visibleRecords(workspace.draft), standard: workspace.standard };
  };
  const value: ImportContextValue = {
    workspace, ready, storageError, session,
    setStudent: student => setWorkspace(w => ({ ...w, student, dirty: true })),
    setDraft: update => setWorkspace(w => ({ ...w, draft: update(w.draft), dirty: true })),
    applyDocument: doc => setWorkspace(w => {
      if (doc.kind === "summary") return { ...w, standard: doc.standard, dirty: true };
      const abeek = doc.kind === "abeek" ? doc : w.abeek;
      const grad = doc.kind === "grad" ? doc : w.grad;
      return { ...w, abeek, grad, draft: reconcileDraft(w.draft, combineDocuments(abeek, grad).records), dirty: true };
    }),
    importSession: s => setWorkspace({ ...fromSession(s), dirty: true }),
    save: () => {
      try { saveSession(window.localStorage, session()); }
      catch { throw new Error("브라우저에 저장하지 못했습니다. 입력값과 저장 공간을 확인하거나 JSON으로 내보내 주세요."); }
      setStorageError("");
      setWorkspace(w => ({ ...w, dirty: false }));
    },
    discard: () => {
      const saved = loadSession(window.localStorage);
      setWorkspace(saved ? fromSession(saved) : initial());
      setStorageError("");
    },
    clear: () => {
      clearSession(window.localStorage);
      setWorkspace(initial());
      setStorageError("");
    },
  };
  return <ImportContext.Provider value={value}>{children}</ImportContext.Provider>;
}
export function useImport() {
  const value = useContext(ImportContext);
  if (!value) throw new Error("ImportProvider가 필요합니다.");
  return value;
}

export const sourceLabel: Record<CourseRecord["source"], string> = {
  portal: "양쪽 문서", abeek_status: "이수현황만", grad_detail: "성적내역만", manual: "수동 입력", plan: "계획",
};
