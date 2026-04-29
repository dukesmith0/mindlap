# Bugs
Next ID: 33

## Open
#30 [MED] Pre-submit comparison view on ResultScreen. Show user's current PB, worst, 7d median, leaderboard rank for this game, plus a green `(+N)` or red `(-N)` delta indicating what would change if they submit this play. Implement as a Server Action `getPreSubmitContext(game_key, score)` returning current+projected values; render in ResultScreen above the submit button.
#26 [LOW] Profile page does 28 supabase round-trips per render (4 queries × 7 games). Acceptable for v1 traffic; collapse to one `get_public_profile_stats(user_id)` RPC in Phase 11. File: `app/profile/[username]/page.tsx:82-146`.
#19 [LOW] Avatar initial floats above center (Courier Prime cap-baseline). `components/ui/Avatar.tsx:9-30`. Fix: padding-top 1px or SVG `dominant-baseline=central`.
#16 [LOW] `/favicon.ico` 404 console noise. Fix: ship `app/icon.png` or `app/favicon.ico`.
#15 [MED] `/settings` has no back affordance. Fix: back-link or topbar/sidebar nav.
#14 [MED] Digit Span overflows column at length 10+ (`game-text-digit` 80px / spacing 6px in 720-128 col). Discuss before fix: clamp() vs step-fn vs chunked spacing. Must fit lengths 11-15.

## Deferred

## Resolved (2026-04-28)
#32 [HIGH] `process_submission` raised `column reference "best" is ambiguous` on every submit. Cause: `RETURNS TABLE(best, worst, mean, median, ...)` declares OUT params that shadow the daily_aggregates columns inside the function body. Fix: 0010 changes the return type to `jsonb` (no OUT params, no namespace collision); `submitScoreAction` reads the JSON object directly.
#31 [HIGH] /profile/[username] per-game stats grid garbled. Fix: collapsed `.profile-game-grid` to single column; stats render as wrap-flex with one label/value per stat.
#29 [LOW] Verified: pins ARE retained across sessions (RLS-gated SELECT on every render). Closed by inspection.
#28 [MED] /today header had no search. Fix: `TodayHeader` + `TodayList` client island with name/key client-side filter.
#27 [LOW] Participation cap coupled to bonus mult. Fix: 0009/0010 set `v_part_cap = 5 * v_bonus_mult` (10/play, 10/day on bonus days).
#25 [MED] Sidebar Profile link never lit up on canonical `/profile/<username>`. Fix: Sidebar special-cases Profile to active on any `/profile/...`.
#24 [HIGH] `award_xp` ignored `p_multiplier`; `xp_awarded` desynced from `profiles.xp` on bonus games. Fix: 0009/0010 pre-multiply at the caller, pass `p_multiplier=1.0`. xp_events.amount and profiles.xp now agree.
#23 [LOW] Settings sidebar icon visually identical to Today's. Fix: swapped to a proper gear/cog SVG path in `components/layout/Sidebar.tsx`.
#22 [MED] No XP-gained indicator on submit. Fix: `submitScoreAction` now returns `{ xpAwarded, isNewPb, best, streakCurrent }`; `ResultScreen` renders `+N xp` (accent) + `[new PB]` (amber) with opacity-fade animation per zetamac-pure rules.
#21 [MED] Sidebar visible during gameplay competed with the focal game stage. Fix: `<AppShell noSidebar>` prop on `/play/[game]`; topbar persists.
#20 [MED] Game stage not centered. Fix: `.app-main-centered` (max-w 720, margin 0 auto, padding 48 32) used when AppShell `noSidebar` is set.
#18 [LOW] No XP bar surfaced; `profiles.xp` unread. Fix: shipped `components/ui/XpBar.tsx` in topbar (Phase 4). `xp` now populated live by `process_submission()` -> `xp_events` (Phase 6).
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
