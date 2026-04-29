# mindlap
Last: 2026-04-28 | Phases 0/1/1.5/2 shipped. 4 core games playable end-to-end on dev (Math/Digit/N-Back/Stroop). 61 vitest, lint+typecheck clean.

## Stack
Next.js 16 App Router (RSC, Server Actions) | TS strict | Tailwind (most utilities disabled) + CSS vars | Supabase Auth/Postgres/Storage + pg_cron | Resend via Supabase SMTP | Courier Prime via `next/font/local` (`app/fonts/`, GDPR-clean) | Zod | Vitest unit, Playwright e2e | Vercel + Speed Insights

## Architecture
Public rebuild of private mindgames. Routes split `(marketing) / (auth) / (authed)`. Open-ended play: any game, any time, submit-vs-retry on each play. Leaderboards = time slices Today / 7d / All-time, no shared-puzzle daily mechanic. Personal-improvement is the v1 headline UX. Glicko-2 plumbing silent in v1.

## Style: Zetamac Pure (locked, ref zetamac.com)
Tokens in `app/globals.css`:
- light: bg #fff, ink #111, muted #666, line #e5e5e5, accent #0066cc
- dark: bg #0f0f0f, ink #f0f0f0, muted #888, line #2a2a2a, accent #5aa3ff (AA)
- font-mono: "Courier Prime", ui-monospace, "Courier New", Courier, monospace

Typography: Courier Prime only. Body 15/1.6. h1 22/400 letter-spacing -0.3. h2 14/400 uppercase letter-spacing 1 muted. Weight 700 only when necessary.

Layout: 1px solid line borders only (never thicker, never dashed). Cards top+bottom border, no bg, no radius, no shadow. Buttons square. Main max-w 720, padding 48 64. Sidebar 200, padding 32 24.

Animations: streak ribbon opacity 1>0.55>1, 2s ease-in-out infinite. Button hover instant fill. No row stagger, no reveal, no hover lifts/scale/translate.

Hard rules: no shadow, no border-radius, no emoji, no gradient, no other typeface, no colored card bg, no icons-in-buttons.

In-game type scale (overrides body 15): Math problem 56, Digit Span seq 80, N-Back letter 96, Stroop word 56, Reaction text 28, Mine cell 22, Word Recall words 28. All Courier Prime.

Theme toggle: onboarding asks once. `profiles.theme_pref` server-side, mirrored to localStorage for fast first paint (server reads cookie, sets `data-theme` on `<html>`). `prefers-color-scheme` only if user has not chosen. Toggle in `/settings`.

## Components (✅ shipped, ⏳ planned)
- ✅ Auth: Supabase email/pw + Google, identity linking on shared verified email. `handle_new_user` trigger seeds `profiles` + `profile_secrets` (friend_code). Reset/change password live (`/auth/set-password` gated by one-shot recovery cookie; `/settings` change-password verifies current via stateless side client).
- ✅ Games core 4: Math, Digit Span, N-Back, Stroop. Pure logic `lib/games/<g>/index.ts`, UI `components/games/<G>Game.tsx`, shared `Countdown` (3-2-1-Go), `GameShell` (ready/countdown/playing/result), `ResultScreen` (Enter=submit / R=retry / N=next core).
- ⏳ Games secondary 3: Reaction, Minesweeper, Word Recall (Phase 3).
- ✅ Submit-vs-retry result screen + `submitScoreAction` (Zod int score, range vs `games` catalog, RLS user_id binding).
- ✅ `/play/[game]` route renders GameShell.
- ⏳ `/today`: 7 cards sorted user-pin > today's `[2x]` > ★ > rest. Each card: best-today, submissions-today, top-5 today preview, Play. Phase 2 ships a 4-card MVP (today-best from `daily_aggregates`); Phase 4 finishes pins/2x/leaderboard preview.
- `/leaderboards`: tabs Today / 7d / All-time, sub-tabs per-game raw best + Daily Completion, filter Global/Friends/Group. Anonymous full visibility (no cap). Authed gets sticky "your rank".
- `/profile/[username]`: header (pulsing streak, level chip, total plays, all-time PB count) + per-game cards (PB+date, lifetime worst, 7-day median, 30-day sparkline, plays, Glicko post-flip) + 90-day heatmap + history/graphs links + badge wall.
- `/profile/me/history`: daily aggregates table, date dividers, filter by game, CSV export.
- `/profile/me/graphs`: per-game pure-SVG line charts, All-plays vs Daily-average toggle.
- `/settings`: Profile / Account / Preferences / Notifications. Theme, pin reorder, tutorial replay, master skip.
- Friends: mutual-accept, friend filter on leaderboards, 8-char `friend_code`.
- Groups: per-group public/private. Owner/admin/member roles. Invite by username (in-app), email-link via Resend, or 8-char `join_code`. Public groups in `/groups` directory, 1-click join.
- Badges 4 cats: streak (3/7/30/100), PB (first per game, all-7-PBs, all-7-today), elo-tier (defined, inert v1), achievement (perfect N-back day, sub-300ms reaction, etc.).
- XP: participation (capped 5/game/day), score-scaled on new daily PB only, streak bonus, 2x on the day's double-XP games. Level = `floor(sqrt(xp/100))`. Cosmetic only.
- Tutorials: configs `lib/tutorials/<game>.ts`, cutout-mask overlay, first-play auto + replay button, master skip.
- Glicko-2 (silent v1): per-game vs virtual opponent at 30-day population median. Default 1500/350/0.06. Composite Mind-elo RD-weighted. UI gated by `ELO_VISIBLE`.
- Daily double-XP: 2 of 7 games per PT day, deterministic date-hash rotation. Calendar 14 days out.
- User pins: per-user game ordering via `user_game_pins`, drag-reorder in settings or click-pin on card.

## Data tables
profiles, profile_secrets (friend_code, owner-only RLS), user_game_pins, daily_bonus, games, submissions, daily_aggregates, ratings, mind_elo, friendships, groups, group_members, group_invites, badges, user_badges, xp_events. (16 tables.)

## Privacy
`profiles.is_public` toggle (default true). When false, `/profile/[username]` shows sparse view (avatar, username, "private"). Submissions still appear on leaderboards with username; clicking lands on the private view. Friends see full profile. SELECT on `submissions`/`daily_aggregates` is privacy-aware (owner OR public profile OR accepted friend).

## Account deletion
Hard delete with cascade. Removes auth.users + all submissions/aggregates/ratings/friendships/group_memberships/badges/xp/pins. Group ownership transfers to oldest admin or group dissolves. No tombstones.

## User flow (v1)
1. Sign up email/pw or Google > onboarding (username, theme, optional avatar) > land on `/today`.
2. `/today` 7 cards, first-play of any game triggers tutorial overlay.
3. Play > result screen > Submit (writes, ticks streak, awards XP, evals badges, fires toast) or Retry (replays, no save).
4. Profile foregrounds improvement (PB, trend, streak, badges, history, graphs).
5. Leaderboards: Global/Friends/Group, time tabs Today/7d/All-time.
6. Friends mutual-accept. Groups invite-only by username, email-link, or join_code.

## Scoring (verbatim from mindgames)
- Math: ↑ problems in 60s, Enter skip = -3s
- Digit Span: ↑ last correct length, display = `2000 + (length-3)*500`ms
- N-Back (2-back): ↑ accuracy% over 20 scorable trials. 22 total, ~30% targets, 1000ms letter + 1500ms blank
- Stroop: ↑ correct in 30s
- Reaction: ↓ avg ms over 5 trials
- Minesweeper: ↓ seconds, 10x10, 15 mines, first-click-safe
- Word Recall: ↑ correct 0-10, 20s memorize, 10 of 115 words, deduped

## Patterns
- Server Components default; `"use client"` only for game UIs and interactive widgets.
- Server Actions for all mutations, Zod-validated. `actions/{auth,profile,submission}.ts` declare `import "server-only"`.
- Pure logic in `lib/`, vitest-tested. UI shells in `components/`.
- PT-anchored dates via `lib/pt-date.ts` (`Intl.DateTimeFormat en-CA` in America/Los_Angeles), server-locale-safe.
- RLS for tenant isolation, DB CHECK for score range, trigger-based aggregate/rating/badge updates.
- CSS variables drive light/dark via `data-theme` on `<html>`.
- Single Postgres function `process_submission()` writes submission + updates aggregate + rating + XP + badges in one transaction.
- Public-read whitelist: `/`, `/today` (preview), `/leaderboards` (full, no cap), `/profile/[username]` (public). Server Actions reject anonymous.
- Storage: NO per-day cap (every submitted play stored). Detail rows deleted at 90 days; `daily_aggregates` kept forever.
- Daily boundary: America/Los_Angeles. `played_pt_date` GENERATED column on submissions.
- Proxy auth: `proxy.ts` (Next 16). `isPublicPath()` excludes `/profile/me*` while allowing `/profile/<username>`. Matcher excludes `/api/*`. Cookies refreshed during `getUser()` are copied onto redirects. Null profile = redirect to `/onboarding`.
- HTTP security headers (CSP, HSTS, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP=same-origin) in `next.config.ts`. CSP `script-src` adds `'unsafe-eval'` + `ws://localhost:*` ONLY when `NODE_ENV === "development"` (dev React bundle requirement). Production unchanged.
- Anti-enumeration: `requestPasswordResetAction` always returns ok; signup treats "already registered" as success.

## Tests
Vitest (`debug/**/*.test.ts`), Playwright (`tests/e2e/*.spec.ts`). Run: `npm test`, `npm run test:e2e`. 61 passing across 8 files (auth/profile/theme/avatar 25 + games 36).

## Docs
- [docs/mindgames/](docs/mindgames/): full reference copy of source mindgames `.vibe/`
- [docs/style-reference/zetamac-pure.html](docs/style-reference/zetamac-pure.html): locked visual mock for `/today` (open in browser). Companion `.md` notes what to lift verbatim and what to swap (font family > Courier Prime, dark mode tokens, tier colors).

## Reference
mindgames (private) `C:\Users\craigs\OneDrive\Desktop\Projects\mindgames`. GitHub: dukesmith0/mindgames (private), dukesmith0/mindlap (public).
