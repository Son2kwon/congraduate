"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { emptyManual, StudentSchema } from "../../features/import/model";
import { useImport } from "./import-provider";
import { Navigation } from "./navigation";
import { SessionTools } from "./session-tools";

export function SetupScreen() {
  const { workspace, ready, storageError, setStudent } = useImport();
  const router = useRouter();
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = StudentSchema.safeParse({
      entry_year: Number(form.get("entry_year")),
      expected_graduation: { year: Number(form.get("graduation_year")), season: form.get("graduation_season") },
      manual: workspace.student?.manual ?? emptyManual(),
    });
    if (!parsed.success || !confirmed) { setError("지원 입학년도(2018~2026)와 예정 졸업 학기, 개인정보 처리 안내 확인을 입력해 주세요."); return; }
    setStudent(parsed.data);
    router.push("/import/");
  }
  return <>
    <Navigation active="setup" />
    <main className="setup-main">
      {!ready ? <p role="status">브라우저 저장 내용을 확인하고 있습니다.</p> : <>
        {storageError && <p role="alert" className="notice warning">{storageError}</p>}
        <form key={workspace.student ? `${workspace.student.entry_year}-${workspace.student.expected_graduation.year}-${workspace.student.expected_graduation.season}` : "new"} className="setup-card" onSubmit={submit}>
          <h1>시작하기</h1>
          <p className="muted">로그인 없이 사용합니다. 입학년도로 공학인증 기준이 정해지고, 학교 기준은 이수내역 xlsx를 올리면 내 학번 기준으로 판정됩니다.</p>
          <div className="form-grid">
            <label>학교<input value="중앙대학교 (고정)" readOnly /></label>
            <label>캠퍼스<input value="서울 (고정)" readOnly /></label>
          </div>
          <label>학과 · 프로그램<input value="소프트웨어학부 · 공학인증(컴퓨터공학전문) (고정)" readOnly /></label>
          <label>입학년도<select name="entry_year" defaultValue={workspace.student?.entry_year ?? ""} required>
            <option value="" disabled>2018~2026학번 중 선택</option>
            {Array.from({ length: 9 }, (_, i) => 2018 + i).map(year => <option key={year} value={year}>{year}학번</option>)}
          </select></label>
          <fieldset className="graduation-field"><legend>예정 졸업 학기</legend><div className="form-grid">
            <label>년도<input type="number" name="graduation_year" min="2018" max="9999" placeholder="예: 2028" defaultValue={workspace.student?.expected_graduation.year ?? ""} required /></label>
            <label>학기<select name="graduation_season" defaultValue={workspace.student?.expected_graduation.season ?? ""} required>
              <option value="" disabled>학기 선택</option><option value="1">1학기 (그해 8월 졸업)</option><option value="S">하계 (그해 8월 졸업)</option><option value="2">2학기 (다음 해 2월 졸업)</option><option value="W">동계 (다음 해 2월 졸업)</option>
            </select></label>
          </div></fieldset>
          <div className="notice info"><p>공학인증 기준: 2018~2025학번 동일, 2026학번부터 인공지능 공학인증 필수 추가</p><p>학교 기준: 이수내역 xlsx 기준. 없으면 2022학번 기준을 사용합니다.</p></div>
          <label className="privacy-check"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} required /><span><strong>개인정보 처리 안내 확인 (필수)</strong><small>올린 파일은 이 브라우저 안에서만 처리되고 서버로 전송되지 않습니다. 데이터는 확인 후 이 브라우저에 저장되며 언제든 지울 수 있습니다.</small></span></label>
          {error && <p role="alert" className="error-text">{error}</p>}
          <div className="actions"><button className="primary" type="submit">다음: 이력 가져오기</button></div>
        </form>
        <SessionTools />
      </>}
    </main>
  </>;
}
