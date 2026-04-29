import { describe, expect, it } from "vitest";
import {
  generateTrial,
  isCorrect,
  COLORS,
  COLOR_HEX,
  DURATION_MS,
  INCONGRUENT_PROB,
  type StroopTrial,
} from "@/lib/games/stroop";

describe("stroop.generateTrial", () => {
  it("word is uppercase one of the four colors", () => {
    const allowed = new Set(COLORS.map((c) => c.toUpperCase()));
    for (let i = 0; i < 200; i++) {
      const t = generateTrial();
      expect(allowed.has(t.word)).toBe(true);
    }
  });

  it("ink is one of the four colors", () => {
    const pool = new Set<string>(COLORS);
    for (let i = 0; i < 200; i++) {
      const t = generateTrial();
      expect(pool.has(t.ink)).toBe(true);
    }
  });

  it("congruent flag matches word/ink alignment", () => {
    for (let i = 0; i < 200; i++) {
      const t = generateTrial();
      expect(t.congruent).toBe(t.word.toLowerCase() === t.ink);
    }
  });

  it("never produces the same (word, ink) pair back-to-back", () => {
    let prev: StroopTrial | null = null;
    for (let i = 0; i < 1000; i++) {
      const t = generateTrial(0.7, prev);
      if (prev) {
        const sameWord = t.word === prev.word;
        const sameInk = t.ink === prev.ink;
        expect(sameWord && sameInk).toBe(false);
      }
      prev = t;
    }
  });

  it("incongruentProb=0 yields only congruent trials", () => {
    for (let i = 0; i < 200; i++) {
      const t = generateTrial(0);
      expect(t.congruent).toBe(true);
    }
  });

  it("incongruentProb=1 yields only incongruent trials", () => {
    for (let i = 0; i < 200; i++) {
      const t = generateTrial(1);
      expect(t.congruent).toBe(false);
    }
  });
});

describe("stroop.isCorrect", () => {
  it("returns true iff selected ink matches", () => {
    const trial: StroopTrial = { word: "RED", ink: "blue", congruent: false };
    expect(isCorrect(trial, "blue")).toBe(true);
    expect(isCorrect(trial, "red")).toBe(false);
  });
});

describe("stroop constants", () => {
  it("match locked spec", () => {
    expect(COLORS).toEqual(["red", "blue", "green", "yellow"]);
    expect(DURATION_MS).toBe(30_000);
    expect(INCONGRUENT_PROB).toBe(0.7);
    expect(Object.keys(COLOR_HEX).sort()).toEqual([...COLORS].sort());
  });
});
