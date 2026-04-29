import { describe, expect, it } from "vitest";
import { trimAvatarEmoji, validateAvatarEmoji } from "@/lib/auth/avatar-emoji";

describe("trimAvatarEmoji", () => {
  it("trims surrounding whitespace", () => {
    expect(trimAvatarEmoji("  🧠  ")).toBe("🧠");
  });
  it("normalizes to NFC", () => {
    // Combining diaeresis vs precomposed; both should NFC to the same string.
    expect(trimAvatarEmoji("é")).toBe("é");
  });
});

describe("validateAvatarEmoji", () => {
  it("accepts a single emoji", () => {
    const r = validateAvatarEmoji("🧠");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("🧠");
  });

  it("accepts a single ASCII letter", () => {
    const r = validateAvatarEmoji("A");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("A");
  });

  it("accepts an emoji with skin-tone modifier as one grapheme", () => {
    // Thumbs up + medium skin tone = single grapheme cluster.
    const value = "\u{1F44D}\u{1F3FD}";
    const r = validateAvatarEmoji(value);
    expect(r.ok).toBe(true);
  });

  it("accepts a ZWJ family sequence as one grapheme", () => {
    // family: woman + ZWJ + woman + ZWJ + girl
    const value = "\u{1F469}‍\u{1F469}‍\u{1F467}";
    const r = validateAvatarEmoji(value);
    expect(r.ok).toBe(true);
  });

  it("rejects empty input", () => {
    const r = validateAvatarEmoji("   ");
    expect(r.ok).toBe(false);
  });

  it("rejects two distinct graphemes", () => {
    const r = validateAvatarEmoji("AB");
    expect(r.ok).toBe(false);
  });

  it("rejects two distinct emojis", () => {
    const r = validateAvatarEmoji("🧠🔢");
    expect(r.ok).toBe(false);
  });

  it("rejects strings longer than 32 chars", () => {
    const r = validateAvatarEmoji("A".repeat(33));
    expect(r.ok).toBe(false);
  });
});
