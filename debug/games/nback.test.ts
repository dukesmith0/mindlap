import { describe, expect, it } from "vitest";
import {
  generateStream,
  scoreTrials,
  LETTERS,
  TOTAL_TRIALS,
  LETTER_MS,
  BLANK_MS,
  TRIAL_MS,
} from "@/lib/games/nback";

describe("nback.generateStream", () => {
  it("returns a stream of the requested length", () => {
    const { stream, isTarget } = generateStream(22, 0.3);
    expect(stream.length).toBe(22);
    expect(isTarget.length).toBe(22);
  });

  it("first two trials are never targets", () => {
    for (let i = 0; i < 100; i++) {
      const { isTarget } = generateStream(22, 0.5);
      expect(isTarget[0]).toBe(false);
      expect(isTarget[1]).toBe(false);
    }
  });

  it("only uses letters from LETTERS pool", () => {
    const pool = new Set<string>(LETTERS);
    for (let i = 0; i < 50; i++) {
      const { stream } = generateStream(22, 0.3);
      for (const letter of stream) expect(pool.has(letter)).toBe(true);
    }
  });

  it("isTarget[i] = (stream[i] === stream[i-2]) for i>=2", () => {
    for (let i = 0; i < 50; i++) {
      const { stream, isTarget } = generateStream(22, 0.3);
      for (let k = 2; k < stream.length; k++) {
        expect(isTarget[k]).toBe(stream[k] === stream[k - 2]);
      }
    }
  });

  it("non-target trials never accidentally collide with stream[i-2]", () => {
    // With targetProb=0, every trial 2+ should be a non-target.
    for (let i = 0; i < 100; i++) {
      const { stream, isTarget } = generateStream(22, 0);
      for (let k = 2; k < stream.length; k++) {
        expect(isTarget[k]).toBe(false);
        expect(stream[k]).not.toBe(stream[k - 2]);
      }
    }
  });

  it("targets approximately match the requested probability", () => {
    let total = 0;
    let targets = 0;
    for (let i = 0; i < 200; i++) {
      const { isTarget } = generateStream(22, 0.3);
      for (let k = 2; k < isTarget.length; k++) {
        total++;
        if (isTarget[k]) targets++;
      }
    }
    const ratio = targets / total;
    expect(ratio).toBeGreaterThan(0.2);
    expect(ratio).toBeLessThan(0.4);
  });
});

describe("nback.scoreTrials", () => {
  it("hits + misses equal the number of targets in scorable range", () => {
    const isTarget = [false, false, true, false, true, true, false, false, true, false];
    const responses = [false, false, true, false, false, true, false, true, false, false];
    const r = scoreTrials(isTarget, responses);
    expect(r.hits).toBe(2);
    expect(r.misses).toBe(2);
    expect(r.falseAlarms).toBe(1);
    expect(r.correctRejections).toBe(3);
  });

  it("perfect run scores 100", () => {
    const isTarget = [false, false, true, false, true];
    const responses = [false, false, true, false, true];
    expect(scoreTrials(isTarget, responses).accuracy).toBe(100);
  });

  it("no responses on all-target stream scores 0", () => {
    const isTarget = [false, false, true, true, true, true, true];
    const responses = [false, false, false, false, false, false, false];
    expect(scoreTrials(isTarget, responses).accuracy).toBe(0);
  });

  it("ignores trials at index 0 and 1", () => {
    const isTarget = [true, true, false, false];
    const responses = [true, true, true, false];
    const r = scoreTrials(isTarget, responses);
    expect(r.hits).toBe(0);
    expect(r.falseAlarms).toBe(1);
  });

  it("returns 0 accuracy on empty scorable range", () => {
    expect(scoreTrials([false, false], [false, false]).accuracy).toBe(0);
  });
});

describe("nback constants", () => {
  it("match locked spec", () => {
    expect(LETTERS).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
    expect(TOTAL_TRIALS).toBe(22);
    expect(LETTER_MS).toBe(1000);
    expect(BLANK_MS).toBe(1500);
    expect(TRIAL_MS).toBe(2500);
  });
});
