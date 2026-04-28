// Friend codes are 8 chars from a Crockford-ish alphabet that excludes
// ambiguous characters (0/O/1/I/L). Generation happens server-side in the
// `generate_friend_code()` Postgres function; this module only validates.

// Crockford-ish: A-Z minus I, L, O; digits 2-9 (no 0 or 1).
const FRIEND_CODE_PATTERN = /^[A-HJKMNP-Z2-9]{8}$/;

export function isValidFriendCode(raw: string): boolean {
  return FRIEND_CODE_PATTERN.test(raw);
}

// Normalizes user-input codes (uppercase, trim, drop spaces/hyphens).
export function normalizeFriendCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}
