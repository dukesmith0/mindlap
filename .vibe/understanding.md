# mindlap

Last refresh: 2026-04-30 (commit 6 staged) | All 7 games playable, full social graph (friends/leaderboards), avatar identity editor, design-system primitives (Toast/Modal/EmptyState/ConfirmDialog/FormField/DelegatedTooltips), Phase 7.5/7.6/7.7/8 newcomer + trust + polish features all shipped. 13 migrations live. 210 vitest passing across 23 files. typecheck/lint/build clean. `dukesmith0/mindlap` (public) → Vercel auto-deploy.

## Stack
- Next.js 16 App Router (RSC + Server Actions, Turbopack dev) | TS strict
- Supabase Auth + Postgres + Storage + pg_cron | Resend via Supabase SMTP
- Tailwind 3 (most utilities disabled, design = pure CSS variables)
- Courier Prime via `next/font/local`
- Zod 3 | Vitest 4 unit, Playwright 1 (no specs yet)
- Vercel + `@vercel/speed-insights`

## Style: Zetamac Pure (locked, ref `.vibe/docs/style-reference/zetamac-pure.html`)

Tokens in `app/globals.css`:
- light: bg #fff / ink #111 / muted #666 / line #e5e5e5 / accent #0066cc
- dark: bg #1e242b / ink #f0f0f0 / muted #9aa0a6 / line #353c44 / accent #5aa3ff (VS Code-ish)

Layout: 1px borders only, square corners, no shadows, no transforms, no gradients. Cards: top + bottom border, no bg. Buttons: 1px accent border + accent text, hover = solid fill + white text, instant.

Animations (only): streak ribbon pulse 2s; countdown step 240ms; result XP/PB fade 320ms; toast/modal opacity fade 160-200ms.

Emoji exceptions: streak 🔥, per-key badge emoji, user-chosen avatar glyph (single grapheme via AvatarEditor), milestone banner icons.

In-game type scale: Math 56 / Digit 80 (steps to 36 at length 18) / N-Back 96 / Stroop 56 / Result 96 / Reaction 32. Mobile @640px scaled down ~30%.

## App shell
- `components/layout/AppShell.tsx`: server component, fetches profile once, wraps with `<ToastProvider>` + TopBar + Sidebar + main + `<DelegatedTooltips>`. `noSidebar={true}` drops sidebar (used on `/play/[game]`).
- `TopBar.tsx`: logo (left) + streak ribbon + XP bar + avatar `<Link>` to own profile (NOT editor — editing on profile header + /settings).
- `Sidebar.tsx`: 200px nav with `>` accent prefix on active. Items: Today, Leaderboards, Profile, Friends, Groups (soon), Settings.
- Mobile ≤720px: sidebar collapses to top strip.

Wrapped routes: `/today`, `/leaderboards`, `/settings`, `/play/[game]`, `/profile/[username]`, `/profile/me`, `/friends`. Shell-less: `/login`, `/signup`, `/onboarding`, `/auth/callback`, `/auth/set-password`, `/f/[code]`.

## Routes
- `/` — landing
- `/login`, `/signup` — email/pw + Google OAuth (`safeNext()` open-redirect guard)
- `/auth/callback` — OAuth + email-confirm exchange. Sets `mindlap_pwreset` crumb when `next=/auth/set-password`.
- `/auth/set-password` — reset flow (gated by recovery cookie)
- `/onboarding` — 3-step: username → theme → friend-code share. Required before authed pages. Consumes `mindlap_friend_code` cookie one-shot to auto-create pending friendship.
- `/today` — 7 game cards, pinned > 2x > core > rest. Friends-only top-5 mini-leaderboard from `daily_aggregates`. Direction badge per card. `<TodayMilestoneBanner>`. NOT-YET-PLAYED filler. Search input.
- `/play/[game]` — GameShell. Auto-opens `<DirectionsModal>` first time per game (localStorage-gated).
- `/leaderboards` — Today/7d/All-time × 7 games × global/friends. Anti-cheat footnote. EmptyState empty paths.
- `/friends` — Incoming/Outgoing/Active. AddFriendForm (@username OR friend-code). Toast on action.
- `/f/[code]` — public deep-link. Anon stashes cookie + redirects to /signup. Authed sends request + redirects to /friends.
- `/profile/[username]` — public profile. Header (own-avatar opens editor) → ProfileSocialButtons → badges (delegated tooltip with criteria) → 90-day heatmap (delegated tooltip with date+plays) → per-game grid (PB / set / low (week) / 7d median + n=N days / 30d / total) + score-context line `↑ +N vs 7d median`.
- `/profile/me` — redirects to canonical /profile/<username>.
- `/settings` — Profile (avatar opens editor) / Preferences (theme + skip-tutorials) / Account (privacy + accept-friends + friend-code) / Password / Delete (ConfirmDialog).

## Games (7 shipped)
Pure logic in `lib/games/<key>/`, parity tests in `debug/games/<key>.test.ts`, React UIs in `components/games/<Key>Game.tsx`. Canonical metadata in `lib/games/registry.ts` includes `directions: string[]` array per game (#54).

| Key | Game | Direction | Core | Score |
|---|---|---|---|---|
| math | Speed Math | higher | ★ | problems in 60s |
| digit | Digit Span | higher | ★ | last completed length 3..18+ (step-fn type scale) |
| nback | N-Back (2-back) | higher | ★ | accuracy % over 20 trials |
| stroop | Stroop | higher | ★ | correct in 30s |
| reaction | Reaction | lower | | avg ms over 5 trials |
| mine | Minesweeper | lower | | seconds to clear 10x10/15 mines |
| word | Word Recall | higher | | 0..10 of 10 words recalled |

Shared: `Countdown.tsx` (STEP_MS=500, 4 steps); `GameShell.tsx` ready→countdown→playing→result; `ResultScreen.tsx` Enter=submit / R=retry / N=next.

## Server actions (`actions/*.ts`, all `import "server-only"`)
- **auth.ts**: signUp / signIn / signInWithGoogle / requestPasswordReset / setNewPassword / changePassword / signOut.
- **profile.ts**: setTheme / setAvatarIdentity({color,emoji}) / changeUsername / updateProfileBasics / setProfilePrivacy / setSkipTutorials / setAcceptsFriendRequests / completeOnboarding (consumes friend-code cookie) / deleteAccount.
- **friendships.ts**: addFriend (Zod refine code XOR username, rate-limited 30/hr, opt-out check, accepts inbound on race) / accept / decline / cancel / remove.
- **submission.ts**: submitScore (Zod int score, calls `process_submission`, returns `{ xpAwarded, isNewPb, best, streakCurrent }`) / togglePin.

## Database (13 migrations on `nookxuvlvwtppitqguxf`)

Single writer for submissions + daily_aggregates: **`process_submission(text, numeric, boolean) → jsonb`**. Runs streak update, XP awards via `award_xp`, badge eval via `eval_badges`. Migration history:

- 0001 init (16 tables, base CHECKs, `touch_updated_at`).
- 0002 `handle_new_user`, friend-code generation.
- 0003 RLS policies (privacy-aware SELECT on submissions/daily_aggregates).
- 0004 friend_code → `profile_secrets` (owner-only) + `find_user_by_friend_code` + `regenerate_friend_code` RPCs.
- 0005 fix friend-code lookup search_path.
- 0006 GRANT all + ALTER DEFAULT PRIVILEGES (Mgmt-API path skipped Supabase default-priv seeding).
- 0007 process_submission v1 (superseded).
- 0008 `award_xp` + `eval_badges` + extended process_submission.
- 0009 pre-multiply XP at caller; cap scales with bonus mult.
- 0010 process_submission RETURNS jsonb (dodges OUT-param shadowing).
- 0011 `find_user_by_username(text) → uuid` (citext, case-insensitive).
- 0012 `profiles.accepts_friend_requests boolean default true`.
- 0013 `profiles.avatar_emoji text` with char_length 1..32 CHECK (R18 tracks drift vs grapheme validator).

RPCs surface: process_submission, find_user_by_friend_code, find_user_by_username, regenerate_friend_code.

Tables: profiles, profile_secrets, user_game_pins, daily_bonus, games (seeded), submissions, daily_aggregates, ratings, mind_elo, friendships, groups, group_members, group_invites, badges (seeded), user_badges, xp_events.

## Privacy + security
- `profiles.is_public` (default true). False = sparse profile + RLS-hidden submissions.
- `profile_secrets.friend_code` owner-only RLS.
- HTTP security headers (CSP, HSTS, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP=same-origin) in `next.config.ts`. Prod CSP strict; dev allows `unsafe-eval` + `ws://localhost:*`.

## Patterns
- Server Components default; `"use client"` only for interactive widgets.
- Server Actions for mutations, Zod-validated. Anti-enumeration on signup/reset.
- Pure logic in `lib/`, vitest-tested. UI shells in `components/`.
- PT-anchored dates via `lib/pt-date.ts`. PB-today detection in `/today` uses 24h UTC window + `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' })` filter (DST-safe).
- Daily-bonus rotation: deterministic FNV-1a hash, no DB persistence.
- XP rules in `lib/xp.ts` (JS mirror of 0008/0009/0010 SQL).
- Recovery flow: one-shot `mindlap_pwreset` cookie (5min TTL).
- Toast + Modal + ConfirmDialog primitives (`components/ui/*`). Modal has focus trap + body scroll lock. Toast 4s TTL.
- Single delegated tooltip bubble watches `data-tip` attrs document-wide (avoids 91 mounts on heatmap).
- Avatar centering: SVG `<text>` + `dominant-baseline="central"` + post-mount `getBBox()` measurement, memoized in module-level Map.
- StreakRibbon imports `streakColor` from `lib/tier-colors.ts`. `RANK_TIERS` in same file feeds future leaderboard prestige.

## Tests (210 cases / 23 files passing)

Test categories: auth (username/friend-code/avatar-palette/theme/avatar-emoji/friend-code-cookie), games (math/digit/nback/stroop/reaction/mine/word/edge-cases), pt-date, daily-bonus, xp-bar, xp, badge-icons, heatmap, countdown, digit-len-class, today-milestone.

Run: `npm test` | `npm run typecheck` | `npm run lint` | `npm run build`. Playwright walkthrough script: see `.playwright-mcp/` artifacts (gitignored). Local dev seed: `node scripts/apply-migrations.mjs scripts/seed-walkthrough.sql` after creating `walkthrough@test.com` via `scripts/create-dev-user.mjs`.

## Docs index
- `.vibe/docs/style-reference/zetamac-pure.html` — locked visual reference
- `.vibe/docs/style-reference/zetamac-pure.md` — what to lift verbatim vs swap
- `.vibe/docs/mindgames/` — read-only copy of the source mindgames `.vibe/`

## Reference repos
- Source: `dukesmith0/mindgames` (private), local `C:\Users\craigs\OneDrive\Desktop\Projects\mindgames`.
- This: `dukesmith0/mindlap` (public). Vercel `mindlap`. Supabase `nookxuvlvwtppitqguxf`.
