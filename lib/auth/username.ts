// Username validation matches the CHECK constraint on profiles.username:
//   username ~ '^[a-z0-9_-]{3,24}$'
// Case-insensitive uniqueness comes from `citext`. Profanity + reserved checks
// happen before insert.

const USERNAME_PATTERN = /^[a-z0-9_-]{3,24}$/;

const RESERVED = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "callback",
  "dashboard",
  "delete",
  "explore",
  "feedback",
  "groups",
  "help",
  "leaderboards",
  "leaderboard",
  "login",
  "logout",
  "me",
  "mindlap",
  "play",
  "privacy",
  "profile",
  "root",
  "settings",
  "signup",
  "signin",
  "support",
  "system",
  "terms",
  "today",
  "user",
  "users",
]);

// Conservative wordlist of substrings that disqualify a username outright.
// This is a starter list. Production should swap in `naughty-words-js` per
// decisions.md; not blocking for v1 launch.
const PROFANITY_SUBSTRINGS = [
  "fuck",
  "shit",
  "cunt",
  "nigger",
  "faggot",
  "retard",
  "rape",
];

export type UsernameValidation =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export function validateUsername(raw: string): UsernameValidation {
  const value = raw.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(value)) {
    return {
      ok: false,
      reason: "Username must be 3-24 chars; only lowercase letters, digits, _, -.",
    };
  }
  if (RESERVED.has(value)) {
    return { ok: false, reason: "That username is reserved." };
  }
  for (const word of PROFANITY_SUBSTRINGS) {
    if (value.includes(word)) {
      return { ok: false, reason: "That username isn't allowed." };
    }
  }
  return { ok: true, value };
}
