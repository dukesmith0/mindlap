# mindlap
Last: 2026-04-28 | pre-scaffold | TypeScript target

## Stack
- Next.js 16 App Router (RSC, Server Actions)
- TypeScript strict
- Supabase: Auth (email + Google, identity linking), Postgres (RLS), Storage (avatars), pg_cron / edge functions
- Resend (via Supabase Auth SMTP hook) for verification, password reset, group invites
- Tailwind CSS (most utilities disabled) + CSS variables in `app/globals.css` for Zetamac Pure tokens
- Courier Prime via `next/font/google` (only typeface in the app)
- Zod for Server Action input validation
- Vitest (unit), Playwright (e2e)
- Vercel hosting

## Architecture
Public rebuild of private mindgames. Routes split into `(marketing)`, `(auth)`, `(authed)`. Open-ended play: any game, any number of plays, any day. Submit-vs-retry flow on every play. Leaderboards slice submitted scores into time windows (Today / 7-day / All-time), no shared-puzzle daily mechanic. Personal-improvement layer is the v1 headline UX. Glicko-2 silent in v1.

## Style: Zetamac Pure (locked)
Reference: zetamac.com.

### Tokens (CSS variables, defined once in `app/globals.css`)
- light: bg #ffffff, ink #111111, muted #666666, line #e5e5e5, accent #0066cc
- dark: bg #0f0f0f, ink #f0f0f0, muted #888888, line #2a2a2a, accent #5aa3ff (AA on dark)
- font-mono: "Courier Prime", ui-monospace, "Courier New", Courier, monospace

### Typography
Courier Prime is the only family. Body 15px / line-height 1.6. h1 22px weight 400 letter-spacing -0.3px. h2 14px weight 400 uppercase letter-spacing 1px color muted. Numbers same family. Weight 700 only when genuinely needed.

### Layout
1px solid line borders only, never thicker, never dashed. Cards: top + bottom border only, no bg, no radius, no shadow. Buttons square corners. Main max-width 720px padding 48px 64px. Sidebar 200px padding 32px 24px.

### Animations
Streak ribbon opacity pulse 1 to 0.55 to 1, 2s ease-in-out infinite. Button hover instant fill swap. No row stagger, no page-load reveal, no hover lifts.

### Hard rules
No shadows, no border-radius, no emojis, no gradients, no other typefaces, no colored card backgrounds, no icons in buttons, no hover lifts/scale/translate.

### Theme toggle
Onboarding asks once. Stored on `profiles.theme_pref`, mirrored to `localStorage` for fast first paint. `prefers-color-scheme` respected only if user has not chosen. Toggle in `/settings`.

## Components (planned, populated as scaffolded)
- Auth: Supabase, email/pw + Google, identity linking on shared verified email; `handle_new_user` trigger seeds profile
- Games (7): Math, Digit Span, N-Back, Stroop (★ core), Reaction, Minesweeper, Word Recall. Pure logic in `lib/games/<game>/`, UI in `components/games/<game>/`. Random distributions (no seeded determinism)
- Submit-vs-retry result screen after every play (mindgames model)
- `/today`: 7 cards sorted by user-pin > today's [2x] > ★ core > rest. Each card shows best-today, submissions-today, top-5 today-leaderboard preview, Play button
- `/leaderboards`: tabs Today / 7-day / All-time, sub-tabs per-game raw best + Daily Completion, filter Global/Friends/Group. Anonymous sees top 10 with sign-in CTA on rows 11+
- `/profile/[username]`: header (streak ribbon pulsing, level chip, total plays, all-time PB count) + per-game cards (PB+date, lifetime worst, 7-day median, 30-day sparkline, plays count, Glicko post-flip) + 90-day heatmap + history/graphs links + badge wall. Improvement-tracking is the headline.
- `/profile/me/history`: daily aggregates table, date row dividers, filter by game, export CSV
- `/profile/me/graphs`: per-game line charts in pure SVG, All-plays vs Daily-average toggle
- `/settings` hub: Profile / Account / Preferences / Notifications sections. Theme toggle, pinned-games drag-reorder, tutorial replay
- Friends: mutual-accept, friend filter on leaderboards
- Groups: private invite-only, group leaderboard, invite by username or email-link token (Resend-delivered)
- Badges: streak (3/7/30/100), PB (first-PB per game, all-7-PBs, all-7-today), elo-tier (inert v1), achievement (perfect N-back day, sub-300ms reaction, etc.)
- XP: participation (capped 5/game/day), score-scaled (only on new daily PB), streak bonus. 2x on the day's double-XP games. Level = floor(sqrt(xp/100)). Cosmetic only
- Tutorials: step configs in `lib/tutorials/<game>.ts`, cutout-mask overlay, first-play auto + replay button, master skip toggle in settings
- Glicko-2 (silent v1): per-game rating (default 1500/350/0.06) vs virtual opponent at 30-day population median. Composite Mind-elo RD-weighted. UI gated by `ELO_VISIBLE`
- Daily double-XP: 2 of 7 games per UTC day, deterministic rotation (date hash). Calendar widget shows next 14 days
- User pins: per-user game ordering, drag-reorder in settings or click-to-pin on game card

## Data tables (planned, see plan for full schema)
profiles, user_game_pins, daily_bonus, games, submissions, daily_aggregates, ratings, mind_elo, friendships, groups, group_members, group_invites, badges, user_badges, xp_events.

## Privacy
`profiles.is_public` toggle. When false, `/profile/[username]` shows sparse private view (avatar, username, "private"). Submitted scores still appear on leaderboards with username visible (clicks land on the same private view). Friends see full profile.

## Account deletion
Hard delete with cascade. Removes auth.users row, all submissions/aggregates/ratings/friendships/group_memberships/badges/xp/pins. Group ownership transfers to oldest admin or group dissolves. Avatar removed from Storage.

## User Flow (v1)
1. Sign up (email/pw or Google) > onboarding (username, theme choice, optional avatar) > land on `/today`
2. `/today`: 7 cards. First-play of any game triggers tutorial overlay
3. Play game > result screen > Submit or Retry. Submit writes to `submissions`, ticks streak, awards XP, evaluates badges, fires toast
4. Profile foregrounds personal improvement (PB, trend, streak, badges, daily history, graphs)
5. Leaderboards filter by Global/Friends/Group, time-window tabs Today/7d/All-time
6. Friends: mutual-accept. Groups: invite-only via username or Resend email-link

## Scoring (verbatim from mindgames)
- Math: ↑ problems in 60s, Enter skip with -3s
- Digit Span: ↑ last correct length, display = `2000 + (length-3)*500`ms
- N-Back (2-back): ↑ accuracy% over 20 scorable trials. 22 total, ~30% targets, 1000ms letter + 1500ms blank
- Stroop: ↑ correct count in 30s
- Reaction: ↓ avg ms over 5 trials
- Minesweeper: ↓ seconds, 10x10, 15 mines, first-click-safe
- Word Recall: ↑ correct 0-10, 20s memorize, 10 of 115 words, deduped

## Patterns
- App Router conventions: Server Components default, `"use client"` only for game UIs and interactive widgets
- Server Actions for all mutations, Zod-validated
- Pure-logic in `lib/`, vitest-tested. UI shells in `components/`
- RLS for tenant isolation, DB CHECK for score range, trigger-based aggregate/rating/badge updates
- CSS variables drive light/dark theme via `data-theme` attribute on `<html>`
- Single Postgres function `process_submission()` writes submission + updates aggregate + rating + XP + badges in one transaction
- Public-read whitelist on `/`, `/today` (preview), `/leaderboards` (FULL, no cap), `/profile/[username]` (public). Server Actions reject anonymous. Authed users see "your rank" sticky highlight on leaderboards.
- Storage cap: 20 submissions per (user, game, UTC day) FIFO. Detail rows deleted at 90 days, daily_aggregates kept forever

## Tests
vitest (unit lib/) + Playwright (e2e). `debug/**/*.test.ts`, `tests/e2e/*.spec.ts`. Run: `npm test`, `npm run test:e2e`. Phase 2 ports mindgames test parity (~129 tests / 10 files).

## Docs Index
- [docs/mindgames/](docs/mindgames/): full reference copy of source mindgames `.vibe/`

## Reference
- mindgames (private): `C:\Users\craigs\OneDrive\Desktop\Projects\mindgames`
- GitHub: github.com/dukesmith0/mindgames (private), github.com/dukesmith0/mindlap (public)
