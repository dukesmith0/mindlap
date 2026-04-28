import { describe, expect, it } from "vitest";
import {
  AVATAR_PALETTE,
  DEFAULT_AVATAR_COLOR,
  avatarInitial,
  isValidAvatarColor,
} from "@/lib/auth/avatar-palette";

describe("avatar-palette", () => {
  it("has exactly 20 colors", () => {
    expect(AVATAR_PALETTE).toHaveLength(20);
  });

  it("all entries are unique 7-char hex codes", () => {
    const set = new Set(AVATAR_PALETTE);
    expect(set.size).toBe(AVATAR_PALETTE.length);
    for (const c of AVATAR_PALETTE) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("default color is in the palette", () => {
    expect(isValidAvatarColor(DEFAULT_AVATAR_COLOR)).toBe(true);
  });

  it("rejects colors outside the palette", () => {
    expect(isValidAvatarColor("#000000")).toBe(false);
    expect(isValidAvatarColor("#ffffff")).toBe(false);
    expect(isValidAvatarColor("not-a-hex")).toBe(false);
    expect(isValidAvatarColor("")).toBe(false);
  });
});

describe("avatarInitial", () => {
  it("uppercases the first letter", () => {
    expect(avatarInitial("craig")).toBe("C");
    expect(avatarInitial("Craig")).toBe("C");
  });

  it("falls back to ? for empty/null/whitespace", () => {
    expect(avatarInitial("")).toBe("?");
    expect(avatarInitial(null)).toBe("?");
    expect(avatarInitial(undefined)).toBe("?");
    expect(avatarInitial("   ")).toBe("?");
  });

  it("handles unicode", () => {
    expect(avatarInitial("éclair")).toBe("É");
  });
});
