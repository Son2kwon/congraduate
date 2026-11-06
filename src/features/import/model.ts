import { z } from "zod";
import type { CourseRecord, ManualInput } from "../../engine/types";

const Text = z.string().trim().min(1);
const Amount = z.number().finite().nonnegative();
const Grade = z.string().trim().toUpperCase().pipe(z.enum(["A+", "A0", "A", "B+", "B0", "B", "C+", "C0", "C", "D+", "D0", "D", "F", "P", "NP"])).transform((grade): string => grade);
export const TermSchema = z.strictObject({ year: z.number().int().min(1900).max(9999), season: z.enum(["1", "S", "2", "W"]) });
const DatedScore = z.strictObject({ score: Amount, date: z.iso.date().nullable() });
export const ManualSchema = z.strictObject({
  language_tests: z.array(DatedScore.extend({ kind: Text })), topcit: z.array(DatedScore), thesis_passed: z.boolean(),
  counts: z.record(z.string(), z.strictObject({ main: Amount.int(), external: Amount.int() })), checked: z.record(z.string(), z.array(Text)),
  design: z.strictObject({ internship_design_credits: Amount, capstone_by_internship: Text.nullable() }),
});
export const StudentSchema = z.strictObject({
  entry_year: z.number().int().min(2018).max(2026),
  expected_graduation: TermSchema,
  manual: ManualSchema,
});
export const CourseSchema = z.strictObject({
  code: z.string().regex(/^\d{5}$/).nullable(), section: z.string().regex(/^\d{1,3}$/).nullable(), name: Text,
  term: TermSchema, credits: Amount, design_credits: Amount, grade: Grade.nullable(), general_category: Text.nullable(),
  liberal_area: Text.nullable(), abeek_category: Text.nullable(), english: z.enum(["A", "B"]).nullable(),
  retake: z.boolean(), source: z.enum(["portal", "abeek_status", "grad_detail", "manual", "plan"]),
});

export function emptyManual(): ManualInput {
  return { language_tests: [], topcit: [], thesis_passed: false, counts: {}, checked: {}, design: { internship_design_credits: 0, capstone_by_internship: null } };
}

export type DraftRow = { id: string; record: CourseRecord; patch: Partial<CourseRecord>; deleted: boolean; origin: "saved" | "import" | "manual" };
export type Draft = DraftRow[];
export const recordId = (r: CourseRecord) => JSON.stringify([r.source === "plan" ? "plan" : "taken", r.code ?? r.name, r.term.year, r.term.season, r.section]);
export const createDraft = (records: CourseRecord[] = []): Draft => records.map(record => ({ id: recordId(record), record, patch: {}, deleted: false, origin: "saved" }));
export const rowRecord = (row: DraftRow): CourseRecord => ({ ...row.record, ...row.patch });
export const visibleRecords = (draft: Draft) => draft.filter(r => !r.deleted).map(rowRecord);

/** 저장된 상대 문서 필드는 현재 한쪽 문서의 미확인 기본값(0/null/false)으로 덮어쓰지 않는다. */
function supplementSaved(saved: CourseRecord, incoming: CourseRecord): CourseRecord {
  if (incoming.source === "grad_detail" && (saved.source === "portal" || saved.source === "abeek_status")) {
    return { ...incoming, name: saved.name, design_credits: saved.design_credits, abeek_category: saved.abeek_category, retake: saved.retake, source: "portal" };
  }
  if (incoming.source === "abeek_status" && (saved.source === "portal" || saved.source === "grad_detail")) {
    return { ...incoming, credits: saved.credits, grade: saved.grade, general_category: saved.general_category, liberal_area: saved.liberal_area, english: saved.english, source: "portal" };
  }
  return incoming;
}

/** 현재 문서 결과만 교체한다. 복원 이력/수동 입력/삭제 표시는 보존한다. ID는 사용자가 수정하는 값과 분리한다. */
export function reconcileDraft(draft: Draft, incoming: CourseRecord[]): Draft {
  const ids = new Set(incoming.map(recordId));
  const kept = draft.filter(r => !ids.has(r.id) && (r.origin !== "import" || r.deleted));
  const old = new Map(draft.map(r => [r.id, r]));
  return [...kept, ...incoming.map(record => {
    const id = recordId(record);
    const prev = old.get(id);
    return { id, record: prev?.origin === "saved" ? supplementSaved(prev.record, record) : record, patch: prev?.patch ?? {}, deleted: prev?.deleted ?? false, origin: prev?.origin === "saved" ? "saved" as const : "import" as const };
  })];
}
export function editRow(draft: Draft, id: string, patch: Partial<CourseRecord>): Draft {
  return draft.map(row => {
    if (row.id !== id) return row;
    const current = rowRecord(row);
    const changed = Object.fromEntries(Object.entries(patch).filter(([key, value]) => JSON.stringify(current[key as keyof CourseRecord]) !== JSON.stringify(value)));
    return { ...row, patch: { ...row.patch, ...changed } };
  });
}
export const deleteRow = (draft: Draft, id: string): Draft => draft.map(r => r.id === id ? { ...r, deleted: true } : r);
export const addRow = (draft: Draft, id: string, record: CourseRecord): Draft => [...draft, { id, record, patch: {}, deleted: false, origin: "manual" }];
