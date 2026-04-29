import { describe, expect, it } from "vitest";
import {
  FRIEND_CODE_COOKIE,
  FRIEND_CODE_COOKIE_TTL_S,
  isValidFriendCode,
} from "@/lib/auth/friend-code-cookie";

describe("FRIEND_CODE_COOKIE", () => {
  it("uses a stable cookie name and 30-day TTL", () => {
    expect(FRIEND_CODE_COOKIE).toBe("mindlap_friend_code");
    expect(FRIEND_CODE_COOKIE_TTL_S).toBe(60 * 60 * 24 * 30);
  });
});

describe("isValidFriendCode", () => {
  it("accepts the Crockford-ish 8-char alphabet", () => {
    expect(isValidFriendCode("ABCDEFGH")).toBe(true);
    expect(isValidFriendCode("23456789")).toBe(true);
    expect(isValidFriendCode("AB23CD45")).toBe(true);
    expect(isValidFriendCode("ZNPQRSTV")).toBe(true);
  });

  it("rejects forbidden ambiguous characters (0, O, 1, I, L)", () => {
    expect(isValidFriendCode("0BCDEFGH")).toBe(false);
    expect(isValidFriendCode("OBCDEFGH")).toBe(false);
    expect(isValidFriendCode("1BCDEFGH")).toBe(false);
    expect(isValidFriendCode("IBCDEFGH")).toBe(false);
    expect(isValidFriendCode("LBCDEFGH")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidFriendCode("ABCDEFG")).toBe(false);
    expect(isValidFriendCode("ABCDEFGHI")).toBe(false);
    expect(isValidFriendCode("")).toBe(false);
  });

  it("rejects lowercase (codes are uppercase only)", () => {
    expect(isValidFriendCode("abcdefgh")).toBe(false);
    expect(isValidFriendCode("AbcDefGh")).toBe(false);
  });

  it("rejects non-alphanumeric characters", () => {
    expect(isValidFriendCode("ABCDEFG-")).toBe(false);
    expect(isValidFriendCode("ABCD EFG")).toBe(false);
    expect(isValidFriendCode("ABCDEFG!")).toBe(false);
  });
});
