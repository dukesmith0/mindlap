# Bugs
Next ID: 6

## Open

## Deferred

## Resolved
#5 [HIGH] friend_code on `profiles` was publicly enumerable via PostgREST `?select=friend_code`. Defeats the friend-code-as-private-handle premise. Fix: migration 0004 moves friend_code to `profile_secrets` (owner-only RLS) + adds `find_user_by_friend_code(text)` RPC for lookups. (found 2026-04-28 by Phase 1 security audit, resolved same day)
#3 [HIGH] `lib/supabase/proxy.ts` did not handle the case where a signed-in user has no profile row (handle_new_user race or failure). Fell through to authed pages with profile-less session. Fix: treat missing profile as `not onboarded` and redirect to `/onboarding`. (found 2026-04-28 Phase 1 reviewer, resolved same day)
#4 [HIGH] Open-redirect via `next` form param in `signInAction`, `signInWithGoogleAction`, and the OAuth callback route. Attacker could redirect users off-site after sign-in. Fix: `safeNext()` helper validates same-origin (single leading slash, no protocol-relative). (found 2026-04-28 Phase 1 reviewer, resolved same day)
#1 [HIGH] `lib/supabase/proxy.ts` redirect path lost Supabase session cookies refreshed by `getUser()`. Fix: copy cookies from the post-`getUser` `response` onto the `NextResponse.redirect()` before returning. (found 2026-04-28 by Phase 0 reviewer, resolved 2026-04-28)
#2 [HIGH] `lib/supabase/proxy.ts` PUBLIC_PREFIXES `/profile/` allowlisted `/profile/me/*` for anonymous access, contradicting the public-read policy. Fix: replaced flat prefix list with `isPublicPath()` function that explicitly excludes `/profile/me` and `/profile/me/*` before allowing `/profile/<username>`. (found 2026-04-28 by Phase 0 reviewer, resolved 2026-04-28)
