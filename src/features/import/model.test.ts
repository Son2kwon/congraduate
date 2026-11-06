import { describe, expect, it } from "vitest";
import { createDraft, reconcileDraft, visibleRecords, editRow, deleteRow, addRow, emptyManual, StudentSchema, CourseSchema, recordId } from "./model";
import { example } from "./test-fixtures";

describe("가져오기 초안", () => {
  it("나중 문서를 합쳐도 사용자가 고친 필드는 유지하고 새 필드는 보충한다", () => {
    let d = reconcileDraft(createDraft(), [example]);
    d = editRow(d, recordId(example), { credits: 2, name: "수정한 가상과목" });
    d = reconcileDraft(d, [{ ...example, credits: 3, general_category: "전공", source: "portal" }]);
    expect(visibleRecords(d)).toEqual([{ ...example, credits: 2, name: "수정한 가상과목", general_category: "전공", source: "portal" }]);
  });
  it("수정한 학기나 코드를 ID로 쓰지 않아 재가져오기로 중복되지 않는다", () => {
    let d = reconcileDraft(createDraft(), [example]);
    d = editRow(d, recordId(example), { code: "22222", term: { year: 2025, season: "S" } });
    d = reconcileDraft(d, [example]);
    expect(visibleRecords(d)).toHaveLength(1);
    expect(visibleRecords(d)[0]).toMatchObject({ code: "22222", term: { year: 2025, season: "S" } });
  });
  it("편집 폼이 전체 레코드를 보내도 바꾸지 않은 빈 분류는 새 문서로 보충한다", () => {
    let d = reconcileDraft(createDraft(), [example]);
    d = editRow(d, recordId(example), { ...example, credits: 2 });
    d = reconcileDraft(d, [{ ...example, general_category: "전공", english: "A", source: "portal" }]);
    expect(visibleRecords(d)[0]).toMatchObject({ credits: 2, general_category: "전공", english: "A", source: "portal" });
  });
  it("삭제한 과목은 다시 합쳐도 되살아나지 않는다", () => {
    let d = deleteRow(reconcileDraft(createDraft(), [example]), recordId(example));
    d = reconcileDraft(d, []);
    d = reconcileDraft(d, [example]);
    expect(visibleRecords(d)).toEqual([]);
  });
  it("문서 교체는 과거 문서의 과목을 교체하되 수동 추가는 보존한다", () => {
    let d = reconcileDraft(createDraft(), [example]);
    d = addRow(d, "manual-1", { ...example, code: "33333", source: "manual" });
    d = reconcileDraft(d, [{ ...example, code: "22222" }]);
    expect(visibleRecords(d).map(r => r.code)).toEqual(["33333", "22222"]);
  });
  it("복원한 이력은 새 문서에 없는 과목도 보존하고 겹치는 과목만 보충한다", () => {
    const d = reconcileDraft(createDraft([example, { ...example, code: "22222" }]), [{ ...example, source: "portal", english: "A" }]);
    expect(visibleRecords(d)).toHaveLength(2);
    expect(visibleRecords(d).find(r => r.code === "11111")?.english).toBe("A");
  });
  it("저장된 양쪽 문서 과목에 성적내역만 다시 넣어도 공학인증 정보를 보존한다", () => {
    const saved = { ...example, general_category: "전공", english: "A" as const, retake: true, source: "portal" as const };
    const gradOnly = { ...saved, name: "성적내역 이름", design_credits: 0, abeek_category: null, retake: false, source: "grad_detail" as const };
    const d = reconcileDraft(createDraft([saved]), [gradOnly]);
    expect(visibleRecords(d)[0]).toMatchObject({ source: "portal", name: "가상과목", design_credits: 1, abeek_category: "공학주제", retake: true, english: "A" });
    expect(visibleRecords(reconcileDraft(d, []))).toHaveLength(1);
  });
  it("저장된 양쪽 문서 과목에 이수현황만 다시 넣어도 일반 분류와 영어강의를 보존한다", () => {
    const saved = { ...example, general_category: "전공", liberal_area: "가상영역", credits: 4, grade: "A0", english: "B" as const, source: "portal" as const };
    const d = reconcileDraft(createDraft([saved]), [example]);
    expect(visibleRecords(d)[0]).toMatchObject({ credits: 4, grade: "A0", general_category: "전공", liberal_area: "가상영역", english: "B", source: "portal" });
    expect(visibleRecords(reconcileDraft(d, []))).toHaveLength(1);
  });
  it("같은 코드라도 다른 학기나 분반은 보존한다", () => {
    const d = reconcileDraft(createDraft(), [example, { ...example, section: "02" }, { ...example, term: { year: 2024, season: "2" } }]);
    expect(visibleRecords(d)).toHaveLength(3);
  });
  it("같은 과목·학기·분반의 이수와 계획은 편집/삭제 ID가 다르다", () => {
    const p = { ...example, source: "plan" as const, grade: null };
    const d = createDraft([example,p]);
    expect(visibleRecords(deleteRow(d,recordId(p)))).toEqual([example]);
  });
});

describe("수동/저장 과목 검증", () => {
  it.each(["f", " np "])("성적 %s를 대문자로 정규화해 낙제를 통과로 세지 않게 한다", grade => {
    expect(CourseSchema.parse({ ...example, grade }).grade).toBe(grade.trim().toUpperCase());
  });
  it("잘못 입력한 등급을 저장하지 않는다", () => {
    expect(CourseSchema.safeParse({ ...example, grade: "합격?" }).success).toBe(false);
  });
});

describe("학생 정보", () => {
  it.each([2018, 2026])("지원 경계 학번 %i를 허용한다", entry_year => {
    expect(StudentSchema.safeParse({ entry_year, expected_graduation: { year: 2030, season: "W" }, manual: emptyManual() }).success).toBe(true);
  });
  it.each([2017, 2027, 2022.5])("범위 밖/정수가 아닌 학번 %i를 거부한다", entry_year => {
    expect(StudentSchema.safeParse({ entry_year, expected_graduation: { year: 2030, season: "1" }, manual: emptyManual() }).success).toBe(false);
  });
});
