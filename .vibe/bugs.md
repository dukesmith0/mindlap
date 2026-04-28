# Bugs
Next ID: 8

## Open

## Deferred

## Resolved
#7 [HIGH] Email-confirmation link 404'd. The OAuth/email-confirm route lived at `app/(auth)/callback/route.ts`, but `(auth)` is a Next.js route group (parentheses) that does NOT contribute to the URL, so the file served `/callback`, not `/auth/callback`. The proxy allowlist, `actions/auth.ts` `emailRedirectTo`, and Supabase email templates all targeted `/auth/callback`. Fix: moved the route to `app/auth/callback/route.ts` (real segment). (manual signup test, resolved 2026-04-28)
#6 [HIGH] Signup hit "Database error saving new user". `generate_friend_code()` (0002) was missed when 0004 moved `friend_code` to `profile_secrets` (collision check scanned the dropped column), and its `search_path = public` excluded `extensions` where pgcrypto's `gen_random_bytes` lives. Both manifested inside the auth.users trigger. Fix: 0005 rebinds the collision check to `profile_secrets` and sets `search_path = public, extensions`. (manual signup test, resolved 2026-04-28)
#5 [HIGH] `friend_code` on `profiles` was publicly enumerable via PostgREST. Fix: 0004 moves friend_code to `profile_secrets` (owner-only RLS) + `find_user_by_friend_code(text)` RPC. (Phase 1 security audit, resolved 2026-04-28)
#4 [HIGH] Open-redirect via `next` form param in signin/Google/callback. Fix: `safeNext()` validates same-origin (single leading slash, no protocol-relative). (Phase 1 reviewer, resolved 2026-04-28)
#3 [HIGH] `lib/supabase/proxy.ts` did not handle signed-in user with no profile (handle_new_user race/failure). Fell through to authed pages profile-less. Fix: missing profile = redirect to `/onboarding`. (Phase 1 reviewer, resolved 2026-04-28)
#2 [HIGH] Proxy `/profile/` allowlist also matched `/profile/me/*`, leaving private namespaces anonymous-readable. Fix: `isPublicPath()` excludes `/profile/me*` before allowing `/profile/<username>`. (Phase 0 reviewer, resolved 2026-04-28)
#1 [HIGH] Proxy redirect dropped Supabase session cookies refreshed during `getUser()`. Fix: copy `response.cookies.getAll()` onto the redirect before returning. (Phase 0 reviewer, resolved 2026-04-28)
