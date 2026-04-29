// Cross-game edge cases. Targets boundary inputs, score-direction sanity,
// registry consistency, and concurrency-of-state in the lib layer (timer-free).

import { describe, expect, it } from "vitest";
import { generateProblem } from "@/lib/games/math";
import { generateSequence, getDisplayTime, isMatch, MAX_LENGTH, START_LENGTH } from "@/lib/games/digit";
import { generateStream, scoreTrials, TOTAL_TRIALS, LETTERS } from "@/lib/games/nback";
import { generateTrial, isCorrect, COLORS, type StroopTrial } from "@/lib/games/stroop";
import { calculateAverage, getRandomDelay, MIN_DELAY_MS, MAX_DELAY_MS } from "@/lib/games/reaction";
import { generateMines, computeCounts, revealFlood, isWon, N, MINE_COUNT } from "@/lib/games/mine";
import { selectWords, scoreRecall, WORDLIST, WORDS_PER_ROUND } from "@/lib/games/word";
import { GAMES, GAME_KEYS } from "@/lib/games/registry";

describe("registry consistency", () => {
  it("GAME_KEYS exactly matches GAMES keys", () => {
    expect([...GAME_KEYS].sort()).toEqual(Object.keys(GAMES).sort());
  });

  it("sortOrder values are unique 1..7", () => {
    const orders = GAME_KEYS.map((k) => GAMES[k].sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
    expect(Math.min(...orders)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...orders)).toBeLessThanOrEqual(7);
  });

  it("each game has non-empty name and tagline", () => {
    for (const key of GAME_KEYS) {
      expect(GAMES[key].name.length).toBeGreaterThan(0);
      expect(GAMES[key].tagline.length).toBeGreaterThan(0);
    }
  });

  it("direction is either higher or lower", () => {
    for (const key of GAME_KEYS) {
      expect(["higher", "lower"]).toContain(GAMES[key].direction);
    }
  });

  it("4 core games match decision: math, digit, nback, stroop", () => {
    const cores = GAME_KEYS.filter((k) => GAMES[k].isCore);
    expect(cores).toEqual(["math", "digit", "nback", "stroop"]);
  });
});

describe("math edge cases", () => {
  it("subtraction never produces negative even with extreme draws", () => {
    let sawSub = false;
    for (let i = 0; i < 5000; i++) {
      const p = generateProblem();
      if (p.text.includes(" - ")) {
        sawSub = true;
        const [lhs, rhs] = p.text.split(" - ").map((s) => Number(s.trim()));
        expect(lhs! - rhs!).toBeGreaterThanOrEqual(0);
      }
    }
    expect(sawSub).toBe(true);
  });

  it("answers always fit safe integer range", () => {
    for (let i = 0; i < 1000; i++) {
      const p = generateProblem();
      expect(Number.isSafeInteger(p.answer)).toBe(true);
      expect(p.answer).toBeLessThanOrEqual(12 * 100); // mult upper bound
    }
  });
});

describe("digit edge cases", () => {
  it("getDisplayTime is monotonic over [START_LENGTH, MAX_LENGTH]", () => {
    let prev = -1;
    for (let len = START_LENGTH; len <= MAX_LENGTH; len++) {
      const t = getDisplayTime(len);
      expect(t).toBeGreaterThan(prev);
      prev = t;
    }
  });

  it("isMatch trims tabs/newlines too, not just spaces", () => {
    expect(isMatch("123", "\t123\n")).toBe(true);
    expect(isMatch("123", "  123\r\n")).toBe(true);
  });

  it("generateSequence at MAX_LENGTH still returns exactly MAX_LENGTH chars", () => {
    expect(generateSequence(MAX_LENGTH).length).toBe(MAX_LENGTH);
  });
});

describe("nback edge cases", () => {
  it("targetProb=1 still respects 'first two never targets'", () => {
    for (let i = 0; i < 50; i++) {
      const { isTarget } = generateStream(TOTAL_TRIALS, 1);
      expect(isTarget[0]).toBe(false);
      expect(isTarget[1]).toBe(false);
    }
  });

  it("targetProb=1 produces all targets from index 2 onward", () => {
    for (let i = 0; i < 30; i++) {
      const { stream, isTarget } = generateStream(TOTAL_TRIALS, 1);
      for (let k = 2; k < TOTAL_TRIALS; k++) {
        expect(isTarget[k]).toBe(true);
        expect(stream[k]).toBe(stream[k - 2]);
      }
    }
  });

  it("scoreTrials handles all-correct edge: every target hit, every non-target rejected", () => {
    const isTarget = [false, false, true, false, true, false];
    const responses = [false, false, true, false, true, false];
    expect(scoreTrials(isTarget, responses).accuracy).toBe(100);
  });

  it("scoreTrials handles all-wrong edge: hits become misses, rejections become false alarms", () => {
    const isTarget = [false, false, true, false, true, false];
    const responses = [true, true, false, true, false, true];
    const r = scoreTrials(isTarget, responses);
    expect(r.accuracy).toBe(0);
  });

  it("LETTERS pool size 8 keeps stream readable", () => {
    expect(LETTERS.length).toBe(8);
  });
});

describe("stroop edge cases", () => {
  it("incongruentProb=0.5 produces both kinds of trials", () => {
    let cong = 0;
    let incong = 0;
    let prev: StroopTrial | null = null;
    for (let i = 0; i < 500; i++) {
      const t = generateTrial(0.5, prev);
      if (t.congruent) cong++;
      else incong++;
      prev = t;
    }
    expect(cong).toBeGreaterThan(50);
    expect(incong).toBeGreaterThan(50);
  });

  it("isCorrect is direction-agnostic over all pairs", () => {
    for (const ink of COLORS) {
      for (const guess of COLORS) {
        const trial: StroopTrial = { word: "RED", ink, congruent: false };
        expect(isCorrect(trial, guess)).toBe(guess === ink);
      }
    }
  });
});

describe("reaction edge cases", () => {
  it("calculateAverage handles single-trial input", () => {
    expect(calculateAverage([250])).toBe(250);
  });

  it("calculateAverage handles a 5-element worst-case (all max delay)", () => {
    expect(calculateAverage([1000, 1000, 1000, 1000, 1000])).toBe(1000);
  });

  it("getRandomDelay range is correct width", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) seen.add(getRandomDelay());
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(MIN_DELAY_MS);
    expect(Math.max(...seen)).toBeLessThanOrEqual(MAX_DELAY_MS);
  });
});

describe("mine edge cases", () => {
  it("center-clicked safe zone is exactly 9 cells, mines = MINE_COUNT", () => {
    for (let i = 0; i < 30; i++) {
      const mines = generateMines(N, N, MINE_COUNT, 5, 5);
      let safe = 0;
      let count = 0;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (mines[r]![c]) count++;
          else if (Math.abs(r - 5) <= 1 && Math.abs(c - 5) <= 1) safe++;
        }
      }
      expect(count).toBe(MINE_COUNT);
      expect(safe).toBe(9);
    }
  });

  it("corner-clicked safe zone is exactly 4 cells (3x3 trimmed by edges)", () => {
    for (let i = 0; i < 30; i++) {
      const mines = generateMines(N, N, MINE_COUNT, 0, 0);
      let safe = 0;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (!mines[r]![c] && Math.abs(r - 0) <= 1 && Math.abs(c - 0) <= 1) safe++;
        }
      }
      expect(safe).toBe(4);
    }
  });

  it("computeCounts on all-mines returns all -1", () => {
    const mines = Array.from({ length: 3 }, () => Array(3).fill(true));
    const counts = computeCounts(mines);
    for (const row of counts) for (const v of row) expect(v).toBe(-1);
  });

  it("revealFlood on a single isolated zero opens its full 3x3 neighborhood", () => {
    const counts = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const revealed = Array.from({ length: 3 }, () => Array(3).fill(false));
    revealFlood(counts, revealed, 1, 1);
    for (const row of revealed) for (const v of row) expect(v).toBe(true);
  });

  it("isWon returns true on an empty 1x1 grid with no mines", () => {
    expect(isWon([[false]], [[true]])).toBe(true);
    expect(isWon([[false]], [[false]])).toBe(false);
  });
});

describe("word edge cases", () => {
  it("scoreRecall is order-insensitive", () => {
    const shown = ["apple", "river", "cloud"];
    expect(scoreRecall(shown, "river apple cloud")).toBe(3);
    expect(scoreRecall(shown, "cloud apple river")).toBe(3);
  });

  it("scoreRecall handles huge dedup input efficiently", () => {
    const shown = ["apple"];
    const huge = "apple ".repeat(10_000);
    expect(scoreRecall(shown, huge)).toBe(1);
  });

  it("scoreRecall ignores numbers and punctuation", () => {
    expect(scoreRecall(["apple"], "1 apple 2 banana 3")).toBe(1);
    expect(scoreRecall(["apple"], "apple!!?,.")).toBe(1);
  });

  it("selectWords with count=0 returns empty array", () => {
    expect(selectWords(0)).toEqual([]);
  });

  it("selectWords distribution covers most of the pool over many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      for (const w of selectWords(WORDS_PER_ROUND)) seen.add(w);
    }
    // Over 200 draws of 10 from 115, we expect to see most of the list.
    expect(seen.size).toBeGreaterThan(WORDLIST.length * 0.9);
  });
});
