import { describe, expect, it } from "vitest";
import {
  calculateXp,
  streakMultiplier,
  PARTICIPATION_PER_PLAY,
  PARTICIPATION_DAILY_CAP,
  PB_BONUS_BASE,
  STREAK_MULT_MAX,
  BONUS_MULT,
} from "@/lib/xp";

describe("streakMultiplier", () => {
  it("is 1.0 at streak 0 or 1", () => {
    expect(streakMultiplier(0)).toBe(1.0);
    expect(streakMultiplier(1)).toBe(1.0);
  });

  it("adds 0.1 per streak day above 1", () => {
    expect(streakMultiplier(2)).toBeCloseTo(1.1);
    expect(streakMultiplier(7)).toBeCloseTo(1.6);
  });

  it("plateaus at 2.5 from streak 16 onward", () => {
    expect(streakMultiplier(16)).toBe(STREAK_MULT_MAX);
    expect(streakMultiplier(50)).toBe(STREAK_MULT_MAX);
    expect(streakMultiplier(1000)).toBe(STREAK_MULT_MAX);
  });

  it("clamps negative streaks to 1.0", () => {
    expect(streakMultiplier(-1)).toBe(1.0);
    expect(streakMultiplier(-10)).toBe(1.0);
  });
});

describe("calculateXp - participation", () => {
  it("awards 5 xp on a fresh submission with no prior plays", () => {
    const r = calculateXp({
      participationAwardedToday: 0,
      isNewDailyPb: false,
      streakCurrent: 1,
      isBonusGame: false,
    });
    expect(r.participation).toBe(5);
    expect(r.pb).toBe(0);
  });

  it("returns 0 participation once cap reached", () => {
    const r = calculateXp({
      participationAwardedToday: 5,
      isNewDailyPb: false,
      streakCurrent: 1,
      isBonusGame: false,
    });
    expect(r.participation).toBe(0);
  });

  it("awards remaining cap-slack on a partial day", () => {
    const r = calculateXp({
      participationAwardedToday: 3,
      isNewDailyPb: false,
      streakCurrent: 1,
      isBonusGame: false,
    });
    expect(r.participation).toBe(2);
  });

  it("doubles participation on bonus games", () => {
    const r = calculateXp({
      participationAwardedToday: 0,
      isNewDailyPb: false,
      streakCurrent: 1,
      isBonusGame: true,
    });
    expect(r.participation).toBe(10);
  });

  it("never goes negative if awarded already exceeds cap", () => {
    const r = calculateXp({
      participationAwardedToday: 100,
      isNewDailyPb: false,
      streakCurrent: 1,
      isBonusGame: false,
    });
    expect(r.participation).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateXp - PB bonus", () => {
  it("is 25 at streak 1 with no bonus", () => {
    const r = calculateXp({
      participationAwardedToday: 5,
      isNewDailyPb: true,
      streakCurrent: 1,
      isBonusGame: false,
    });
    expect(r.pb).toBe(25);
  });

  it("scales with streak multiplier", () => {
    const r = calculateXp({
      participationAwardedToday: 5,
      isNewDailyPb: true,
      streakCurrent: 7,
      isBonusGame: false,
    });
    // 25 * 1.6 = 40
    expect(r.pb).toBe(40);
  });

  it("doubles on bonus games", () => {
    const r = calculateXp({
      participationAwardedToday: 5,
      isNewDailyPb: true,
      streakCurrent: 1,
      isBonusGame: true,
    });
    expect(r.pb).toBe(50);
  });

  it("compounds streak + 2x at the plateau (max possible PB single-event)", () => {
    const r = calculateXp({
      participationAwardedToday: 5,
      isNewDailyPb: true,
      streakCurrent: 100,
      isBonusGame: true,
    });
    // 25 * 2.5 * 2.0 = 125
    expect(r.pb).toBe(125);
  });

  it("is 0 when not a new daily PB", () => {
    const r = calculateXp({
      participationAwardedToday: 5,
      isNewDailyPb: false,
      streakCurrent: 7,
      isBonusGame: true,
    });
    expect(r.pb).toBe(0);
  });
});

describe("calculateXp - integration totals", () => {
  it("first submission of a streak-1 normal game = 5 xp (5 participation, 0 pb)", () => {
    const r = calculateXp({
      participationAwardedToday: 0,
      isNewDailyPb: false,
      streakCurrent: 1,
      isBonusGame: false,
    });
    expect(r.total).toBe(5);
  });

  it("first play that sets a PB = 30 (5 + 25)", () => {
    const r = calculateXp({
      participationAwardedToday: 0,
      isNewDailyPb: true,
      streakCurrent: 1,
      isBonusGame: false,
    });
    expect(r.total).toBe(30);
  });

  it("late-day non-PB play with cap reached = 0", () => {
    const r = calculateXp({
      participationAwardedToday: 5,
      isNewDailyPb: false,
      streakCurrent: 1,
      isBonusGame: false,
    });
    expect(r.total).toBe(0);
  });

  it("bonus-day PB at streak 7 = 10 + 80 = 90", () => {
    const r = calculateXp({
      participationAwardedToday: 0,
      isNewDailyPb: true,
      streakCurrent: 7,
      isBonusGame: true,
    });
    // participation 5 * 2 = 10
    // pb 25 * 1.6 * 2 = 80
    expect(r.total).toBe(90);
  });

  it("streak >= 16 PB-only = 62 (Math.trunc(25 * 2.5))", () => {
    const r = calculateXp({
      participationAwardedToday: 5,
      isNewDailyPb: true,
      streakCurrent: 16,
      isBonusGame: false,
    });
    expect(r.total).toBe(Math.trunc(25 * 2.5));
  });
});

describe("calculateXp - constants match decisions.md", () => {
  it("constants are locked", () => {
    expect(PARTICIPATION_PER_PLAY).toBe(5);
    expect(PARTICIPATION_DAILY_CAP).toBe(5);
    expect(PB_BONUS_BASE).toBe(25);
    expect(STREAK_MULT_MAX).toBe(2.5);
    expect(BONUS_MULT).toBe(2.0);
  });
});
