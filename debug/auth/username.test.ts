import { describe, expect, it } from "vitest";
import { validateUsername } from "@/lib/auth/username";

describe("validateUsername", () => {
  it("accepts a normal username", () => {
    const r = validateUsername("craigsmith");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("craigsmith");
  });

  it("normalizes case + trims whitespace", () => {
    const r = validateUsername("  CraigSmith  ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("craigsmith");
  });

  it("allows underscores and hyphens", () => {
    expect(validateUsername("craig_smith").ok).toBe(true);
    expect(validateUsername("craig-smith").ok).toBe(true);
    expect(validateUsername("c-r_a-i_g").ok).toBe(true);
  });

  it("rejects too short (<3) and too long (>24)", () => {
    expect(validateUsername("ab").ok).toBe(false);
    expect(validateUsername("a".repeat(25)).ok).toBe(false);
  });

  it("rejects empty / whitespace-only", () => {
    expect(validateUsername("").ok).toBe(false);
    expect(validateUsername("   ").ok).toBe(false);
  });

  it("rejects disallowed characters", () => {
    expect(validateUsername("craig.smith").ok).toBe(false);
    expect(validateUsername("craig smith").ok).toBe(false);
    expect(validateUsername("craig@smith").ok).toBe(false);
    expect(validateUsername("crăig").ok).toBe(false);
  });

  it("rejects reserved names regardless of case", () => {
    expect(validateUsername("admin").ok).toBe(false);
    expect(validateUsername("ADMIN").ok).toBe(false);
    expect(validateUsername("settings").ok).toBe(false);
    expect(validateUsername("mindlap").ok).toBe(false);
    expect(validateUsername("api").ok).toBe(false);
  });

  it("rejects profanity substrings", () => {
    expect(validateUsername("ifuckup").ok).toBe(false);
    expect(validateUsername("noshit").ok).toBe(false);
  });

  it("accepts borderline acceptable usernames", () => {
    expect(validateUsername("user123").ok).toBe(true);
    expect(validateUsername("123user").ok).toBe(true);
    expect(validateUsername("___").ok).toBe(true);
  });
});
