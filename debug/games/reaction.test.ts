import { describe, expect, it } from "vitest";
import {
  calculateAverage,
  getRandomDelay,
  TOTAL_TRIALS,
  MIN_DELAY_MS,
  MAX_DELAY_MS,
} from "@/lib/games/reaction";

describe("reaction.calculateAverage", () => {
  it("returns rounded mean", () => {
    expect(calculateAverage([100, 200, 300])).toBe(200);
    expect(calculateAverage([250, 251])).toBe(251);
  });

  it("returns 0 on empty input", () => {
    expect(calculateAverage([])).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(calculateAverage([100, 101])).toBe(101);
    expect(calculateAverage([100, 100, 101])).toBe(100);
  });
});

describe("reaction.getRandomDelay", () => {
  it("returns an integer in [MIN, MAX]", () => {
    for (let i = 0; i < 500; i++) {
      const d = getRandomDelay();
      expect(Number.isInteger(d)).toBe(true);
      expect(d).toBeGreaterThanOrEqual(MIN_DELAY_MS);
      expect(d).toBeLessThanOrEqual(MAX_DELAY_MS);
    }
  });
});

describe("reaction constants", () => {
  it("match locked spec", () => {
    expect(TOTAL_TRIALS).toBe(5);
    expect(MIN_DELAY_MS).toBe(2000);
    expect(MAX_DELAY_MS).toBe(5000);
  });
});
