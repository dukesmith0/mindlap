# Bugs
Next ID: 47

## Open
#46 [LOW] /profile/[username] header layout: avatar disc is misaligned vertically against the display-name + @username text block. Root cause: `.subtitle` has `margin: 0 0 40px` (globals.css ~line 142) which inflates the text block height, so the flex `align-items: center` of `.profile-header` centers the 48px avatar against a much taller stack. Fix options: (a) override subtitle margin inside `.profile-header` to 0; (b) wrap the h1 + subtitle in a div with its own line-height and let the flex align that smaller box; (c) restructure the header into a CSS grid. Files: `app/globals.css` `.profile-header` + `.profile-header h1` + `.profile-header .subtitle` (new override) + `app/profile/[username]/page.tsx` if structure changes.
#45 [MED] Themed tooltips on badges + heatmap. Profile badges currently render emoji + label only; hovering should surface a Tooltip with the criteria for each badge (e.g. streak_3 -> "play 3 days in a row", pb_first_<game> -> "set your first PB on <Game>", all_seven_today -> "submit a score on every game today"). Heatmap cells currently use `title=` (default browser tooltip styling) — convert to the same themed Tooltip primitive so hover surfaces "<date>: N play(s)" in the zetamac-pure bubble. Implementation: extend `lib/badges/icons.ts` with a `badgeCriteria(key)` function returning a one-line description; wrap each `.badge` and each `.heatmap-cell` in `<Tooltip>`. Note: 91 Tooltip instances on the heatmap may be heavy; consider a single delegated hover handler that mounts one shared bubble.
#41 [LOW] Today mini-leaderboard preview kept (reversal of original "delete" plan), but rewrites to friends-only: top-5 among me + accepted friends; if my today score isn't in the top-5, append `...` then a row with my rank + name + score; my row renders accent. Ships in commit 2 (Phase 7) since it depends on friend IDs.
#30 [MED] Pre-submit comparison view on ResultScreen. Show user's current PB, worst, 7d median, leaderboard rank for this game, plus a green `(+N)` or red `(-N)` delta indicating what would change if they submit this play. Implement as a Server Action `getPreSubmitContext(game_key, score)` returning current+projected values; render in ResultScreen above the submit button.
#26 [LOW] Profile page does 28 supabase round-trips per render (4 queries × 7 games). Acceptable for v1 traffic; collapse to one `get_public_profile_stats(user_id)` RPC in Phase 11. File: `app/profile/[username]/page.tsx:82-146`.
#14 [MED] Digit Span overflows column at length 10+ (`game-text-digit` 80px / spacing 6px in 720-128 col). Discuss before fix: clamp() vs step-fn vs chunked spacing. Must fit lengths 11-15.

## Deferred

## Resolved (2026-04-29 polish batch)
#44 [MED] Theme toggle took ~500ms to flip because change path was: click -> server action -> router.refresh() -> full re-render. Fix: optimistic client write to `<html data-theme>` via setAttribute; server action persists cookie + profile row in the background; rollback dataset + state on action failure. Files: `app/(authed)/settings/SettingsClient.tsx`.
#43 [MED] Badges rendered as identical accent dots. Fix: `lib/badges/icons.ts` maps badge_key -> single themed emoji (🔥 streak_*, 🎯 all_seven_today, game-themed icon for pb_first_*); `app/profile/[username]/page.tsx` swaps `.badge-dot` for `.badge-icon`.
#42 [MED] /profile/[username] needed a 90-day GitHub-style heatmap. Fix: `lib/heatmap.ts` (heatBucket + buildHeatmap pure helpers, vitest-tested), one `daily_aggregates` query in `app/profile/[username]/page.tsx`, 13×7 grid of 11×11 cells with 4 intensity buckets via `data-i` attribute. Profile section order is now badges -> heatmap -> per-game.
#40 [MED] /leaderboards rows had no avatar and no link. Fix: extended SELECTs to include `profiles(username, display_name, avatar_color)`; rows now render `<Link><Avatar size=22 />username</Link>` with overflow ellipsis on long usernames. File: `app/leaderboards/page.tsx`.
#39 [LOW] Core-game `*` indicator had no affordance/explanation. Fix: new `components/ui/Tooltip.tsx` (zetamac-pure 1px accent border, accent text on `--bg`, opacity-only fade-in 160ms, no transform). Wraps the `*` in `TodayCard` and the per-game card on `/profile/[username]`. Decorative by default (aria-label, no tabIndex); `focusable` opt-in for interactive use.
#38 [LOW] Profile per-game card missed total plays. Fix: lifetime `daily_aggregates.plays_submitted` sum query + new "total plays" column. File: `app/profile/[username]/page.tsx`.
#37 [MED] Per-game grid columns didn't align across games. Fix: `.profile-game-stats` is now a 6-column CSS grid (PB / set / worst / 7d median / 30d plays / total plays) with shared min/max widths so the same stat sits at the same x-offset on every game row; mobile @640px collapses to 2 columns.
#36 [LOW] Streak ribbon pulse covered the entire row. Fix: animation moved from outer `.streak-ribbon` span onto the inner 🔥 emoji span only; number + units stay steady.
#35 [LOW] Countdown 3/2/1 = 800ms each but "go" only 400ms. Fix: single `STEP_MS = 600` constant drives all four steps (0/600/1200/1800, onDone at 2400). File: `components/games/Countdown.tsx`.
#34 [LOW] /today search input was on its own row. Fix: `.today-header` flex row with baseline alignment + space-between + 24px gap; search-input width 220px; mobile collapses to column.
#33 [LOW] /settings DELETE ACCOUNT styling didn't read as destructive. Fix: `.danger-h2` (red) + `.btn-danger` (red border + red text, hover red fill, no transition).
#19 [LOW] Avatar initial floated above center (Courier Prime cap-baseline). Fix: `paddingTop: 1` on the Avatar style object; affects 22px (leaderboard) and 48px (profile header) uniformly.
#16 [LOW] /favicon.ico 404 console noise. Fix: `app/icon.svg` 32x32 with `prefers-color-scheme` media query swapping accent fill so the icon reads on both light and dark browser tabs.
#15 [MED] /settings had no back affordance. Fix: `<- today` link via existing `.nav-back` class above the h1.

## Resolved (2026-04-28)
#32 [HIGH] `process_submission` raised `column reference "best" is ambiguous` on every submit. Cause: `RETURNS TABLE(best, worst, mean, median, ...)` declares OUT params that shadow daily_aggregates columns inside the function body. Fix: 0010 changes the return type to `jsonb`; `submitScoreAction` reads the JSON object directly.
#31 [HIGH] /profile/<username> per-game stats grid garbled (labels colliding across columns). Fix: collapsed `.profile-game-grid` to single column; stats render as wrap-flex with one label/value per stat.
#29 [LOW] Verified: pins ARE retained across sessions (RLS-gated SELECT on every render). Closed by inspection.
#28 [MED] /today header had no search. Fix: `TodayHeader` + `TodayList` client island with name/key client-side filter.
#27 [LOW] Participation cap coupled to bonus mult. Fix: 0009/0010 set `v_part_cap = 5 * v_bonus_mult` (10/play, 10/day on bonus days).
#25 [MED] Sidebar Profile link never lit up on canonical `/profile/<username>`. Fix: Sidebar special-cases Profile to active on any `/profile/...`.
#24 [HIGH] `award_xp` ignored `p_multiplier`; `xp_awarded` desynced from `profiles.xp` on bonus games. Fix: 0009/0010 pre-multiply at the caller, pass `p_multiplier=1.0`. xp_events.amount and profiles.xp now agree.
#23 [LOW] Settings sidebar icon visually identical to Today's. Fix: swapped to a proper gear/cog SVG path in `components/layout/Sidebar.tsx`.
#22 [MED] No XP-gained indicator on submit. Fix: `submitScoreAction` returns `{ xpAwarded, isNewPb, best, streakCurrent }`; ResultScreen renders `+N xp` (accent) + `[new PB]` (amber) with opacity-fade animation.
#21 [MED] Sidebar visible during gameplay competed with the focal game stage. Fix: `<AppShell noSidebar>` prop on `/play/[game]`; topbar persists.
#20 [MED] Game stage not centered. Fix: `.app-main-centered` (max-w 720, margin 0 auto, padding 48 32) used when AppShell `noSidebar` is set.
#18 [LOW] No XP bar surfaced; `profiles.xp` unread. Fix: `components/ui/XpBar.tsx` in topbar; `xp` populated live by `process_submission()` -> `xp_events`.
#17 [MED] `/play/[game]` "<- today" back link looked unclickable. Fix: added `.nav-back` class with hover-color + dashed underline.
#13 [HIGH] Dev CSP missing `unsafe-eval` -> React dev bundle crashed onboarding. Fix: gate `unsafe-eval` + `ws://localhost:*` behind `NODE_ENV==="development"`. Production strict.
#12 [HIGH] N-Back leaked timeouts on unmount. Fix: collect ids in `Set<>`, `forEach(clearTimeout)` on cleanup.
#11 [HIGH] Invalid `<a><button>` across today/play/ResultScreen. Fix: `.btn-link` class for server-component nav; ResultScreen uses `router.push`.
#10 [LOW] Signup lacked confirm-password. Fix: `confirm_password` input + client+server validation.
#9 [LOW] Onboarding "let's play -&gt;" rendered literally (JSX entity inside JS string expr doesn't decode). Fix: use literal `->`.
#8 [CRITICAL] Onboarding hit `permission denied for table profiles`. Mgmt-API migration path skipped Supabase default-priv seeding. Fix: 0006 `GRANT ALL` + `ALTER DEFAULT PRIVILEGES` on public schema.
#7 [HIGH] Email-confirm 404: route lived in `app/(auth)/callback/route.ts` but `(auth)` is a route group (no URL contribution). Fix: moved to `app/auth/callback/route.ts`.
#6 [HIGH] Signup "Database error saving new user". `generate_friend_code()` scanned dropped column + missing `extensions` in search_path for pgcrypto. Fix: 0005 rebinds collision check to `profile_secrets` and adds `extensions`.
#5 [HIGH] `friend_code` on profiles publicly enumerable via PostgREST. Fix: 0004 moves to `profile_secrets` (owner-only RLS) + `find_user_by_friend_code(text)` RPC.
#4 [HIGH] Open-redirect via `next` form param. Fix: `safeNext()` validates same-origin.
#3 [HIGH] Proxy didn't redirect signed-in user without profile. Fix: missing profile -> `/onboarding`.
#2 [HIGH] Proxy `/profile/` allowlist matched `/profile/me/*` private namespaces. Fix: `isPublicPath()` excludes `/profile/me*` before allowing `/profile/<username>`.
#1 [HIGH] Proxy redirect dropped Supabase session cookies refreshed during `getUser()`. Fix: copy `response.cookies.getAll()` onto the redirect.
