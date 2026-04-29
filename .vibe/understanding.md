# mindlap
Last refresh: 2026-04-29 (commit 2 Phase 7 staged) | All 7 games playable, profile + leaderboards live, XP+badges autograded, 90-day heatmap, friends + Friends-only Today mini-leaderboard + ProfileSocialButtons + accept-requests opt-out shipped. 192 vitest passing across 20 files. typecheck/lint/build clean. Live on `dukesmith0/mindlap` -> Vercel auto-deploy.

## Stack
- Next.js 16 App Router (RSC + Server Actions, Turbopack dev) | TS strict
- Supabase Auth + Postgres + Storage + pg_cron | Resend via Supabase SMTP
- Tailwind 3 (most utilities disabled, design = pure CSS variables)
- Courier Prime via `next/font/local` (`app/fonts/`, GDPR-clean)
- Zod 3 | Vitest 4 unit, Playwright 1 e2e
- Vercel + `@vercel/speed-insights`

## Style: Zetamac Pure (locked, ref `.vibe/docs/style-reference/zetamac-pure.html`)
Tokens in `app/globals.css`:
- light: bg #fff / ink #111 / muted #666 / line #e5e5e5 / accent #0066cc
- dark: bg #0f0f0f / ink #f0f0f0 / muted #888 / line #2a2a2a / accent #5aa3ff (AA)
- font-mono: Courier Prime via `--font-mono`

Layout: 1px borders only, square corners, no shadows, no radius (avatar/dot circles excepted), no gradients. Cards: top + bottom border, no bg. Buttons: 1px accent border + accent text, hover = solid fill + white text, instant.

Animations (only):
- Streak ribbon: opacity pulse 1 -> 0.55 -> 1, 2s ease-in-out infinite
- Countdown step: opacity 0.2 -> 1, 240ms ease-out (3-2-1-Go before games)
- Result XP/PB: opacity fade-in 320ms

Emoji rule: NO emoji except 🔥 on the streak ribbon (decisions.md 2026-04-28 reversal).

In-game type scale (override body 15px): Math 56 / Digit 80 / N-Back 96 / Stroop 56 / Result 96 / Reaction 32. Mobile @640px: 40/56/72/40/72/22.

## App shell
- `components/layout/AppShell.tsx`: server component, fetches profile once, wraps with TopBar + Sidebar + main. Prop `noSidebar={true}` drops the sidebar (used on `/play/[game]` so the game stage centers via `.app-main-centered`).
- `TopBar.tsx`: logo (left) + streak ribbon + XP bar + avatar OR sign-in/up CTAs (right).
- `Sidebar.tsx`: 200px nav with `>` accent prefix on active row. Items: Today, Leaderboards, Profile (canonical /profile/<username> via /profile/me redirect), Friends (soon), Groups (soon), Settings. Inline SVG icons (only icons in the app per zetamac-pure rules).
- Mobile <=720px: sidebar collapses to top horizontal strip.

Wrapped routes: `/today`, `/leaderboards`, `/settings`, `/play/[game]`, `/profile/[username]`, `/profile/me`. Shell-less: `/login`, `/signup`, `/onboarding`, `/auth/callback`, `/auth/set-password`.

## Routes
- `/` - landing
- `/login`, `/signup` - email/pw + Google OAuth (`safeNext()` open-redirect guard)
- `/auth/callback` - OAuth + email-confirm exchange. Sets `mindlap_pwreset` crumb when `next=/auth/set-password`.
- `/auth/set-password` - reset flow (gated by recovery cookie)
- `/onboarding` - username + theme picker; required before authed pages. Consumes `mindlap_friend_code` cookie one-shot to auto-create pending friendship.
- `/today` - 7 game cards with pinned > 2x > core > rest order, friends-only top-5 mini-leaderboard (with `...` + self overflow row when applicable), click-to-pin, [2x xp] pill, search input filtering by name/key, NOT YET PLAYED filler when card hasn't been played today
- `/play/[game]` - GameShell for one of the 7 games
- `/leaderboards` - Today/7d/All-time × 7 game tabs × [global / friends] scope toggle; anonymous-readable; empty-state CTAs link to /friends when scope=friends and user has no friends
- `/friends` - Incoming / Outgoing / Active sections; AddFriendForm with @username OR friend-code dual-input; FriendRow with state-aware actions (accept/decline, cancel, remove)
- `/f/[code]` - public deep-link landing; anon stashes code in `mindlap_friend_code` cookie + redirects to /signup; authed sends request and redirects to /friends
- `/profile/[username]` - public profile (sparse for `is_public=false`); header > ProfileSocialButtons (state-aware add / cancel / accept+decline / remove / opt-out filler) > badges (per-key emoji) > 90-day heatmap > per-game grid (PB / set / worst / 7d median / 30d plays / total plays)
- `/profile/me` - redirects to canonical /profile/<username>
- `/settings` - Profile / Preferences / Account (public-profile + accept-friend-requests toggles) / Password / Delete sections; theme toggle is optimistic (instant `<html data-theme>` swap with rollback on action failure)

## Games (all 7 shipped)
Pure logic in `lib/games/<key>/index.ts`, parity tests in `debug/games/<key>.test.ts`, React UIs in `components/games/<Key>Game.tsx`. Canonical metadata in `lib/games/registry.ts` (`GAME_KEYS`, `GAMES`, `isGameKey`).

| Key | Game | Direction | Score | Source ref |
|---|---|---|---|---|
| math | Speed Math | higher | problems in 60s, Enter = -3s skip | mindgames math.js |
| digit | Digit Span | higher | last completed length 3..15, display = 2000+(L-3)*500ms | digit.js |
| nback | N-Back (2-back) | higher | accuracy % over 20 scorable trials, 1000ms letter + 1500ms blank | nback.js |
| stroop | Stroop | higher | correct in 30s, no back-to-back identical (word, ink) | stroop.js |
| reaction | Reaction | lower | avg ms over 5 trials, [2000, 5000]ms delay | reaction.js |
| mine | Minesweeper | lower | 10x10, 15 mines, first-click-safe, score = seconds (rounded, min 1) | minesweeper.js |
| word | Word Recall | higher | memorize 10 of 115 for 20s, recall (case-insensitive, deduped, 0-10) | word.js |

Shared:
- `Countdown.tsx` 3-2-1-Go before every game (only animation besides streak)
- `GameShell.tsx` phase machine: ready -> countdown -> playing -> result; `runId` re-mount on retry resets all refs
- `ResultScreen.tsx` Enter=submit (autofocused) / R=retry / N=next core game (cycles via modulo). Renders `+N xp` (accent) and `[new PB]` (amber) on submit.

## Server actions (`actions/*.ts`, all `import "server-only"`)
- `actions/auth.ts`: `signUpAction` (Zod, anti-enumeration, confirm-pw), `signInAction`, `signInWithGoogleAction`, `requestPasswordResetAction` (always-ok, redirects to `/auth/set-password`), `setNewPasswordAction` (gated by `mindlap_pwreset` cookie), `changePasswordAction` (verifies current password via stateless side `@supabase/supabase-js` client; live SSR session not rotated), `signOutAction` (scope:'global').
- `actions/profile.ts`: `setThemeAction`, `setAvatarColorAction`, `changeUsernameAction` (30-day rate limit), `updateProfileBasicsAction`, `setProfilePrivacyAction`, `setSkipTutorialsAction`, `setAcceptsFriendRequestsAction`, `completeOnboardingAction` (consumes `mindlap_friend_code` cookie one-shot for auto-friend-add), `deleteAccountAction` (admin DELETE auth.users, FK cascade).
- `actions/friendships.ts`: `addFriendAction` (Zod refine on code XOR username, rate-limited via `lib/rate-limit.ts`, target opt-out check, accepts inbound on race), `acceptFriendAction`, `declineFriendAction`, `cancelFriendRequestAction`, `removeFriendAction`.
- `actions/submission.ts`: `submitScoreAction` (Zod int score, calls `process_submission(game_key, score, is_bonus_game)` RPC, returns `{ xpAwarded, isNewPb, best, streakCurrent }`), `togglePinAction` (idempotent on 23505).

## Database (12 migrations applied live on `nookxuvlvwtppitqguxf`)
- `0001_init.sql` 16 tables, base CHECK constraints, `touch_updated_at` trigger.
- `0002_handle_new_user.sql` `generate_friend_code`, `generate_username_from_email`, `handle_new_user`, `touch_last_signin` (later wired in 0004).
- `0003_rls_policies.sql` privacy-aware SELECT on submissions/daily_aggregates, group_members column-shadowing fix, public-read whitelist.
- `0004_friend_code_privacy.sql` moves friend_code to `profile_secrets` (owner-only RLS) + `find_user_by_friend_code` + `regenerate_friend_code` RPCs.
- `0005_fix_friend_code_lookup.sql` rebinds collision check to `profile_secrets`, adds `extensions` to search_path.
- `0006_restore_role_grants.sql` GRANT all + ALTER DEFAULT PRIVILEGES (Mgmt-API path skipped Supabase default-priv seeding; every authed call hit "permission denied for table profiles" until this).
- `0007_process_submission.sql` original 2-arg PG fn (superseded).
- `0008_xp_and_badges.sql` `award_xp` + `eval_badges` helpers (internal, no GRANT) + extended `process_submission(game_key, score, is_bonus_game)`.
- `0009_fix_xp_multiplier_flow.sql` pre-multiplies XP at caller (`p_multiplier=1.0`); cap scales with bonus mult (5/play, 5/day normal vs 10/play, 10/day on bonus).
- `0010_process_submission_jsonb.sql` switches return to `RETURNS jsonb` to dodge OUT-param shadowing of table column names ("column reference 'best' is ambiguous").
- `0011_friend_by_username.sql` `find_user_by_username(text) -> uuid` (SECURITY DEFINER, granted authenticated). Mirrors `find_user_by_friend_code` shape; citext makes lookup case-insensitive.
- `0012_accepts_friend_requests.sql` adds `profiles.accepts_friend_requests boolean default true`. addFriendAction reads it before inserting; ProfileSocialButtons swaps the add button for an opt-out filler when target has disabled.

Active surface:
- `process_submission(text, numeric, boolean) -> jsonb` (only writer to submissions and daily_aggregates; runs streak update, XP awards via `award_xp`, badge eval via `eval_badges`).
- `find_user_by_friend_code(text) -> uuid` (SECURITY DEFINER, granted authenticated)
- `find_user_by_username(text) -> uuid` (SECURITY DEFINER, granted authenticated)
- `regenerate_friend_code() -> char(8)` (SECURITY DEFINER, granted authenticated)

Tables: profiles, profile_secrets, user_game_pins, daily_bonus, games (seeded), submissions, daily_aggregates, ratings, mind_elo, friendships, groups, group_members, group_invites, badges (seeded), user_badges, xp_events.

## Privacy
- `profiles.is_public` (default true). False = sparse `/profile/<username>`. Submissions of private users are RLS-hidden from anonymous + non-friend SELECTs (decisions.md 2026-04-28 reconciled with the original "username still on leaderboards" plan: private = also private leaderboard presence in v1).
- `profile_secrets` (friend_code) owner-only.
- HTTP security headers (CSP, HSTS, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP=same-origin) in `next.config.ts`. CSP `unsafe-eval` + `ws://localhost:*` ONLY when `NODE_ENV === "development"`. Prod strict.

## Patterns
- Server Components default; `"use client"` only for game UIs and interactive widgets.
- Server Actions for mutations, Zod-validated. Anti-enumeration on signup/reset.
- Pure logic in `lib/`, vitest-tested. UI shells in `components/`.
- PT-anchored dates via `lib/pt-date.ts` (`Intl.DateTimeFormat en-CA America/Los_Angeles`); server-locale-safe.
- Daily-bonus rotation: deterministic FNV-1a hash of PT date string -> 2 of 7 game keys (`lib/daily-bonus.ts`), no DB persistence (closes R3).
- XP rules in `lib/xp.ts` (JS mirror of 0008/0009/0010 SQL): participation 5/play capped 5/(user, game, PT date), PB bonus 25 × streak_mult × bonus_mult, streak_mult `min(2.5, 1 + 0.1*(streak-1))`, bonus_mult 2x on the day's daily-bonus pair, both cap and per-play double on bonus days.
- Recovery flow uses one-shot `mindlap_pwreset` cookie (5min TTL) set by `/auth/callback?next=/auth/set-password` to gate `setNewPasswordAction`. `changePasswordAction` verifies current pw via stateless side client to avoid rotating the live SSR session.

## Tests (20 files, 192 cases passing)
| File | Cases |
|---|---|
| debug/auth/{username,friend-code,avatar-palette,theme}.test.ts | 25 |
| debug/games/{math,digit,nback,stroop,reaction,mine,word}.test.ts | 67 |
| debug/games/edge-cases.test.ts | 39 |
| debug/daily-bonus.test.ts | 5 |
| debug/pt-date.test.ts | 7 |
| debug/xp-bar.test.ts | 11 |
| debug/xp.test.ts | 18 |
| debug/badge-icons.test.ts | 6 |
| debug/heatmap.test.ts | 11 |
| debug/countdown.test.ts | 4 |
| debug/friend-code-cookie.test.ts | 6 |

Run: `npm test` (vitest) | `npm run test:e2e` (Playwright, no specs yet) | `npm run typecheck` | `npm run lint` | `npm run build`.

## Docs index
- `.vibe/docs/style-reference/zetamac-pure.html` - locked visual reference (open in browser)
- `.vibe/docs/style-reference/zetamac-pure.md` - notes on what to lift verbatim vs swap
- `.vibe/docs/mindgames/` - read-only copy of the source mindgames `.vibe/`

## Reference repos
- Source: `C:\Users\craigs\OneDrive\Desktop\Projects\mindgames` (private). GitHub: `dukesmith0/mindgames`.
- This repo: `dukesmith0/mindlap` (public). Vercel project `mindlap`. Supabase project `nookxuvlvwtppitqguxf`.
