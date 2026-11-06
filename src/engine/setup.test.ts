import { describe, expect, it } from "vitest";
import * as engine from "./index";

describe("저장소 세팅", () => {
  it("엔진 모듈을 불러올 수 있다", () => {
    expect(engine).toBeTypeOf("object");
  });
});
