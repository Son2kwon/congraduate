import { describe, expect, it } from "vitest";
import { parseSession, serializeSession, saveSession, loadSession, clearSession } from "./storage";
import { emptyManual } from "./model";
import { example } from "./test-fixtures";

const session = () => ({ version: 1 as const, student: { entry_year: 2022, expected_graduation: { year: 2028, season: "2" as const }, manual: emptyManual() }, records: [example], standard: { source: "grad_summary_xlsx" as const, rows: [{ name: "가상기준", criterion: null, raw: "확인" }] } });
function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } };
}
describe("버전 있는 JSON/브라우저 저장", () => {
  it("학교 기준과 출처·비학점 기본값을 손실 없이 왕복한다", () => {
    expect(parseSession(serializeSession(session()))).toEqual(session());
  });
  it("학교 기준 없이도 저장한다", () => {
    expect(parseSession(serializeSession({ ...session(), standard: null })).standard).toBeNull();
  });
  it.each(["{", JSON.stringify({ ...session(), version: 2 }), JSON.stringify({ ...session(), records: [{ ...example, credits: -1 }] }), JSON.stringify({ ...session(), records: [{ ...example, term: { year: 2024, season: "3" } }] }), JSON.stringify({ ...session(), student: { ...session().student, entry_year: 2017 } }), JSON.stringify({ ...session(), name: "허용되지 않는 개인정보" })])("잘못된 저장 형식은 데이터가 포함되지 않은 오류로 거부한다 (%#)", input => {
    expect(() => parseSession(input)).toThrow("저장 파일의 형식 또는 버전을 확인해 주세요.");
  });
  it("저장·복원·삭제를 처리한다", () => {
    const storage = memoryStorage();
    expect(loadSession(storage)).toBeNull();
    saveSession(storage, session());
    expect(loadSession(storage)).toEqual(session());
    clearSession(storage);
    expect(loadSession(storage)).toBeNull();
  });
  it("할당량 초과 시 성공으로 처리하지 않는다", () => {
    const storage = { ...memoryStorage(), setItem() { throw new Error("QuotaExceededError"); } };
    expect(() => saveSession(storage, session())).toThrow(/저장하지 못했습니다/);
  });
  it("손상된 브라우저 저장값을 자동 덮어쓰지 않는다", () => {
    const storage = memoryStorage();
    storage.setItem("congraduate.session", "broken");
    expect(() => loadSession(storage)).toThrow();
    expect(storage.getItem("congraduate.session")).toBe("broken");
  });
});
