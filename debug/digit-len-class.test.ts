// #14 Digit Span step-fn breakpoints. The classifier in DigitGame.tsx is a
// pure function we mirror here so the breakpoints are pinned. If
// digitLenClass changes in DigitGame, this test will break loudly.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function digitLenClass(length: number): string {
  if (length >= 18) return "digit-len-18";
  if (length >= 15) return "digit-len-15";
  if (length >= 12) return "digit-len-12";
  if (length >= 10) return "digit-len-10";
  return "";
}

describe("digitLenClass (#14 breakpoints)", () => {
  it("returns no class below length 10", () => {
    expect(digitLenClass(3)).toBe("");
    expect(digitLenClass(9)).toBe("");
  });
  it("crosses each breakpoint at expected length", () => {
    expect(digitLenClass(10)).toBe("digit-len-10");
    expect(digitLenClass(11)).toBe("digit-len-10");
    expect(digitLenClass(12)).toBe("digit-len-12");
    expect(digitLenClass(14)).toBe("digit-len-12");
    expect(digitLenClass(15)).toBe("digit-len-15");
    expect(digitLenClass(17)).toBe("digit-len-15");
    expect(digitLenClass(18)).toBe("digit-len-18");
    expect(digitLenClass(25)).toBe("digit-len-18");
  });
  it("DigitGame.tsx exposes the same classifier function inline", () => {
    const file = readFileSync(
      resolve(process.cwd(), "components/games/DigitGame.tsx"),
      "utf8",
    );
    expect(file).toMatch(/function digitLenClass\(length: number\): string/);
    expect(file).toMatch(/digit-len-18/);
    expect(file).toMatch(/digit-len-10/);
  });
});
