import { describe, expect, it } from "vitest";
import { getBonusGames, isBonusGame } from "@/lib/daily-bonus";
import { GAME_KEYS } from "@/lib/games/registry";

describe("daily-bonus.getBonusGames", () => {
  it("is deterministic per PT date string", () => {
    const a = getBonusGames("2026-04-28");
    const b = getBonusGames("2026-04-28");
    expect(a).toEqual(b);
  });

  it("returns exactly two distinct game keys", () => {
    for (let day = 1; day <= 60; day++) {
      const date = `2026-04-${String(day).padStart(2, "0")}`;
      const [x, y] = getBonusGames(date);
      expect(x).not.toBe(y);
      expect((GAME_KEYS as readonly string[]).includes(x)).toBe(true);
      expect((GAME_KEYS as readonly string[]).includes(y)).toBe(true);
    }
  });

  it("rotates over time (not always the same pair)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const date = `2026-04-${String((i % 28) + 1).padStart(2, "0")}`;
      seen.add(getBonusGames(date).join(","));
    }
    expect(seen.size).toBeGreaterThan(2);
  });

  it("isBonusGame agrees with getBonusGames", () => {
    const date = "2026-05-15";
    const [a, b] = getBonusGames(date);
    for (const key of GAME_KEYS) {
      expect(isBonusGame(date, key)).toBe(key === a || key === b);
    }
  });

  it("orders by sortOrder so caller comparisons are stable", () => {
    for (let i = 1; i <= 30; i++) {
      const date = `2026-06-${String(i).padStart(2, "0")}`;
      const [a, b] = getBonusGames(date);
      expect(GAME_KEYS.indexOf(a)).toBeLessThan(GAME_KEYS.indexOf(b));
    }
  });
});
