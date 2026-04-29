import { describe, expect, it } from "vitest";
import {
  generateMines,
  computeCounts,
  revealFlood,
  isWon,
  N,
  MINE_COUNT,
} from "@/lib/games/mine";

describe("mine.generateMines", () => {
  it("places exactly mineCount mines", () => {
    for (let i = 0; i < 50; i++) {
      const mines = generateMines(N, N, MINE_COUNT, 5, 5);
      let count = 0;
      for (const row of mines) for (const cell of row) if (cell) count++;
      expect(count).toBe(MINE_COUNT);
    }
  });

  it("never places a mine in the 3x3 safe zone around the first click", () => {
    for (let i = 0; i < 50; i++) {
      const mines = generateMines(N, N, MINE_COUNT, 4, 4);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          expect(mines[4 + dr]![4 + dc]).toBe(false);
        }
      }
    }
  });

  it("clamps mineCount to available cells", () => {
    const mines = generateMines(3, 3, 100, 1, 1);
    let count = 0;
    for (const row of mines) for (const cell of row) if (cell) count++;
    // 9 - safe zone (the entire 3x3) = 0 placeable cells
    expect(count).toBe(0);
  });
});

describe("mine.computeCounts", () => {
  it("mine cells get -1", () => {
    const mines = [
      [true, false, false],
      [false, false, false],
      [false, false, false],
    ];
    const counts = computeCounts(mines);
    expect(counts[0]![0]).toBe(-1);
  });

  it("non-mine cells reflect adjacent mine count", () => {
    const mines = [
      [true, false, false],
      [false, false, false],
      [false, false, false],
    ];
    const counts = computeCounts(mines);
    expect(counts[0]![1]).toBe(1);
    expect(counts[1]![0]).toBe(1);
    expect(counts[1]![1]).toBe(1);
    expect(counts[2]![2]).toBe(0);
  });

  it("center surrounded by 8 mines counts to 8", () => {
    const mines = Array.from({ length: 3 }, () => Array(3).fill(true));
    mines[1]![1] = false;
    const counts = computeCounts(mines);
    expect(counts[1]![1]).toBe(8);
  });
});

describe("mine.revealFlood", () => {
  it("reveals only the clicked cell when count > 0", () => {
    const counts = [
      [1, 1, 0],
      [1, 0, 0],
      [0, 0, 0],
    ];
    const revealed = Array.from({ length: 3 }, () => Array(3).fill(false));
    const opened = revealFlood(counts, revealed, 0, 0);
    expect(opened.length).toBe(1);
    expect(revealed[0]![0]).toBe(true);
    expect(revealed[1]![1]).toBe(false);
  });

  it("flood-fills connected zero-count cells and their numbered borders", () => {
    const counts = [
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ];
    const revealed = Array.from({ length: 3 }, () => Array(3).fill(false));
    revealFlood(counts, revealed, 0, 0);
    // All 9 cells should be revealed (zeros + their numbered borders).
    for (const row of revealed) for (const cell of row) expect(cell).toBe(true);
  });

  it("never reveals mine cells (-1) via flood", () => {
    const counts = [
      [-1, 1, 0],
      [1, 0, 0],
      [0, 0, 0],
    ];
    const revealed = Array.from({ length: 3 }, () => Array(3).fill(false));
    revealFlood(counts, revealed, 2, 2);
    expect(revealed[0]![0]).toBe(false);
  });
});

describe("mine.isWon", () => {
  it("returns true when all non-mine cells revealed", () => {
    const mines = [
      [true, false],
      [false, false],
    ];
    const revealed = [
      [false, true],
      [true, true],
    ];
    expect(isWon(mines, revealed)).toBe(true);
  });

  it("returns false if any non-mine cell is unrevealed", () => {
    const mines = [
      [true, false],
      [false, false],
    ];
    const revealed = [
      [false, true],
      [false, true],
    ];
    expect(isWon(mines, revealed)).toBe(false);
  });
});

describe("mine constants", () => {
  it("match locked spec (10x10, 15 mines)", () => {
    expect(N).toBe(10);
    expect(MINE_COUNT).toBe(15);
  });
});
