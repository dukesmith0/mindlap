import { describe, expect, it } from "vitest";
import { isValidFriendCode, normalizeFriendCode } from "@/lib/auth/friend-code";

describe("friend-code", () => {
  it("accepts an 8-char Crockford-ish code", () => {
    expect(isValidFriendCode("ABCDEFGH")).toBe(true);
    expect(isValidFriendCode("23456789")).toBe(true);
    expect(isValidFriendCode("AB23CD45")).toBe(true);
  });

  it("rejects ambiguous characters 0/O/1/I/L", () => {
    expect(isValidFriendCode("0BCDEFGH")).toBe(false);
    expect(isValidFriendCode("OBCDEFGH")).toBe(false);
    expect(isValidFriendCode("1BCDEFGH")).toBe(false);
    expect(isValidFriendCode("IBCDEFGH")).toBe(false);
    expect(isValidFriendCode("LBCDEFGH")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidFriendCode("ABC")).toBe(false);
    expect(isValidFriendCode("ABCDEFGHI")).toBe(false);
    expect(isValidFriendCode("")).toBe(false);
  });

  it("rejects lowercase", () => {
    expect(isValidFriendCode("abcdefgh")).toBe(false);
  });

  it("normalizes user input (uppercase + strip whitespace/hyphen)", () => {
    expect(normalizeFriendCode("abcd-efgh")).toBe("ABCDEFGH");
    expect(normalizeFriendCode("  ab cd ef gh  ")).toBe("ABCDEFGH");
    expect(normalizeFriendCode("ABCD-EFGH")).toBe("ABCDEFGH");
  });
});
