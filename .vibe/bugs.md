# Bugs
Next ID: 11

## Open

## Deferred

## Resolved
#10 [LOW] Signup form had only one password field. UX risk: typo'd password locks user out, requires reset flow. Fix: added `confirm_password` field client+server validated. (manual review, resolved 2026-04-28)
#9 [LOW] Onboarding "let's play" button rendered the literal text `let's play -&gt;`. JSX entities decode in TEXT nodes, not in JS string expressions. Line 132 of `OnboardingFlow.tsx` had the entity inside a string literal. Fix: replaced with literal `->`. (manual report, resolved 2026-04-28)
#8 [CRITICAL] Onboarding submit returned `permission denied for table profiles`. Migrations 0001-0005 ran via the Management API SQL endpoint, which creates tables owned by `postgres` and bypasses Supabase's normal default-privileges seeding for anon/authenticated/service_role. Result: every public table had only inherent REFERENCES/TRIGGER/TRUNCATE — no DML grants. Every authenticated request to RLS-enabled tables hit "permission denied" before RLS could even run. Fix: 0006_restore_role_grants.sql GRANTs SELECT/INSERT/UPDATE/DELETE on all public tables + ALTER DEFAULT PRIVILEGES so future tables inherit the grants. (manual report, resolved 2026-04-28)
#7 [HIGH] Email-confirmation link 404'd. The OAuth/email-confirm route lived at `app/(auth)/callback/route.ts`, but `(auth)` is a Next.js route group (parentheses) that does NOT contribute to the URL, so the file served `/callback`, not `/auth/callback`. The proxy allowlist, `actions/auth.ts` `emailRedirectTo`, and Supabase email templates all targeted `/auth/callback`. Fix: moved the route to `app/auth/callback/route.ts` (real segment). (manual signup test, resolved 2026-04-28)
#6 [HIGH] Signup hit "Database error saving new user". `generate_friend_code()` (0002) was missed when 0004 moved `friend_code` to `profile_secrets` (collision check scanned the dropped column), and its `search_path = public` excluded `extensions` where pgcrypto's `gen_random_bytes` lives. Both manifested inside the auth.users trigger. Fix: 0005 rebinds the collision check to `profile_secrets` and sets `search_path = public, extensions`. (manual signup test, resolved 2026-04-28)
#5 [HIGH] `friend_code` on `profiles` was publicly enumerable via PostgREST. Fix: 0004 moves friend_code to `profile_secrets` (owner-only RLS) + `find_user_by_friend_code(text)` RPC. (Phase 1 security audit, resolved 2026-04-28)
#4 [HIGH] Open-redirect via `next` form param in signin/Google/callback. Fix: `safeNext()` validates same-origin (single leading slash, no protocol-relative). (Phase 1 reviewer, resolved 2026-04-28)
#3 [HIGH] `lib/supabase/proxy.ts` did not handle signed-in user with no profile (handle_new_user race/failure). Fell through to authed pages profile-less. Fix: missing profile = redirect to `/onboarding`. (Phase 1 reviewer, resolved 2026-04-28)
#2 [HIGH] Proxy `/profile/` allowlist also matched `/profile/me/*`, leaving private namespaces anonymous-readable. Fix: `isPublicPath()` excludes `/profile/me*` before allowing `/profile/<username>`. (Phase 0 reviewer, resolved 2026-04-28)
#1 [HIGH] Proxy redirect dropped Supabase session cookies refreshed during `getUser()`. Fix: copy `response.cookies.getAll()` onto the redirect before returning. (Phase 0 reviewer, resolved 2026-04-28)
