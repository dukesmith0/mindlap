import { describe, expect, it } from "vitest";
import {
  WORDLIST,
  selectWords,
  scoreRecall,
  WORDS_PER_ROUND,
  SHOW_DURATION_MS,
} from "@/lib/games/word";

describe("word.WORDLIST", () => {
  it("has at least 100 entries", () => {
    expect(WORDLIST.length).toBeGreaterThanOrEqual(100);
  });

  it("entries are lowercase letters only", () => {
    for (const w of WORDLIST) expect(/^[a-z]+$/.test(w)).toBe(true);
  });

  it("has no duplicates", () => {
    expect(new Set(WORDLIST).size).toBe(WORDLIST.length);
  });
});

describe("word.selectWords", () => {
  it("returns the requested count", () => {
    for (const n of [1, 5, 10, 20]) {
      expect(selectWords(n).length).toBe(n);
    }
  });

  it("returns distinct words", () => {
    for (let i = 0; i < 50; i++) {
      const sel = selectWords(10);
      expect(new Set(sel).size).toBe(10);
    }
  });

  it("returns at most pool size when count > pool", () => {
    const small = ["a", "b", "c"];
    expect(selectWords(10, small).length).toBe(3);
  });

  it("does not mutate the source pool", () => {
    const before = WORDLIST.slice();
    selectWords(10);
    expect(WORDLIST).toEqual(before);
  });
});

describe("word.scoreRecall", () => {
  it("matches case-insensitively", () => {
    expect(scoreRecall(["apple", "river"], "Apple River")).toBe(2);
  });

  it("dedupes user input", () => {
    expect(scoreRecall(["apple"], "apple apple apple")).toBe(1);
  });

  it("ignores non-letter separators", () => {
    expect(scoreRecall(["apple", "river"], "apple, river. cloud!")).toBe(2);
  });

  it("does not penalize wrong words", () => {
    expect(scoreRecall(["apple"], "apple banana cherry")).toBe(1);
  });

  it("returns 0 for empty or non-string input", () => {
    expect(scoreRecall(["apple"], "")).toBe(0);
    expect(scoreRecall(["apple"], null as unknown as string)).toBe(0);
  });

  it("max score equals shown count", () => {
    const shown = ["a", "b", "c", "d"];
    expect(scoreRecall(shown, "a b c d")).toBe(4);
  });
});

describe("word constants", () => {
  it("match locked spec (10 words, 20s)", () => {
    expect(WORDS_PER_ROUND).toBe(10);
    expect(SHOW_DURATION_MS).toBe(20_000);
  });
});
