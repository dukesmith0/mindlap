import { describe, expect, it } from "vitest";
import { pickMessage } from "@/components/today/TodayMilestoneBanner";

const TOTAL = 7;

describe("TodayMilestoneBanner pickMessage (#51)", () => {
  it("returns null when nothing milestone-worthy", () => {
    expect(
      pickMessage({ streakCurrent: 0, gamesPlayedToday: 0, pbSetToday: false, totalGames: TOTAL }),
    ).toBeNull();
  });

  it("clean-sweep wins over PB and streak", () => {
    const m = pickMessage({
      streakCurrent: 5,
      gamesPlayedToday: 7,
      pbSetToday: true,
      totalGames: TOTAL,
    });
    expect(m?.text).toMatch(/all 7 games today/);
  });

  it("PB wins over streak", () => {
    const m = pickMessage({
      streakCurrent: 5,
      gamesPlayedToday: 3,
      pbSetToday: true,
      totalGames: TOTAL,
    });
    expect(m?.text).toMatch(/personal best/);
  });

  it("streak surfaces when no PB and not all games", () => {
    const m = pickMessage({
      streakCurrent: 12,
      gamesPlayedToday: 1,
      pbSetToday: false,
      totalGames: TOTAL,
    });
    expect(m?.text).toMatch(/day 12 streak/);
  });

  it("plays-today fallback shown only when there is play activity", () => {
    const m = pickMessage({
      streakCurrent: 0,
      gamesPlayedToday: 4,
      pbSetToday: false,
      totalGames: TOTAL,
    });
    expect(m?.text).toBe("4 / 7 games today");
  });
});
