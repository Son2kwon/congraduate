"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CourseRecord } from "../../engine/types";
import { CourseSchema } from "../../features/import/model";

export function CourseForm({ record, unknownCredits = false, adding = false, onSave, onClose }: {
  record: CourseRecord; unknownCredits?: boolean; adding?: boolean;
  onSave: (record: CourseRecord) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim() || null;
    const parsed = CourseSchema.safeParse({
      ...record, name: text("name"), code: text("code"), section: text("section"),
      term: { year: Number(form.get("year")), season: text("season") },
      credits: Number(form.get("credits")), design_credits: Number(form.get("design_credits")),
      general_category: text("general_category"), liberal_area: text("liberal_area"), abeek_category: text("abeek_category"),
      grade: text("grade"), english: text("english"), retake: form.get("retake") === "on",
    });
    if (!parsed.success) { setError("과목명·학기·과목코드(숫자 5자리)·분반·학점·성적 등급(A+~F, P, NP)을 확인해 주세요."); return; }
    onSave(parsed.data);
  }
  return <dialog ref={dialog} className="course-dialog" aria-labelledby="course-form-title" onCancel={onClose}>
    <form onSubmit={submit}>
      <h2 id="course-form-title">{adding ? "과목 추가" : "과목 수정"}</h2>
      <p className="muted">수강 당시 포털 값을 기준으로 확인해 주세요. 빈 분류는 미확인으로 남습니다.</p>
      <div className="form-grid">
        <label className="full-width">과목명<input name="name" defaultValue={record.name} required autoFocus /></label>
        <label>과목코드<input name="code" defaultValue={record.code ?? ""} pattern="[0-9]{5}" inputMode="numeric" placeholder="숫자 5자리 · 모르면 비워 둠" /></label>
        <label>분반<input name="section" defaultValue={record.section ?? ""} pattern="[0-9]{1,3}" inputMode="numeric" placeholder="예: 01" /></label>
        <label>수강 년도<input name="year" type="number" min="1900" max="9999" defaultValue={record.term.year} required /></label>
        <label>수강 학기<select name="season" defaultValue={record.term.season}><option value="1">1학기</option><option value="S">하계</option><option value="2">2학기</option><option value="W">동계</option></select></label>
        <label>학점<input name="credits" type="number" min="0" step="any" defaultValue={unknownCredits ? "" : record.credits} required /></label>
        <label>설계학점<input name="design_credits" type="number" min="0" step="any" defaultValue={record.design_credits} required /></label>
        <label>이수구분<input name="general_category" list="general-categories" defaultValue={record.general_category ?? ""} placeholder="예: 전공필수" /></label>
        <label>영역<input name="liberal_area" list="liberal-areas" defaultValue={record.liberal_area ?? ""} placeholder="예: 핵심-도전" /></label>
        <label>공학인증 구분<input name="abeek_category" list="abeek-categories" defaultValue={record.abeek_category ?? ""} placeholder="예: 공학주제" /></label>
        <label>성적 등급<input name="grade" list="grades" defaultValue={record.grade ?? ""} placeholder="예: A0 또는 P" required={record.source !== "plan"} /></label>
        <label>영어강의<select name="english" defaultValue={record.english ?? ""}><option value="">없음 / 미확인</option><option value="A">영어A</option><option value="B">영어B</option></select></label>
        <label className="inline-check"><input name="retake" type="checkbox" defaultChecked={record.retake} />재수강 여부 O</label>
      </div>
      <datalist id="general-categories">{["전공기초", "전공필수", "전공", "교양", "자유선택", "복수전공"].map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="liberal-areas">{["공통교양", ...["핵심", "선택"].flatMap(p => ["도전", "창의", "융합", "신뢰", "소통"].map(a => `${p}-${a}`))].map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="abeek-categories">{["전문교양", "BSM", "공학주제", "기타", "미지정"].map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="grades">{["A+", "A0", "B+", "B0", "C+", "C0", "D+", "D0", "F", "P", "NP"].map(v => <option key={v} value={v} />)}</datalist>
      {error && <p role="alert" className="error-text">{error}</p>}
      <div className="actions"><button type="button" onClick={onClose}>취소</button><button type="submit" className="primary">{adding ? "과목 추가" : "수정 적용"}</button></div>
    </form>
  </dialog>;
}
