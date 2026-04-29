import { describe, expect, it } from "vitest";
import { levelFromXp, xpForLevel } from "@/components/ui/XpBar";

describe("levelFromXp", () => {
  it("returns Lv 1 at 0 xp", () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it("returns Lv 1 below 100 xp", () => {
    expect(levelFromXp(50)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
  });

  it("crosses to Lv 2 at 100 xp", () => {
    expect(levelFromXp(100)).toBe(2);
  });

  it("Lv N starts at xp = 100 * (N - 1)^2", () => {
    expect(levelFromXp(xpForLevel(2))).toBe(2);
    expect(levelFromXp(xpForLevel(5))).toBe(5);
    expect(levelFromXp(xpForLevel(10))).toBe(10);
  });

  it("clamps negative xp to Lv 1", () => {
    expect(levelFromXp(-100)).toBe(1);
  });

  it("never returns Lv 0", () => {
    expect(levelFromXp(0)).toBeGreaterThanOrEqual(1);
    expect(levelFromXp(-50)).toBeGreaterThanOrEqual(1);
  });
});

describe("xpForLevel", () => {
  it("Lv 1 starts at 0 xp", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("xp gap grows quadratically", () => {
    const g12 = xpForLevel(2) - xpForLevel(1);
    const g23 = xpForLevel(3) - xpForLevel(2);
    const g34 = xpForLevel(4) - xpForLevel(3);
    expect(g23).toBeGreaterThan(g12);
    expect(g34).toBeGreaterThan(g23);
  });

  it("clamps levels below 1 to start of Lv 1", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-3)).toBe(0);
  });
});
