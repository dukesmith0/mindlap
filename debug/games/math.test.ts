import { describe, expect, it } from "vitest";
import { generateProblem, DURATION_MS, SKIP_PENALTY_MS } from "@/lib/games/math";

describe("math.generateProblem", () => {
  it("returns text and answer", () => {
    const p = generateProblem();
    expect(typeof p.text).toBe("string");
    expect(typeof p.answer).toBe("number");
    expect(p.text.length).toBeGreaterThan(0);
  });

  it("answers are always non-negative integers", () => {
    for (let i = 0; i < 500; i++) {
      const p = generateProblem();
      expect(Number.isInteger(p.answer)).toBe(true);
      expect(p.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("subtraction never yields a negative result", () => {
    for (let i = 0; i < 500; i++) {
      const p = generateProblem();
      if (p.text.includes(" - ")) {
        const [lhs, rhs] = p.text.split(" - ").map((s) => Number(s.trim()));
        expect(lhs! - rhs!).toBeGreaterThanOrEqual(0);
        expect(p.answer).toBe(lhs! - rhs!);
      }
    }
  });

  it("division yields whole-number answers", () => {
    for (let i = 0; i < 500; i++) {
      const p = generateProblem();
      if (p.text.includes(" ÷ ")) {
        const [num, den] = p.text.split(" ÷ ").map((s) => Number(s.trim()));
        expect(num! % den!).toBe(0);
        expect(p.answer).toBe(num! / den!);
      }
    }
  });

  it("addition / multiplication answers match operands", () => {
    for (let i = 0; i < 500; i++) {
      const p = generateProblem();
      if (p.text.includes(" + ")) {
        const [a, b] = p.text.split(" + ").map((s) => Number(s.trim()));
        expect(p.answer).toBe(a! + b!);
      } else if (p.text.includes(" × ")) {
        const [a, b] = p.text.split(" × ").map((s) => Number(s.trim()));
        expect(p.answer).toBe(a! * b!);
      }
    }
  });

  it("includes all four operations across many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const p = generateProblem();
      if (p.text.includes(" + ")) seen.add("+");
      else if (p.text.includes(" - ")) seen.add("-");
      else if (p.text.includes(" × ")) seen.add("×");
      else if (p.text.includes(" ÷ ")) seen.add("÷");
    }
    expect(seen.size).toBe(4);
  });

  it("constants match locked spec", () => {
    expect(DURATION_MS).toBe(60_000);
    expect(SKIP_PENALTY_MS).toBe(3_000);
  });
});
