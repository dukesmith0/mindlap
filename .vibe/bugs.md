# Bugs
Next ID: 20

## Open
#19 [LOW] Avatar initial floats above center (Courier Prime cap-baseline). `components/ui/Avatar.tsx:9-30`. Fix: padding-top 1px or SVG `dominant-baseline=central`.
#16 [LOW] `/favicon.ico` 404 console noise. Fix: ship `app/icon.png` or `app/favicon.ico`.
#15 [MED] `/settings` has no back affordance. Fix: back-link or topbar/sidebar nav.
#14 [MED] Digit Span overflows column at length 10+ (`game-text-digit` 80px / spacing 6px in 720-128 col). Discuss before fix: clamp() vs step-fn vs chunked spacing. Must fit lengths 11-15.

## Deferred

## Resolved (2026-04-28)
#18 [LOW] No XP bar surfaced; `profiles.xp` unread. Fix: shipped `components/ui/XpBar.tsx` in topbar (Phase 4). `xp` populated by Phase 6 via `process_submission()` + `xp_events`; bar displays whatever `profiles.xp` holds today.
#17 [MED] `/play/[game]` "<- today" back link looked unclickable. Fix: added `.nav-back` class with hover-color + dashed underline.
#13 [HIGH] Dev CSP missing `unsafe-eval` -> React dev bundle crashed onboarding (chained "Failed to fetch" on Server Action). Fix: gate `unsafe-eval` + `ws://localhost:*` behind `NODE_ENV==="development"` in `next.config.ts`. Production strict.
#12 [HIGH] N-Back leaked timeouts on unmount (`void` instead of cleanup). Fix: collect ids in `Set<>`, `forEach(clearTimeout)` on cleanup.
#11 [HIGH] Invalid `<a><button>` across today/play/ResultScreen. Fix: `.btn-link` class for server-component nav; ResultScreen uses `router.push`.
#10 [LOW] Signup lacked confirm-password. Fix: `confirm_password` input + client+server validation.
#9 [LOW] Onboarding "let's play -&gt;" rendered literally (JSX entity inside JS string expr doesn't decode). Fix: use literal `->`.
#8 [CRITICAL] Onboarding hit `permission denied for table profiles`. Mgmt-API migration path skipped Supabase default-priv seeding so anon/auth/service had no DML on public.*. Fix: 0006 `GRANT ALL` + `ALTER DEFAULT PRIVILEGES` on public schema.
#7 [HIGH] Email-confirm 404: route lived in `app/(auth)/callback/route.ts` but `(auth)` is a route group (no URL contribution) so it served `/callback`. Fix: moved to `app/auth/callback/route.ts`.
#6 [HIGH] Signup "Database error saving new user". `generate_friend_code()` scanned dropped column + missing `extensions` in search_path for pgcrypto. Fix: 0005 rebinds collision check to `profile_secrets` and adds `extensions`.
#5 [HIGH] `friend_code` on profiles publicly enumerable via PostgREST. Fix: 0004 moves to `profile_secrets` (owner-only RLS) + `find_user_by_friend_code(text)` RPC.
#4 [HIGH] Open-redirect via `next` form param in signin/Google/callback. Fix: `safeNext()` validates same-origin (single leading `/`, no protocol-relative).
#3 [HIGH] Proxy didn't redirect signed-in user without profile (handle_new_user race/failure). Fix: missing profile -> `/onboarding`.
#2 [HIGH] Proxy `/profile/` allowlist matched `/profile/me/*` private namespaces. Fix: `isPublicPath()` excludes `/profile/me*` before allowing `/profile/<username>`.
#1 [HIGH] Proxy redirect dropped Supabase session cookies refreshed during `getUser()`. Fix: copy `response.cookies.getAll()` onto the redirect.
