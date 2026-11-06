"use client";

import { useState } from "react";
import { deleteRow, editRow, rowRecord } from "../../features/import/model";
import { useImport, sourceLabel } from "./import-provider";
import { CourseForm } from "./course-form";

export function CourseTable({ warningCount }: { warningCount: number }) {
  const { workspace, setDraft } = useImport();
  const [editing, setEditing] = useState<string | null>(null);
  const rows = workspace.draft.filter(row => !row.deleted && rowRecord(row).source !== "plan");
  const editingRow = rows.find(row => row.id === editing);
  const only = rows.filter(row => ["abeek_status", "grad_detail"].includes(rowRecord(row).source)).length;
  return <section className="panel result-panel" aria-labelledby="result-title">
    <div className="result-heading"><h2 id="result-title">합친 결과</h2><p className="muted">{rows.length}과목 · 경고 {warningCount} · 한쪽 문서에만 있음 {only}</p></div>
    <div className="table-scroll"><table>
      <caption className="visually-hidden">가져온 수강 이력. 수정 버튼으로 과목의 값을 바꾸거나 삭제할 수 있습니다.</caption>
      <thead><tr>{["학기", "과목코드-분반", "과목명", "학점(설계)", "이수구분 · 영역", "공학인증", "영어", "등급", "상태", "수정 · 삭제"].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
      <tbody>{rows.map(row => {
        const record = rowRecord(row);
        return <tr key={row.id}>
          <td>{record.term.year}-{record.term.season}</td><td>{record.code ?? "미상"}{record.section ? `-${record.section}` : ""}</td><td className="course-name">{record.name}{record.retake && <small>재수강 O</small>}</td>
          <td>{record.credits} ({record.design_credits})</td><td>{record.general_category ?? "미확인"}{record.liberal_area && <small>{record.liberal_area}</small>}</td><td>{record.abeek_category ?? "미확인"}</td><td>{record.english ? `영어${record.english}` : "–"}</td><td>{record.grade ?? "–"}</td>
          <td><span className={`tag ${record.source === "abeek_status" || record.source === "grad_detail" ? "tag-warning" : ""}`}>{sourceLabel[record.source]}</span>{Object.keys(row.patch).length > 0 && <small>수정됨</small>}</td>
          <td className="row-actions"><button type="button" aria-label={`${record.name} 수정`} onClick={() => setEditing(row.id)}>수정</button><button type="button" className="danger-text" aria-label={`${record.name} 삭제`} onClick={() => setDraft(d => deleteRow(d, row.id))}>삭제</button></td>
        </tr>;
      })}</tbody>
    </table></div>
    {!rows.length && <p className="empty-state">아직 가져온 과목이 없습니다. 파일·붙여넣기·수동 입력으로 이력을 추가해 주세요.</p>}
    {only > 0 && <p className="table-note">한쪽 문서에만 있는 과목도 목록에 포함했습니다. 미확인 분류·설계학점·재수강 여부를 확인해 주세요.</p>}
    {editingRow && <CourseForm key={editingRow.id} record={rowRecord(editingRow)} onClose={() => setEditing(null)} onSave={record => { setDraft(d => editRow(d, editingRow.id, record)); setEditing(null); }} />}
  </section>;
}
