// Short-lived crumb set by /auth/callback when next=/auth/set-password.
// setNewPasswordAction requires its presence so a stolen-cookie session
// cannot pivot to password reset without going through the recovery email.
//
// Constants live in their own module (not in actions/auth.ts) because
// `"use server"` files are restricted to async exports in Next.js.
export const RECOVERY_COOKIE = "mindlap_pwreset";
export const RECOVERY_COOKIE_TTL_S = 600;
