import { describe, expect, it, vi } from "vitest";
import { parsePortalText, parsePortalFile, combineDocuments, pdfOptions } from "./portal";
import { extractPdfItems, extractPdfText } from "../../parsers/pdf-text";
import * as XLSX from "xlsx";

// PDF IO만 대역. 좌표를 이용한 변환/문서 파서/병합/xlsx는 실제 구현을 검증한다.
vi.mock("../../parsers/pdf-text", async original => ({ ...await original<object>(), extractPdfItems: vi.fn(), extractPdfText: vi.fn() }));
const a = "공학주제\t2024/1\t11111\t01\t가상과목\tB0\t2(1)\tX\tO";
const g = "2024\t1\t전공\t11111-01\t가상과목\t3\tA0\t4.0\t(영어A)";
describe("브라우저 파싱 연결", () => {
  it("붙여넣기는 탭과 빈 칸을 보존해 같은 파서를 쓴다", () => {
    const doc = parsePortalText("abeek", a.replace("\tX\tO", "\t\tO"));
    expect(doc.rows[0]).toMatchObject({ english_lecture: null, retake: true });
  });
  it("문서별 못 읽은 과목 줄 수를 전달한다", () => {
    expect(parsePortalText("abeek", a + "\n공학주제\t2024/1\t11111").unparsedCount).toBe(1);
  });
  it("0과목 입력을 성공으로 간주하지 않는다", () => {
    expect(() => parsePortalText("grad", "잘못된 붙여넣기")).toThrow(/과목을 읽지 못했습니다/);
  });
  it("충돌 우선순위·한쪽 문서 과목·경고를 그대로 전달한다", () => {
    const merged = combineDocuments(parsePortalText("abeek", a), parsePortalText("grad", g + "\n2024\t1\t자유선택\t22222-01\t가상선택\t1\tP\t0.0"));
    expect(merged.records[0]).toMatchObject({ credits: 3, design_credits: 1, retake: true, english: "A", general_category: "전공" });
    expect(merged.only_grad_detail.map(r => r.code)).toEqual(["22222"]);
    expect(merged.warnings).toHaveLength(2);
  });
  it("한 문서만 입력해도 과목을 버리지 않는다", () => {
    expect(combineDocuments(parsePortalText("abeek", a), null).only_abeek_status).toHaveLength(1);
  });
  it("이수현황 PDF는 x좌표로 빈 영어강의 칸과 재수강을 구분한다", async () => {
    const item = (x: number, y: number, str: string) => ({ x, y, str, width: 6 });
    vi.mocked(extractPdfItems).mockResolvedValue([[item(486, 760, "영어"), item(530, 760, "재수강"), ...["공학주제", "2024/1", "11111", "01", "가상과목", "B0", "3(1)"].map((s, i) => item([35,94,148,202,260,386,433][i]!, 700, s)), item(537,700,"O")]]);
    const result = await parsePortalFile("abeek", new Uint8Array([1]), "https://local.example/app/");
    expect(result).toMatchObject({ kind: "abeek", rows: [{ english_lecture: null, retake: true }] });
    expect(vi.mocked(extractPdfItems).mock.calls.at(-1)?.[1]).toEqual({ cMapUrl: "https://local.example/app/pdfjs/cmaps/", standardFontDataUrl: "https://local.example/app/pdfjs/standard_fonts/", workerSrc: "https://local.example/app/pdfjs/pdf.worker.mjs" });
  });
  it("성적내역 PDF는 일반 텍스트 추출 경로를 쓴다", async () => {
    vi.mocked(extractPdfText).mockResolvedValue(g);
    expect(await parsePortalFile("grad", new Uint8Array([1]), "https://local.example/")).toMatchObject({ kind: "grad", rows: [{ credits: 3, english: "A" }] });
  });
  it("손으로 만든 xlsx에서 과목 대신 학교 기준을 읽는다", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["졸업영역구분", "이수기준"], ["전공(전공필수)", "84(12)"], ["가상미확인", "확인"]]), "이수내역");
    expect(await parsePortalFile("summary", new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" })), "https://local.example/")).toMatchObject({ kind: "summary", standard: { rows: [{ name: "전공", criterion: 84 }, { name: "전공필수", criterion: 12 }, { name: "가상미확인", criterion: null }] } });
  });
  it("PDF 자산은 앱과 같은 출처의 하위 경로에서 제공한다", () => {
    expect(new URL(pdfOptions("https://local.example/sub/").workerSrc).pathname).toBe("/sub/pdfjs/pdf.worker.mjs");
  });
});
