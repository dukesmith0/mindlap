// Friend-code stash cookie. Set by /f/[code] when an anon visitor lands the
// deep-link, then consumed once by completeOnboardingAction so the new user's
// first session auto-creates a pending friendship to the link's owner.
//
// Constants live in their own module (not in an action file) because
// "use server" files are restricted to async exports in Next.js. Same shape
// as recovery-cookie.ts.

export const FRIEND_CODE_COOKIE = "mindlap_friend_code";
export const FRIEND_CODE_COOKIE_TTL_S = 60 * 60 * 24 * 30; // 30 days

const FRIEND_CODE_RE = /^[A-HJKMNP-Z2-9]{8}$/;

export function isValidFriendCode(value: string): boolean {
  return FRIEND_CODE_RE.test(value);
}
