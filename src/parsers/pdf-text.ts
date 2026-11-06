/**
 * PDF → 텍스트 (1단계). 텍스트 → 레코드(2단계)는 문서별 파서가 맡는다.
 * 붙여넣기 입력은 2단계만 쓴다 — 칸은 탭, 줄은 줄바꿈.
 */

export type TextItem = { x: number; y: number; str: string; width: number };

/** 같은 줄로 보는 y 차이 */
const LINE_TOLERANCE = 2;
/** 이 간격 이하면 같은 칸 (성적내역: 칸 안 -3~1, 칸 사이 8 이상) */
const SAME_CELL_GAP = 6;
/** 이 간격 이하면 공백 없이 붙인다 */
const TIGHT_GAP = 1.5;

/** 텍스트 조각 → 줄(위→아래), 칸은 탭 */
export function itemsToText(items: TextItem[]): string {
  const rows: { y: number; items: TextItem[] }[] = [];
  for (const it of items) {
    if (!it.str.trim()) continue;
    let row = rows.find((r) => Math.abs(r.y - it.y) <= LINE_TOLERANCE);
    if (!row) rows.push((row = { y: it.y, items: [] }));
    row.items.push(it);
  }
  rows.sort((a, b) => b.y - a.y);
  return rows
    .map((r) => {
      let out = "";
      let end = -Infinity;
      for (const it of [...r.items].sort((a, b) => a.x - b.x)) {
        const s = it.str.trim();
        const gap = it.x - end;
        out = out === "" ? s : gap <= TIGHT_GAP ? out + s : gap <= SAME_CELL_GAP ? `${out} ${s}` : `${out}\t${s}`;
        end = it.x + it.width;
      }
      return out;
    })
    .join("\n");
}

export type PdfTextOptions = {
  /** pdfjs-dist/cmaps/ 위치 (한글 CID 글꼴에 필요) */
  cMapUrl: string;
  standardFontDataUrl: string;
  /** pdf.worker.mjs 위치 (브라우저·Node 모두 필요) */
  workerSrc: string;
};

/** PDF 파일 바이트 → 페이지별 텍스트를 이어 붙인 문자열 */
export async function extractPdfText(data: Uint8Array, opts: PdfTextOptions): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = opts.workerSrc;
  const task = pdfjs.getDocument({
    data,
    cMapUrl: opts.cMapUrl,
    cMapPacked: true,
    standardFontDataUrl: opts.standardFontDataUrl,
  });
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const content = await (await doc.getPage(p)).getTextContent();
      const items: TextItem[] = [];
      for (const it of content.items) {
        if ("str" in it) items.push({ x: it.transform[4], y: it.transform[5], str: it.str, width: it.width });
      }
      pages.push(itemsToText(items));
    }
    return pages.join("\n");
  } finally {
    await task.destroy();
  }
}
