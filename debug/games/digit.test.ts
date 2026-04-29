import { describe, expect, it } from "vitest";
import {
  generateSequence,
  isMatch,
  getDisplayTime,
  START_LENGTH,
  MAX_LENGTH,
} from "@/lib/games/digit";

describe("digit.generateSequence", () => {
  it("returns a string of the requested length", () => {
    for (const len of [1, 3, 8, 15]) {
      const seq = generateSequence(len);
      expect(seq.length).toBe(len);
    }
  });

  it("contains only digits 0-9", () => {
    for (let i = 0; i < 200; i++) {
      const seq = generateSequence(8);
      expect(/^[0-9]+$/.test(seq)).toBe(true);
    }
  });

  it("returns empty string for length 0", () => {
    expect(generateSequence(0)).toBe("");
  });
});

describe("digit.isMatch", () => {
  it("matches identical sequences", () => {
    expect(isMatch("12345", "12345")).toBe(true);
  });

  it("trims whitespace on both sides", () => {
    expect(isMatch("12345", "  12345  ")).toBe(true);
    expect(isMatch(" 12345 ", "12345")).toBe(true);
  });

  it("rejects mismatches", () => {
    expect(isMatch("12345", "12346")).toBe(false);
    expect(isMatch("12345", "1234")).toBe(false);
    expect(isMatch("12345", "")).toBe(false);
  });
});

describe("digit.getDisplayTime", () => {
  it("returns 2000ms at length 3", () => {
    expect(getDisplayTime(3)).toBe(2000);
  });

  it("adds 500ms per additional digit", () => {
    expect(getDisplayTime(4)).toBe(2500);
    expect(getDisplayTime(5)).toBe(3000);
    expect(getDisplayTime(10)).toBe(5500);
    expect(getDisplayTime(15)).toBe(8000);
  });
});

describe("digit constants", () => {
  it("match locked spec", () => {
    expect(START_LENGTH).toBe(3);
    expect(MAX_LENGTH).toBe(15);
  });
});
