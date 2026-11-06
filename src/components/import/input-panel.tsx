"use client";

import { useRef, useState } from "react";
import { parsePortalFile, parsePortalText, type PortalKind } from "../../features/import/portal";
import { catalog } from "../../features/import/data";
import { catalogRecord, searchCatalog, type CatalogEntry } from "../../features/import/catalog";
import { addRow } from "../../features/import/model";
import { CourseForm } from "./course-form";
import { useImport } from "./import-provider";

const slots = [
  { kind: "abeek", title: "공학교육인증 이수현황 (PDF)", detail: "과목별 공학인증 구분·설계학점", badge: "필수", accept: ".pdf,application/pdf" },
  { kind: "grad", title: "졸업관련성적내역 (PDF)", detail: "과목별 이수구분·교양영역·영어강의", badge: "필수", accept: ".pdf,application/pdf" },
  { kind: "summary", title: "졸업관련성적조회 이수내역 (xlsx)", detail: "내 학번의 학교 기준을 읽어 옴. 없으면 2022학번 기준", badge: "권장", accept: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
] as const;

export function InputPanel({ busy, setBusy }: { busy: boolean; setBusy: (busy: boolean) => void }) {
  const { workspace, applyDocument, setDraft } = useImport();
  const [tab, setTab] = useState<"file" | "paste" | "manual">("file");
  const [kind, setKind] = useState<PortalKind>("abeek");
  const [paste, setPaste] = useState("");
  const [errors, setErrors] = useState<Partial<Record<PortalKind | "summary" | "paste", string>>>({});
  const [message, setMessage] = useState("");
  const [reading, setReading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [candidate, setCandidate] = useState<CatalogEntry | null>(null);
  const inFlight = useRef(false);
  const results = searchCatalog(catalog, query);
  const summary = (k: PortalKind | "summary") => {
    if (k === "summary") return workspace.standard ? `읽기 완료 · 학교 기준 ${workspace.standard.rows.length}행` : "파일 선택";
    const doc = workspace[k];
    return doc ? `읽기 완료 · ${doc.rows.length}과목 · 못 읽은 줄 ${doc.unparsedCount}` : "파일 선택";
  };
  return <section className="input-panel panel" aria-label="이력 입력">
    <div className="input-tabs" role="tablist" aria-label="가져오기 방식">
      {([['file', '파일 업로드'], ['paste', '붙여넣기'], ['manual', '수동 입력']] as const).map(([value, label]) => <button key={value} type="button" role="tab" id={`tab-${value}`} aria-selected={tab === value} aria-controls="input-content" disabled={busy} className={tab === value ? "active" : ""} onClick={() => { setTab(value); setMessage(""); }}>{label}</button>)}
    </div>
    <div id="input-content" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === "file" && <>
        <div className="upload-grid">{slots.map(slot => <div className="upload-slot" key={slot.kind}>
          <span className="tag">{slot.badge}</span><h2>{slot.title}</h2><p className="muted">{slot.detail}</p>
          <label className={`file-select ${busy ? "disabled" : ""}`}>
            <span>{reading === slot.kind ? "브라우저에서 읽는 중…" : summary(slot.kind)}</span>
            <input type="file" accept={slot.accept} aria-label={slot.title} disabled={busy} onChange={async event => {
              const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
              if (!file || inFlight.current) return;
              inFlight.current = true; setBusy(true); setReading(slot.kind); setErrors(e => ({ ...e, [slot.kind]: "" })); setMessage("");
              try {
                const expected = slot.kind === "summary" ? /\.xlsx$/i : /\.pdf$/i;
                if (!expected.test(file.name)) throw new Error("type");
                const base = new URL(window.location.pathname.replace(/\/import\/?$/, "/"), window.location.origin).href;
                const parsed = await parsePortalFile(slot.kind, new Uint8Array(await file.arrayBuffer()), base);
                applyDocument(parsed);
                setMessage("읽은 내용을 확인·수정 목록에 반영했습니다. 아직 브라우저에 저장하지 않았습니다.");
              } catch { setErrors(e => ({ ...e, [slot.kind]: "파일을 읽지 못했습니다. 파일 종류와 포털에서 내려받은 원본인지 확인해 주세요. 기존 목록은 유지했습니다." })); }
              finally { inFlight.current = false; setBusy(false); setReading(null); }
            }} />
          </label>
          {errors[slot.kind] && <p role="alert" className="error-text">{errors[slot.kind]}</p>}
        </div>)}</div>
        <p className="help">중앙대 포털에서 문서명으로 찾아 PDF·xlsx 원본을 내려받아 주세요. 두 PDF를 함께 넣으면 서로 다른 분류를 합칩니다.</p>
      </>}
      {tab === "paste" && <div className="paste-panel">
        <label>문서 종류<select value={kind} onChange={event => setKind(event.target.value as PortalKind)}><option value="abeek">공학교육인증 이수현황</option><option value="grad">졸업관련성적내역</option></select></label>
        <label>포털 화면 텍스트<textarea value={paste} onChange={event => setPaste(event.target.value)} rows={7} spellCheck={false} placeholder="포털 표를 복사해 붙여넣으세요. 칸 사이 탭과 줄바꿈을 그대로 유지해 주세요." /></label>
        <p className="help">영어강의·재수강의 빈 칸도 탭으로 남아야 합니다. 실제 포털 복사 형식에 따라 읽기 결과가 다를 수 있습니다. 학교 기준은 xlsx 파일로 가져옵니다.</p>
        {errors.paste && <p role="alert" className="error-text">{errors.paste}</p>}
        <div className="actions"><button type="button" className="primary" disabled={!paste.trim() || busy} onClick={() => {
          try { applyDocument(parsePortalText(kind, paste)); setPaste(""); setErrors(e => ({ ...e, paste: "" })); setMessage("붙여넣은 과목을 목록에 반영했습니다. 한쪽 문서의 텍스트를 다시 가져오면 해당 입력을 교체합니다."); }
          catch { setErrors(e => ({ ...e, paste: "과목을 읽지 못했습니다. 문서 종류와 탭·줄바꿈 형식을 확인해 주세요. 기존 목록은 유지했습니다." })); }
        }}>텍스트 가져오기</button></div>
      </div>}
      {tab === "manual" && <div className="manual-panel">
        <label>과목 찾기<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="과목명 · 별칭 · 과목코드" /></label>
        <p className="help">카탈로그는 현재 값입니다. 수강 당시 학기·학점·설계학점·분류를 직접 확인하고 바꿀 수 있습니다.</p>
        {query.trim() && <p className="muted" role="status">검색 결과 {results.length}개{results.length > 30 ? " · 앞의 30개 표시. 검색어를 더 입력해 주세요." : ""}</p>}
        <ul className="catalog-results">{results.slice(0, 30).map((course, i) => <li key={`${course.code}-${i}`}><div><strong>{course.name}</strong><small>{course.code ?? "코드 미상"} · {course.credits === null ? "학점 직접 입력" : `${course.credits}학점`} · {course.general_category ?? "분류 미상"}</small></div><button type="button" onClick={() => setCandidate(course)}>선택</button></li>)}</ul>
        <button type="button" onClick={() => setCandidate({ code: null, name: query.trim(), aliases: [], credits: null, design_credits: 0, general_category: null, liberal_area: null, abeek_category: null })}>카탈로그에 없는 과목 직접 입력</button>
      </div>}
    </div>
    {message && <p role="status" className="notice info">{message}</p>}
    {candidate && <CourseForm adding unknownCredits={candidate.credits === null} record={catalogRecord({ ...candidate, credits: candidate.credits ?? 0 }, { year: new Date().getFullYear(), season: "1" })} onClose={() => setCandidate(null)} onSave={record => { setDraft(d => addRow(d, `manual-${crypto.randomUUID()}`, record)); setCandidate(null); setMessage("수동 입력 과목을 확인·수정 목록에 추가했습니다."); }} />}
  </section>;
}
