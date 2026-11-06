// 개발·정적 export 모두 설치된 pdfjs 버전과 같은 자산을 자체 사이트에서 제공한다.
import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const source = dirname(require.resolve("pdfjs-dist/package.json"));
const target = fileURLToPath(new URL("../public/pdfjs/", import.meta.url));
await mkdir(target, { recursive: true });
for (const name of ["cmaps", "standard_fonts"]) await cp(join(source, name), join(target, name), { recursive: true });
await cp(join(source, "legacy/build/pdf.worker.mjs"), join(target, "pdf.worker.mjs"));
await cp(join(source, "LICENSE"), join(target, "LICENSE"));
