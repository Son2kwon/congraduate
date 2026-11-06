// 파서 단위 테스트 — 손으로 만든 예제 줄만 쓴다 (실제 성적 자료 미사용)
import { describe, expect, it } from "vitest";
import { parseAbeekStatusText } from "./abeek-status";
import { parseGradDetailText } from "./grad-detail";
import { parseGradSummaryRows } from "./grad-summary";
import { mergePortalRecords } from "./merge";
import { itemsToText, type TextItem } from "./pdf-text";

const tab = (...cells: string[]) => cells.join("\t");

describe("PDF 텍스트 조각 → 줄 (itemsToText)", () => {
  const item = (x: number, y: number, str: string, width = str.length * 6): TextItem => ({ x, y, str, width });

  it("y가 같은 조각을 한 줄로, 위에서 아래로", () => {
    const text = itemsToText([item(10, 700, "둘째"), item(10, 720, "첫째")]);
    expect(text.split("\n")).toEqual(["첫째", "둘째"]);
  });

  it("y가 2 이내로 어긋나도 같은 줄", () => {
    expect(itemsToText([item(10, 700, "가"), item(100, 701.5, "나")])).toBe("가\t나");
  });

  it("간격이 넓으면 탭으로 칸을 나누고, 좁으면 한 칸으로 합친다", () => {
    // "CAU"(끝 x=28) → "세미나"(x=31): 간격 3 → 합침 / "세미나" 끝 → 학점(x=200): 탭
    const text = itemsToText([item(10, 700, "CAU", 18), item(31, 700, "세미나", 18), item(200, 700, "1", 6)]);
    expect(text).toBe("CAU 세미나\t1");
  });

  it("거의 붙어 있으면 공백 없이 합친다", () => {
    expect(itemsToText([item(10, 700, "(", 4), item(14.5, 700, "영어A)", 20)])).toBe("(영어A)");
  });

  it("빈 조각은 무시한다", () => {
    expect(itemsToText([item(10, 700, " "), item(50, 700, "가")])).toBe("가");
  });
});

describe("공학교육인증 이수현황 텍스트 → 행", () => {
  const sample = [
    "▶ 이수과목",
    tab("학점", "영어", "재수강"),
    tab("이수구분", "년도/학기", "과목코드", "분반", "과목명", "성적"),
    tab("(설계학점)", "강의", "여부"),
    tab("전문교양", "2021/1", "11111", "01", "가상교양", "B0", "2(0)", "X"),
    tab("소계/인증조건", "2(0)/6"),
    tab("BSM", "2021/2", "22222", "03", "가상수학", "C+", "3(0)", "O"),
    tab("공학주제", "2021/W", "33333", "02", "가상 설계 과목", "A0", "3(2)", "X", "O"),
    tab("미지정", "2022/S", "44444", "01", "가상선택", "P", "1(0)", "X"),
    tab("총계/인증조건", "9(2)/84"),
    tab("전문교양", "MSC", "BSM", "공학주제", "인증총합", "전체총합"),
    tab("2(0)/6", "0(0)/0", "3(0)/18", "3(2)/60", "8(2)/84", "1(0)/0", "9(2)/84"),
    "▶ 공학교육인증 필수 이수과목 내역",
  ].join("\n");

  const rows = () => parseAbeekStatusText(sample).rows;

  it("과목 줄만 읽고 소계·총계·합계 표·머리글은 건너뛴다", () => {
    expect(rows()).toHaveLength(4);
  });

  it("학기 표기 2021/1, 2021/W, 2022/S를 학기로 바꾼다", () => {
    expect(rows().map((r) => r.term)).toEqual([
      { year: 2021, season: "1" },
      { year: 2021, season: "2" },
      { year: 2021, season: "W" },
      { year: 2022, season: "S" },
    ]);
  });

  it("학점(설계학점), 공학인증 구분, 영어강의, 재수강", () => {
    const r = rows()[2]!;
    expect(r).toMatchObject({
      abeek_category: "공학주제",
      code: "33333",
      section: "02",
      name: "가상 설계 과목",
      grade: "A0",
      credits: 3,
      design_credits: 2,
      english_lecture: false,
      retake: true,
    });
    expect(rows()[1]!.english_lecture).toBe(true);
    expect(rows()[1]!.retake).toBe(false);
  });

  it("과목처럼 보이지만 형식이 어긋난 줄은 버리지 않고 따로 알린다", () => {
    const bad = tab("공학주제", "2021/1", "55555", "01", "학점없는줄", "A0");
    expect(parseAbeekStatusText(bad).unparsed).toHaveLength(1);
  });
});

describe("졸업관련성적내역 텍스트 → 행", () => {
  const sample = [
    tab("년도", "학기", "이수구분", "영역구분", "교과목-", "분반", "과목", "학점", "등급", "평점", "원어구분"),
    tab("2021", "1", "전공기초", "11111-01", "가상물리(1 )", "3", "B+", "3.5"),
    tab("2021", "1", "교양", "공통교양", "22222-10", "가상글쓰기", "2", "A0", "4.0"),
    tab("2021", "2", "전공", "33333-03", "가상 과목", "3", "C0", "2.0", "(영어A)"),
    tab("2021", "동계", "교양", "핵심- 신뢰", "44444-01", "가상철학", "3", "B0", "3.0"),
    tab("2022", "하계", "교양", "선택-", "소통", "55555-01", "가상선택", "2", "P", "0.0", "(영어B)"),
    tab("2022", "1", "복수전공", "66666-01", "가상타학과", "3", "A+", "4.5"),
  ].join("\n");

  const rows = () => parseGradDetailText(sample).rows;

  it("과목 줄만 읽는다 (머리글 제외)", () => {
    expect(rows()).toHaveLength(6);
  });

  it("학기 1·2·하계·동계를 1·2·S·W로", () => {
    expect(rows().map((r) => r.term.season)).toEqual(["1", "1", "2", "W", "S", "1"]);
  });

  it("영역구분이 없는 줄과 있는 줄을 모두 읽고, 영역이 두 칸(선택- / 소통)으로 갈라져도 합친다", () => {
    expect(rows().map((r) => r.liberal_area)).toEqual([null, "공통교양", null, "핵심-신뢰", "선택-소통", null]);
  });

  it("교과목-분반을 나누고 이수구분·학점·등급·원어구분을 읽는다", () => {
    expect(rows()[2]).toMatchObject({ code: "33333", section: "03", general_category: "전공", credits: 3, grade: "C0", english: "A" });
    expect(rows()[4]!.english).toBe("B");
    expect(rows()[0]!.english).toBeNull();
    expect(rows()[5]!.general_category).toBe("복수전공");
  });

  it("과목명 안의 끼어든 공백은 그대로 두되 줄 끝 공백은 지운다", () => {
    expect(rows()[0]!.name).toBe("가상물리(1 )");
  });
});

describe("두 PDF 합치기 (과목코드 + 학기 + 분반)", () => {
  const abeek = parseAbeekStatusText(
    [
      tab("공학주제", "2021/2", "33333", "03", "가상과목", "C0", "3(1)", "O"),
      tab("전문교양", "2021/1", "22222", "10", "가상글쓰기", "A0", "2(0)", "X"),
      tab("미지정", "2022/1", "77777", "01", "이수현황에만", "B0", "3(0)", "X"),
    ].join("\n"),
  ).rows;
  const grad = parseGradDetailText(
    [
      tab("2021", "2", "전공", "33333-03", "가상 과목", "3", "C0", "2.0", "(영어A)"),
      tab("2021", "1", "교양", "공통교양", "22222-10", "가상글쓰기", "2", "A0", "4.0"),
      tab("2022", "1", "자유선택", "88888-01", "성적내역에만", "3", "B0", "3.0"),
    ].join("\n"),
  ).rows;

  it("양쪽 값을 한 레코드로 합친다", () => {
    const { records } = mergePortalRecords(abeek, grad);
    const r = records.find((x) => x.code === "33333")!;
    expect(r).toMatchObject({
      source: "portal",
      name: "가상과목",
      general_category: "전공",
      liberal_area: null,
      abeek_category: "공학주제",
      design_credits: 1,
      credits: 3,
      grade: "C0",
      english: "A",
      retake: false,
    });
    expect(records.find((x) => x.code === "22222")!.liberal_area).toBe("공통교양");
  });

  it("한쪽 문서에만 있는 과목은 버리지 않고 표시한다", () => {
    const { records, only_abeek_status, only_grad_detail } = mergePortalRecords(abeek, grad);
    expect(records).toHaveLength(4);
    expect(only_abeek_status.map((r) => r.code)).toEqual(["77777"]);
    expect(only_grad_detail.map((r) => r.code)).toEqual(["88888"]);
    expect(records.find((x) => x.code === "77777")!.source).toBe("abeek_status");
    expect(records.find((x) => x.code === "88888")!.source).toBe("grad_detail");
  });

  it("학기가 다르면 다른 기록이다 (재수강 등)", () => {
    const g2 = parseGradDetailText(tab("2022", "2", "전공", "33333-03", "가상과목", "3", "B0", "3.0")).rows;
    const { only_grad_detail } = mergePortalRecords(abeek, g2);
    expect(only_grad_detail).toHaveLength(1);
  });

  it("양쪽 학점이 다르거나 영어강의 표시가 엇갈리면 경고", () => {
    const a = parseAbeekStatusText(tab("공학주제", "2021/2", "33333", "03", "가상과목", "C0", "2(1)", "X")).rows;
    const { warnings } = mergePortalRecords(a, grad);
    expect(warnings.some((w) => w.includes("학점"))).toBe(true);
    expect(warnings.some((w) => w.includes("영어"))).toBe(true);
  });
});

describe("졸업관련성적조회 이수내역 (xlsx 행) → 학교 기준", () => {
  const rows: string[][] = [
    ["졸업이수구분", "졸업영역구분", "이수기준", "취득학점", "제외학점"],
    ["교양", "선택교양", "0", "1", "0"],
    ["교양", "핵심-도전", "3", "0", "0"],
    ["교양", "교양(교양 최대 이수가능학점)", "45.0", "1", "0"],
    ["전공", "전공(전공필수)", "84(12)", "1(1)", "0"],
    ["전공", "전공심화(전공필수)", "84(12)", "0(0)", "0"],
    ["군사학", "군사학", "0", "0", "0"],
    ["다전공", "복수전공", "45", "0", "0"],
    ["졸업학점", "졸업가능학점(취득학점)", "140.0", "1", "0"],
    ["", "", "", "", ""],
  ];

  it("행 이름 기준으로 읽고, 형식 고유 이름을 규칙 행 이름으로 바꾼다", () => {
    const o = parseGradSummaryRows(rows);
    expect(o.source).toBe("grad_summary_xlsx");
    const byName = Object.fromEntries(o.rows.map((r) => [r.name, r.criterion]));
    expect(byName["선택교양"]).toBe(0);
    expect(byName["핵심-도전"]).toBe(3);
    expect(byName["교양"]).toBe(45);
    expect(byName["졸업"]).toBe(140);
  });

  it('"전공(전공필수)" 84(12) → 전공 84, 전공필수 12', () => {
    const byName = Object.fromEntries(parseGradSummaryRows(rows).rows.map((r) => [r.name, r.criterion]));
    expect(byName["전공"]).toBe(84);
    expect(byName["전공필수"]).toBe(12);
  });

  it("MVP에서 무시하는 행도 원래 이름·값으로 남긴다 (알 수 없는 기준 목록용)", () => {
    const o = parseGradSummaryRows(rows);
    const deep = o.rows.find((r) => r.name === "전공심화(전공필수)")!;
    expect(deep.criterion).toBeNull();
    expect(deep.raw).toBe("84(12)");
    expect(o.rows.find((r) => r.name === "복수전공")!.criterion).toBe(45);
    expect(o.rows.some((r) => r.name === "군사학")).toBe(true);
  });

  it("행 순서가 바뀌어도 같은 결과", () => {
    const shuffled = [rows[0]!, ...rows.slice(1).reverse()];
    const sort = (o: ReturnType<typeof parseGradSummaryRows>) => [...o.rows].sort((a, b) => a.name.localeCompare(b.name));
    expect(sort(parseGradSummaryRows(shuffled))).toEqual(sort(parseGradSummaryRows(rows)));
  });

  it("머리글 열 순서가 달라도 열 이름으로 찾는다", () => {
    const swapped = rows.map((r) => [r[2]!, r[1]!, r[0]!, r[3]!, r[4]!]);
    const byName = Object.fromEntries(parseGradSummaryRows(swapped).rows.map((r) => [r.name, r.criterion]));
    expect(byName["교양"]).toBe(45);
  });

  it("머리글이 없으면 오류", () => {
    expect(() => parseGradSummaryRows([["가", "나"]])).toThrow(/졸업영역구분/);
  });
});
