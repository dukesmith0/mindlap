import { describe, expect, it } from "vitest";
import { badgeIcon, badgeLabel } from "@/lib/badges/icons";
import { GAME_KEYS } from "@/lib/games/registry";

describe("badgeIcon", () => {
  it("maps streak tiers to fire emoji", () => {
    expect(badgeIcon("streak_3")).toBe("🔥");
    expect(badgeIcon("streak_7")).toBe("🔥");
    expect(badgeIcon("streak_30")).toBe("🔥");
    expect(badgeIcon("streak_100")).toBe("🔥");
  });

  it("maps all_seven_today to a target emoji", () => {
    expect(badgeIcon("all_seven_today")).toBe("🎯");
  });

  it("maps every game's pb_first_<key> to a single game-themed emoji", () => {
    const seen = new Set<string>();
    for (const key of GAME_KEYS) {
      const icon = badgeIcon(`pb_first_${key}`);
      // Single emoji, not the trophy combo we tried earlier.
      expect(icon.length).toBeGreaterThan(0);
      expect(icon).not.toMatch(/^🏆./);
      seen.add(icon);
    }
    // Each game gets a distinct icon.
    expect(seen.size).toBe(GAME_KEYS.length);
  });

  it("falls back to a bullet for unknown badge keys", () => {
    expect(badgeIcon("totally_unknown_badge")).toBe("•");
    expect(badgeIcon("")).toBe("•");
  });

  it("returns trophy fallback for malformed pb_first_<unknown_game>", () => {
    expect(badgeIcon("pb_first_notagame")).toBe("🏆");
  });
});

describe("badgeLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(badgeLabel("streak_30")).toBe("streak 30");
    expect(badgeLabel("pb_first_math")).toBe("pb first math");
    expect(badgeLabel("all_seven_today")).toBe("all seven today");
  });

  it("leaves single-word keys unchanged", () => {
    expect(badgeLabel("solo")).toBe("solo");
  });

  it("handles empty input", () => {
    expect(badgeLabel("")).toBe("");
  });
});
