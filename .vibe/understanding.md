# mindlap

Streak / PB / badges + raw-score leaderboards + friends / groups. Public Next.js + Supabase + Vercel + Resend rebuild of `dukesmith0/mindgames`. Glicko silent until threshold.

## Stack
- Next.js 16 App Router (RSC + Server Actions, Turbopack dev)
- TypeScript strict
- Supabase Auth + Postgres + Storage + pg_cron
- Resend via Supabase SMTP hook
- Tailwind 3 (most utilities disabled; design = pure CSS variables)
- Courier Prime via `next/font/local`
- Zod 3 for input validation
- Vitest 4 unit; Playwright 1 (no specs yet)
- Vercel + `@vercel/speed-insights/next`

## Architecture
Single Next.js 16 App Router app. RSC by default; `"use client"` only for interactive widgets. All mutations go through Zod-validated Server Actions in `actions/*.ts` (each file `import "server-only"`). Pure logic lives in `lib/`; React shells live in `components/`. Single Supabase project; single submission writer is the `process_submission` RPC.

## Routes
| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/login`, `/signup` | Email/pw + Google OAuth |
| `/auth/callback` | OAuth + email-confirm exchange. Sets `mindlap_pwreset` crumb when `next=/auth/set-password`. |
| `/auth/set-password` | Reset flow (gated by recovery cookie) |
| `/onboarding` | 3-step: username → theme → friend-code share |
| `/today` | Daily game cards, friends mini-leaderboard, milestone banner |
| `/play/[game]` | GameShell. Auto-opens directions modal first time per game. |
| `/leaderboards` | Today / 7d / All-time × 7 games × global / friends |
| `/friends` | Incoming / outgoing / active. AddFriendForm. |
| `/f/[code]` | Public friend deep-link. Anon → cookie + signup. Authed → request + /friends. |
| `/profile/[username]` | Public profile (header → social → badges → 90-day heatmap → per-game grid) |
| `/profile/me` | Redirect to canonical `/profile/<username>` |
| `/settings` | Profile / Preferences / Account / Password / Delete |

## Database
Linked Supabase project `nookxuvlvwtppitqguxf`. 13 migrations applied via `npm run db:migrate` (Mgmt-API path; `postgres` owner). Single submission writer is `process_submission(text, numeric, boolean) → jsonb`, which runs streak update, XP awards via `award_xp`, and badge eval via `eval_badges`. Authed-callable RPCs: `find_user_by_friend_code`, `find_user_by_username`, `regenerate_friend_code`. Tables: profiles, profile_secrets, user_game_pins, daily_bonus, games (seeded), submissions, daily_aggregates, ratings, mind_elo, friendships, groups, group_members, group_invites, badges (seeded), user_badges, xp_events.

Migration index:

| #    | File                              | Purpose |
|------|-----------------------------------|---------|
| 0001 | `init.sql`                        | 16 tables, base CHECKs, `touch_updated_at` trigger |
| 0002 | `handle_new_user.sql`             | Signup trigger + friend-code generation |
| 0003 | `rls_policies.sql`                | RLS policies; privacy-aware SELECT on submissions + daily_aggregates |
| 0004 | `friend_code_privacy.sql`         | Move friend_code to `profile_secrets` (owner-only) + lookup RPCs |
| 0005 | `fix_friend_code_lookup.sql`      | Patch `search_path = public, extensions` on lookup |
| 0006 | `restore_role_grants.sql`         | GRANT all + ALTER DEFAULT PRIVILEGES (Mgmt-API skipped default-priv seeding) |
| 0007 | `process_submission.sql`          | First submission writer (superseded by 0008/0010) |
| 0008 | `xp_and_badges.sql`               | `award_xp` + `eval_badges` + extended `process_submission` |
| 0009 | `fix_xp_multiplier_flow.sql`      | Pre-multiply XP at caller; cap scales with bonus mult |
| 0010 | `process_submission_jsonb.sql`    | `process_submission` RETURNS jsonb (avoids OUT-param shadowing) |
| 0011 | `friend_by_username.sql`          | `find_user_by_username(text) → uuid` (citext) |
| 0012 | `accepts_friend_requests.sql`     | `profiles.accepts_friend_requests boolean default true` |
| 0013 | `avatar_emoji.sql`                | `profiles.avatar_emoji text` with `char_length 1..32` CHECK |

## Style
Zetamac Pure (locked, ref `.vibe/docs/style-reference/style-page.html`). Courier Prime monospaced everywhere. Tokens in `app/globals.css`:
- light: bg `#fff` / ink `#111` / muted `#666` / line `#e5e5e5` / accent `#0066cc` / danger `#d62828` / on-accent `#fff` / reaction `#2e7d32`/`#c62828`/`#f57c00`
- dark: bg `#1e242b` / ink `#f0f0f0` / muted `#9aa0a6` / line `#353c44` / accent `#5aa3ff` / danger `#ef4444` / on-accent `#0f1419` / reaction `#4caf50`/`#ef4444`/`#ffa726`

Layout: 1px borders only, square corners, no shadows, no gradients. No transforms (single exception: checkmark glyph rotate). Cards use top + bottom borders, no bg. Buttons: 1px accent border + accent text; hover = solid fill + on-accent text, instant.

Canonical button family: `<button>`, `.btn-link`, `.btn-danger`, `.btn-sm`, `.btn-icon`, `.btn-ghost` (with `.game-tappable` JSX alias). Anything else is dead code.

Canonical status tags: `.tag` (muted), `.tag-accent` (bonus chip), `.tag-error` (`--danger`). Brackets live in pseudo-elements, never in JSX content.

Inline utilities: `.text-muted-sm` (13px), `.text-muted-xs` (12px), `.numeric` (tabular-nums).

Forms: every label/input pair routes through `<FormField label hint? error?>` (`components/ui/FormField.tsx`).

Animations only: streak ribbon pulse (2s), countdown step opacity fade (240ms), result XP/PB fade-in (320ms), toast/modal opacity fade (160-200ms). Rule: opacity + color transitions only, ≤ 320ms ease-out.

Emoji exceptions: streak 🔥, per-key badge emoji, user-chosen avatar glyph (single grapheme via AvatarEditor), milestone banner icons. Everything else is emoji-free.

In-game type scale: Math 56 / Digit 80 (steps to 36 at length 18) / N-Back 96 / Stroop 56 / Result 96 / Reaction 32. Mobile @640px scaled down ~30%.

## Patterns
- Server Components default; `"use client"` only for interactive widgets.
- Server Actions for mutations, Zod-validated. Anti-enumeration on signup / reset.
- Pure logic in `lib/`, vitest-tested. UI shells in `components/`.
- PT-anchored dates via `lib/pt-date.ts`. PB-today detection uses 24h UTC window + `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' })` filter (DST-safe).
- Daily-bonus rotation: deterministic FNV-1a hash, no DB persistence.
- XP rules in `lib/xp.ts` (JS mirror of 0008/0009/0010 SQL).
- Recovery flow: one-shot `mindlap_pwreset` cookie (5min TTL).
- Toast + Modal + ConfirmDialog primitives in `components/ui/*`. Modal has focus trap + body scroll lock.
- Single delegated tooltip bubble watches `data-tip` attrs document-wide.
- Avatar centering via SVG `<text>` + `dominant-baseline="central"` + post-mount `getBBox()` measurement, memoized in module-level Map.
- All `actions/*.ts` declare `import "server-only"` to fence service-role / admin paths.

## Dev workflow
Setup once:
1. Clone the repo.
2. `vercel link` then `vercel env pull .env.local --yes` (canonical path; pulls the linked project's env). Or copy `.env.local.example` → `.env.local` and fill manually. Required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`.
3. `npm install`.

Daily loop:
- `npm run dev` — http://localhost:3000. Hot reload picks up code; `next.config.ts` changes need a manual restart.
- `npm run db:migrate -- supabase/migrations/<file>.sql` — apply migrations via the Mgmt API.
- `npm run db:doctor` — read-only health checks (counts / extensions / friend-code / grants / SECURITY DEFINER list). Flags: `--all`, `--extensions`, `--friend-code`, `--grants <fn,fn>`, `--functions`.
- `npm run db:seed` — run a seed file from `scripts/seeds/` (default `walkthrough`).
- `npm run user:create -- <email> <password>` — admin-create a pre-confirmed user (gitignored; requires service-role key).
- `npm test` / `npm run typecheck` / `npm run lint` / `npm run build` — quality gates.

Walkthrough screenshots live in `.playwright-mcp/walkthrough-*.png` (gitignored). Seeded walkthrough user: `walkthrough@test.com` / `testpass123`.
