import { z } from "zod";
import { SchoolStandardOverride } from "../../engine/schema/standard";
import { CourseSchema, StudentSchema } from "./model";

const SessionSchema = z.strictObject({ version: z.literal(1), student: StudentSchema, records: z.array(CourseSchema), standard: SchoolStandardOverride.nullable() });
export type Session = z.infer<typeof SessionSchema>;
export type SessionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const KEY = "congraduate.session";
const FORMAT_ERROR = "저장 파일의 형식 또는 버전을 확인해 주세요.";

export function parseSession(json: string): Session {
  try { return SessionSchema.parse(JSON.parse(json)); }
  catch { throw new Error(FORMAT_ERROR); }
}
export function serializeSession(session: Session): string {
  const result = SessionSchema.safeParse(session);
  if (!result.success) throw new Error(FORMAT_ERROR);
  return JSON.stringify(result.data, null, 2);
}
export function saveSession(storage: SessionStorage, session: Session): void {
  const json = serializeSession(session);
  try { storage.setItem(KEY, json); }
  catch { throw new Error("브라우저에 저장하지 못했습니다. JSON으로 내보내거나 저장 공간을 확인해 주세요."); }
}
export function loadSession(storage: SessionStorage): Session | null {
  let json: string | null;
  try { json = storage.getItem(KEY); }
  catch { throw new Error("브라우저 저장소를 읽지 못했습니다. JSON 불러오기를 이용해 주세요."); }
  return json === null ? null : parseSession(json);
}
export function clearSession(storage: SessionStorage): void {
  try { storage.removeItem(KEY); }
  catch { throw new Error("브라우저 저장 내용을 삭제하지 못했습니다."); }
}
