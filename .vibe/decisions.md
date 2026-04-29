# Decisions
All dated 2026-04-28 unless noted. `[USER]` = explicit choice; `[CLAUDE]` = implementation assumption recorded after the fact.

## Stack & infra
- Next.js 16 App Router (Turbopack dev) + Supabase + Vercel + TS strict. RSC default, Server Actions for mutations.
- Auth: Supabase email/pw + Google with identity linking on shared verified email. `handle_new_user` trigger creates `profiles` + `profile_secrets` rows.
- Email: Resend via Supabase Auth SMTP hook. Verification, reset, group invites.
- Vercel Speed Insights via `@vercel/speed-insights/next` in root layout.
- HTTP security headers (CSP, HSTS, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP=same-origin) in `next.config.ts`. CSP allows Supabase REST+ws and Speed Insights only. Dev gates `'unsafe-eval'` + `ws://localhost:*` behind `NODE_ENV === "development"`.
- Proxy auth gate at `proxy.ts` (Next 16 convention, not `middleware.ts`). `isPublicPath()` excludes `/profile/me*` while allowing `/profile/<username>`. Matcher excludes `/api/*`. Refreshed cookies copied onto redirects.

## Games & play
- Keep all 7 mindgames, port to TS. Math/Digit Span/N-Back/Stroop = ★ core; Reaction/Minesweeper/Word Recall secondary.
- Open-ended play, no daily seed. Each game uses its own random distribution (zetamac model).
- Submit-vs-retry on each play. Retry replays without saving; submit writes via `process_submission` RPC.
- Storage: NO per-day cap. Every submitted play stored. Detail rows deleted at 90 days; `daily_aggregates` kept forever.
- Daily boundary: America/Los_Angeles (PT). `played_pt_date` GENERATED column on submissions.
- Streak: any submission per PT day maintains. No grace period. Resets to 0 on missed day.
- 3-2-1-Go countdown before every game (user request).
- Anti-cheat: RLS + DB CHECK + `auth.uid()`-tied insert + range-check vs games catalog. Replay-token system deferred (R1).

## Style
- Zetamac Pure (locked, ref `.vibe/docs/style-reference/zetamac-pure.html`). Courier Prime via `next/font/local`.
- Pure CSS variables + minimal Tailwind. 1px borders, square corners, no shadows, no gradients.
- Animations: streak 🔥 ribbon pulse 2s; countdown step opacity fade 240ms; result XP/PB fade-in 320ms. No transforms, no other movement.
- In-game type scale (override 15px body): Math 56 / Digit 80 / N-Back 96 / Stroop 56 / Result 96 / Reaction 32. Mobile @640px: 40/56/72/40/72/22.
- App shell: 200px sidebar, > accent prefix on active, 720px main column, 48/64px padding. Mobile <=720px collapses sidebar to top strip.
- 2026-04-28 [USER] Reversed "no emoji" rule for streak only. StreakRibbon uses 🔥 with tier-coloured numbers (1-2 ink / 3-6 amber / 7-29 orange / 30-99 red / 100+ violet). Rest of app stays emoji-free.
- 2026-04-28 [USER] Extended emoji exception list to badges. Each badge_key maps to a single themed emoji (🔥 streak, 🏆 first-PB, 🎯 all-seven-today, etc.) instead of identical accent dots. Why: badges are meant to feel like rewards; uniform dots erase per-badge identity. Map definition lives in `lib/badges/icons.ts` (to be created); zetamac-pure rules still hold for buttons, nav, leaderboards, in-game UI.
- 2026-04-28 [USER] XP bar in topbar. `levelFromXp(xp) = floor(sqrt(max(0, xp)/100)) + 1`; `xpForLevel(N) = 100 * (N-1)^2`. 1px outline + accent fill, 96px desktop / 64px mobile.

## Reward loop & XP (Phase 6 shipped)
- 2026-04-28 [USER] v1 reward loop: streak + PB + badges + raw-score leaderboards + double-XP days. Elo is post-launch flip.
- 2026-04-28 [CLAUDE] XP rules locked in `lib/xp.ts` + migrations 0008/0009/0010:
  - Participation: 5 xp/play, capped 5/(user, game, PT date). On bonus days, doubles to 10/play with 10/day cap (per-play and cap both scale with bonus_mult so the cap stays consistent with the per-play award).
  - Daily PB: 25 xp on a new daily best. Multiplied by streak_mult and bonus_mult.
  - Streak mult: `min(2.5, 1.0 + 0.1 * (streak - 1))`. Plateaus at streak 16.
  - Bonus mult: 2.0 on the day's daily-bonus pair, 1.0 otherwise.
  - Score-scaled `floor(z * 50)` deferred to post-launch (Phase 12) since it needs population stats.
- 2026-04-28 [CLAUDE] Pre-multiply at the caller in `process_submission`; `award_xp(p_amount, p_multiplier)` writes `xp_events.amount = p_amount` (already final), `xp_events.multiplier = p_multiplier` (informational only), `profiles.xp += p_amount`. Bug #24 fix: caller passes `p_multiplier=1.0` so we never double-count.
- 2026-04-28 [CLAUDE] `process_submission` returns `jsonb` (0010) instead of `RETURNS TABLE(best, worst, ...)` because OUT params with those names shadow daily_aggregates columns inside the function body, raising "column reference 'best' is ambiguous" on UPDATE SET clauses.
- 2026-04-28 [CLAUDE] Daily double-XP: deterministic FNV-1a hash of PT date string -> 2 of 7 game keys (`lib/daily-bonus.ts`). NO DB persistence; determinism alone closes R3 (cron-skip risk). The `daily_bonus` table stays for an admin-overridable rotation later.
- 2026-04-28 [CLAUDE] `is_bonus_game` is passed from server action (`isBonusGame(ptDate(), key)`). Client-trustable in v1 since the inflation is bounded (10 xp/play cap, 50 xp PB max). Future hardening: derive inside the fn.

## Badges (Phase 6 shipped)
- 2026-04-28 [CLAUDE] `eval_badges(user_id)` (internal, no GRANT) called from `process_submission` after streak update. Grants:
  - streak: `streak_3` / `streak_7` / `streak_30` / `streak_100`
  - per-game first-PB: `pb_first_<game>` (any submission of that game)
  - all-seven-today: `all_seven_today` when distinct game submissions today >= total games count
  - Idempotent via `ON CONFLICT DO NOTHING` on `user_badges` PK.
- Achievement badges (perfect N-back day, sub-300ms reaction) deferred to Phase 5.5/6.5.

## Profile & UX
- Improvement-tracking is the v1 headline. Profile shows: streak ribbon, level + xp bar, all-time PB count, total plays, longest streak + per-game cards (PB+date, lifetime worst, 7d median, 30d plays count) + badge wall.
- Phase 5.5 will add: 90-day heatmap, 30-day SVG sparkline, `/profile/me/history` (CSV export), `/profile/me/graphs` (All-plays vs Daily-average toggle).
- `/settings` hub: Profile / Preferences / Account / Password / Delete. Theme picker, avatar color picker, skip-tutorials toggle, friend-code copy, public-profile toggle, current-pw-verified change-password, hard-delete with username-confirm.
- Onboarding: username confirm > theme choice (live swatches) > land on `/today`.
- Default avatar: 28px circle `--ink` fill, first letter of display_name (or username) in white. 20-color palette in `lib/auth/avatar-palette.ts`.
- Globally-starred core uses `*`, user pins use `>`. Both can show on same card. Independent.

## Privacy & accounts
- `profiles.is_public` (default true). False = sparse `/profile/<username>`.
- 2026-04-28 [CLAUDE] Privacy + leaderboards reconciliation: RLS `submissions readable per privacy` (0003) excludes private-profile users entirely from anonymous/non-friend leaderboards. The Phase-1 plan said "username still on leaderboards"; the shipped policy makes private users invisible there too. Tracked-as-design for v1; re-evaluate post-launch.
- `profile_secrets` table (friend_code, owner-only RLS). RPCs `find_user_by_friend_code(text)` and `regenerate_friend_code()` are SECURITY DEFINER, granted to `authenticated`. 0004 moved off `profiles` to close mass-enumeration.
- Username: citext UNIQUE. 6-month rotation cron renames inactive accounts to `<name>_<id6>` and frees the original (Phase 11). Profanity filter (`naughty-words-js`) + reserved list. Rate limit 1 change / 30 days.
- Hard delete with cascade. auth.users row + all data removed. Group ownership transfers to oldest admin or dissolves (Phase 8 trigger).
- `requestPasswordResetAction` always returns ok; signup treats "already registered" as success. Closes account-enumeration via auth UX.
- `signOutAction` pinned to `scope: 'global'` so all refresh tokens revoke server-side.
- Theme cookie httpOnly + secure-in-prod. Server-only consumption (root layout reads via `cookies()`).
- All `actions/*.ts` declare `import "server-only"` to fence service-role/admin paths.
- Password: 10+ chars, ≥1 number/symbol (OWASP ASVS L1). Common-passwords list deferred to Phase 11.
- App-level rate limiting deferred to Phase 11 (R13). Block before public launch.

## Reset/change password (Phase 1.5 shipped)
- 2026-04-28 [CLAUDE] One-shot `mindlap_pwreset` cookie set by `/auth/callback?next=/auth/set-password` only (5min TTL, httpOnly + sameSite=lax + secure-in-prod). `setNewPasswordAction` requires its presence so a stolen-cookie session cannot pivot to password reset without going through the recovery email. Cookie burned on success and on expired-session.
- 2026-04-28 [CLAUDE] `changePasswordAction` verifies current password via stateless side `@supabase/supabase-js` client (`persistSession: false`) so the live SSR cookies and other tabs are not rotated by the verification call.
- 2026-04-28 [CLAUDE] `RECOVERY_COOKIE` constants live in `lib/auth/recovery-cookie.ts` (not in actions/auth.ts because `"use server"` files only export async functions).

## Friends & groups (Phases 7-8, not yet shipped)
- Friends: mutual-accept; friend filter on leaderboards.
- Groups: per-group public/private toggle (owner-flippable). Public in `/groups` directory, instant 1-click join. Private needs invite or join_code.
- Group roles: owner (rename, settings, promote/demote, kick, transfer, delete, regen join_code) / admin (invite, kick non-owners, revoke invites) / member (leave, invite only if `allow_member_invite=true`).
- Group cap: default 100, max 1000 (hard ceiling). Owner-raisable.
- Public-group request-approval flow deferred to v2.
- 8-char codes (friend_code + group join_code), Crockford-ish alphabet (no 0/O/1/I/L). Friend codes regen-from-settings; join_codes regen-by-owner.
- Shareable links: `/f/<friend_code>`, `/g/<join_code>`. Anon click stashes code in signed cookie; signup auto-completes.
- Friend request rate limit: 30 outgoing/hour/user (Phase 7).

## Public-read / gating
- Anonymous browses `/`, `/today` (preview), `/leaderboards` (full no cap), public `/profile/<username>`. Anonymous play, friending, group ops, all submissions require auth. Trade-off: lose try-now hook for cleaner data.
- Authed users get sticky "your rank" highlight on leaderboards.

## Tier & badges (post-flip)
- Tiers percentile-based: top 1% diamond, 5% platinum, 15% gold, 35% silver, rest bronze. Recomputed weekly.
- Badge cats: streak (3/7/30/100, shipped), PB (first per game, all-7-today, shipped), achievement (perfect N-back day, sub-300ms reaction, etc., Phase 5.5/6.5), elo-tier (defined, inert v1, Phase 12).
- Achievement progress visible on locked badges.

## Tutorials (Phase 9)
- Per-game step configs in `lib/tutorials/<game>.ts`, cutout-mask overlay. First-play auto with prominent Skip. "How to play" replay button. Tracked in `profiles.tutorials_seen`. Master skip in settings.

## Glicko-2 (Phase 10/12)
- Per-game rating vs virtual opponent at 30-day population median. RD-weighted composite Mind-elo. Multiplayer-ready.
- SIDELINED in v1: ratings will persist on every submitted score, UI gated by `ELO_VISIBLE=false`. Threshold to flip: ≥25 users × ≥10 submissions/game.

## Misc launch
- Cookie consent: shown to all visitors, one-time dismiss. Geo-targeting deferred.
- Bug feedback: GitHub issues + `feedback@<domain>` mailto in footer (Phase 11).
- First-launch empty leaderboard copy: "Be the first to set a score on Speed Math today!" + Play CTA.
- Build sequence: v1 = phases 0-8 + 11. Phase 10 (Glicko silent) integrates from Phase 4. Phase 12 flip is post-launch.
- Testing: vitest unit + Playwright e2e. 163 vitest passing across 16 files (auth + 7 games + edge cases + daily-bonus + pt-date + xp-bar + xp). Playwright e2e specs to be authored Phase 11.
- UX: desktop-first responsive. Mobile must work, not optimized first.

## Phase scope decisions
- 2026-04-28 [USER] Approach B for combined Phase 3 + 4: ship Phase 3 in full + Phase 4 essentials together; defer drag-pins / friends-filter / Daily Completion / 14-day calendar / public profiles to Phase 4.5 / 5. Why: B delivers all daily-user-visible changes in one coherent diff.

## Assumptions
- User has Supabase + Vercel accounts. Google OAuth client provisioned in Supabase Auth, identity linking enabled. Resend account, API key in Supabase SMTP config.
- Initial player base small. Elo cold-start mitigated by silent accumulation (R2).
- All migrations applied via `scripts/apply-migrations.mjs` (Mgmt API as `postgres` owner). Manual Studio path would require re-running 0006-style grant block (R15).

## Learned lessons
- No em dashes in any output.
- Keep `.vibe/` files concise and token-efficient.
- Default to user-friendly defaults: when a contradiction surfaces, ship middle path with explicit risk note rather than block.
- Cross-migration consistency: when moving a column to a new table (e.g. friend_code -> profile_secrets in 0004), grep every plpgsql function that referenced it. `generate_friend_code` was missed and crashed signup until 0005.
- On Supabase, plpgsql functions touching pgcrypto must `set search_path = public, extensions` (pgcrypto isn't in `public`).
- The Mgmt-API migration path (Mgmt API SQL endpoint) bypasses Supabase's default-priv seeding for new tables. Always run a GRANT-all + ALTER DEFAULT PRIVILEGES block with the first migration, or restore later via 0006.
- `RETURNS TABLE(...)` declares OUT parameters in the function body namespace. If column names match table columns updated inside the function, Postgres raises `column reference "X" is ambiguous`. Use `RETURNS jsonb` (0010) or rename the OUT params.
- "use server" files can only export async functions. Constants like `RECOVERY_COOKIE` must live in a separate non-server module.
- Dev-only CSP relaxations (`'unsafe-eval'`, `ws://localhost:*`, no `upgrade-insecure-requests`) must be gated by `NODE_ENV === "development"` — Next sets this at build time, so prod cannot accidentally inherit dev exceptions.

## Plan archive
- v1 plan: `C:\Users\craigs\.claude\plans\snappy-rolling-porcupine.md` (approved 2026-04-28).
