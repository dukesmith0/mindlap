# Decisions
All dated 2026-04-28 unless noted.

## Stack & infra
- Next.js 16 App Router + Supabase + Vercel + TS strict. RSC default, Server Actions for mutations.
- Auth: Supabase email/pw + Google with identity linking on shared verified email. `handle_new_user` trigger creates `profiles` + `profile_secrets` rows.
- Email: Resend via Supabase Auth SMTP hook. Verification, reset, group invites.
- Vercel Speed Insights via `@vercel/speed-insights/next` in root layout.
- HTTP security headers (CSP, HSTS, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP=same-origin) in `next.config.ts`. CSP allows Supabase REST+ws and Speed Insights only.
- Proxy auth gate at `proxy.ts` (Next 16 convention, not `middleware.ts`). `isPublicPath()` excludes `/profile/me*` while allowing `/profile/<username>`. Matcher excludes `/api/*`. Refreshed cookies copied onto redirects.
- npm audit: 3 moderate PostCSS CVEs via Next 16, build-time only on dev-controlled CSS, waived. Revisit when Next bumps.

## Games & play
- Keep all 7 mindgames, port to TS. Math/Digit Span/N-Back/Stroop = ★ core; Reaction/Minesweeper/Word Recall secondary.
- Open-ended play, no daily seed. Each game uses its own random distribution (zetamac model).
- Submit-vs-retry on each play (mindgames model). Retry replays without saving; submit writes.
- Storage: NO per-day cap. Every submitted play stored. Detail rows deleted at 90 days; `daily_aggregates` kept forever. (Was 20 FIFO, raised to remove evict-the-enthusiast risk.)
- Daily boundary: America/Los_Angeles (PT), not UTC. `played_pt_date` GENERATED column on submissions. Streak boundary, daily_aggregates date, double-XP rotation, all PT-anchored.
- Streak: any submission per PT day maintains. No grace period. Resets to 0 on missed day.
- Track `daily_aggregates.plays_total` (every finished play) + `plays_submitted` (subset). Profile counters `total_plays` + `total_submitted`. `record_play_event(game_key)` increments plays_total on game finish; submission trigger increments plays_submitted.
- Anti-cheat: RLS + DB CHECK + auth.uid()-tied insert only. Replay-token system deferred (Risk #R1).

## Style
- Zetamac Pure (locked). Courier Prime via `next/font/local` from `app/fonts/` (.ttf for Reg/Bold/Italic/BoldItalic), GDPR-clean (NOT `next/font/google`).
- Pure CSS variables in `app/globals.css` + minimal Tailwind utilities (most disabled).
- Tokens: light bg #fff/ink #111/muted #666/line #e5e5e5/accent #0066cc; dark equivalents #0f0f0f/#f0f0f0/#888/#2a2a2a/#5aa3ff.
- Square corners, no shadows, 1px borders only. One animation: streak ribbon opacity pulse 2s.
- In-game type scale (overrides body 15px): Math 56, Digit Span 80, N-Back 96, Stroop 56, Reaction 28, Mine 22, Word Recall 28.

## Reward loop & XP
- v1 reward loop: streak + PB + badges + raw-score leaderboards + double-XP days. Elo is post-launch flip.
- XP sources: participation (capped 5/game/day), score-scaled `floor(z * 50)` on new daily PB only (z = pop-standardized, clamped 0-200), streak bonus.
- Streak bonus: `multiplier = min(1.0 + 0.1 * (streak_current - 1), 2.5)`. Day 1 = 1.0x, Day 16 = 2.5x plateau. Applied to score-scaled XP.
- Daily Double-XP: 2 of 7 games per PT day, deterministic date-hash rotation. `[2x]` pill on `/today`. Calendar 14 days ahead.
- Level = `floor(sqrt(xp/100))`. Cosmetic only. XP per submitted play (not per unsubmitted attempt).
- `xp_events.source` enum: submission, daily_pb, streak, double_xp_bonus, daily_complete, level_up. `multiplier` column captures 2x.

## Glicko-2
- Per-game rating vs virtual opponent at 30-day population median. RD-weighted composite Mind-elo. Multiplayer-ready.
- SIDELINED in v1: ratings persist on every submitted score, UI gated by `ELO_VISIBLE=false`. Threshold to flip: ≥25 users × ≥10 submissions/game.
- Single PG function `process_submission()` writes submission + aggregate + Glicko + XP (with 2x bonus) + badge eval, all transactional.

## Profile & UX
- Improvement-tracking is the v1 headline. Profile shows: streak ribbon (pulsing), level chip, total plays, all-time PB count + per-game cards (PB+date, lifetime worst, 7-day median, 30-day sparkline, plays count) + 90-day heatmap + history table + graphs page (All-plays vs Daily-average toggle, mindgames parity) + badge wall.
- `/settings` hub: Profile / Account / Preferences / Notifications. Theme, pin reorder, tutorial replay, master skip.
- Onboarding: username confirm > theme choice (live swatches) > optional avatar > `/today`.
- Default avatar: 28px circle `--ink` fill, first letter of display_name (or username) in white. No external service. Custom avatar features (frames, animated, level-locked) deferred.
- Globally-starred core uses ★, user pins use `>`. Both can show on same card. Independent.

## Privacy & accounts
- `profiles.is_public` (default true). False = sparse `/profile/[username]`; submissions still on leaderboards with username; private view on click. Friends see full.
- `profile_secrets` table holds `friend_code` (owner-only RLS). RPCs `find_user_by_friend_code(text)` and `regenerate_friend_code()` are SECURITY DEFINER. Migration 0004 moved off `profiles` to close mass-enumeration.
- Username: citext UNIQUE. 6-month rotation cron renames inactive accounts to `<name>_<id6>` and frees the original. Warning email at 5.5mo. User picks new on next login. Profanity filter (`naughty-words-js`) + reserved list (admin/api/login/etc). Rate limit 1 change / 30 days.
- Hard delete with cascade. auth.users row + all data removed. Group ownership transfers to oldest admin or dissolves. No tombstones.
- `requestPasswordResetAction` always returns ok; signup treats "already registered" as success. Closes account-enumeration via auth UX.
- `signOutAction` pinned to `scope: 'global'` so all refresh tokens revoke server-side.
- Theme cookie httpOnly + secure-in-prod. Server-only consumption (root layout reads via `cookies()`).
- `actions/auth.ts` + `actions/profile.ts` declare `import "server-only"` to fence service-role/admin paths.
- Password: 10+ chars, ≥1 number/symbol (OWASP ASVS L1, tightened from 8). Common-passwords list deferred to Phase 11.
- App-level rate limiting (signup/signin/reset) deferred to Phase 11 with Vercel KV/Upstash bucket. v1 dev-deploy relies on Supabase Auth's per-IP throttling. Not acceptable for public launch (Risk #R13).

## Friends & groups
- Friends: mutual-accept; friend filter on leaderboards.
- Groups: per-group public/private toggle (owner-flippable). Public in `/groups` directory, instant 1-click join. Private needs invite or join_code.
- Group roles: owner (rename, settings, promote/demote, kick, transfer, delete, regen join_code) / admin (invite, kick non-owners, revoke invites) / member (leave, invite only if `allow_member_invite=true`).
- Group cap: default 100, max 1000 (hard ceiling). Owner-raisable in settings.
- Public-group request-approval flow deferred to v2.
- 8-char codes (friend_code + group join_code), Crockford-ish alphabet (no 0/O/1/I/L). Friend codes regen-from-settings; join_codes regen-by-owner.
- Shareable links: `/f/<friend_code>`, `/g/<join_code>`. Anon click stashes code in signed cookie; signup auto-completes friend request or group join. Authed click is 1-tap accept. OG images render inviter/group name.
- Friend request rate limit: 30 outgoing/hour/user.

## Public-read / gating
- Anonymous browses `/`, `/today` (preview), `/leaderboards` (FULL no cap), public `/profile/[username]`. Anonymous play, "see more" leaderboards beyond preview, friending, group ops, all submissions require auth. Trade-off: lose try-now hook for cleaner data.
- Anonymous `/today` shows real top-5 leaderboard scores (not blurred), drives "high score to beat" curiosity.
- Authed users get sticky "your rank" highlight row on leaderboards.

## Tier & badges (post-flip)
- Tiers percentile-based: top 1% diamond, 5% platinum, 15% gold, 35% silver, rest bronze. Recomputed weekly.
- Badge cats: streak (3/7/30/100), PB (first per game, all-7-PBs, all-7-today), elo-tier (defined, inert v1), achievement (perfect N-back day, sub-300ms reaction avg, etc.).
- Achievement progress visible on locked badges ("X of Y plays", threshold target, etc.).

## Tutorials
- Per-game step configs in `lib/tutorials/<game>.ts`, cutout-mask overlay. First-play auto with prominent Skip. "How to play" replay button. Tracked in `profiles.tutorials_seen`. Master skip in settings.

## Misc launch
- Cookie consent: shown to all visitors, one-time dismiss. Geo-targeting deferred.
- Bug feedback: GitHub issues + `feedback@<domain>` mailto in footer.
- First-launch empty leaderboard copy: "Be the first to set a score on Speed Math today!" + Play CTA.
- Build sequence: v1 = phases 0-8 + 11. Phase 10 (Glicko silent) integrated from Phase 2. Phase 12 flip is post-launch.
- Testing: vitest unit + Playwright e2e. Port mindgames vitest cases (~129 tests / 10 files in Phase 2).
- UX: desktop-first responsive. Mobile must work, not optimized first.

## Assumptions
- User has Supabase + Vercel accounts. Google OAuth client provisioned in Supabase Auth, identity linking enabled. Resend account, API key in Supabase SMTP config.
- Initial player base small. Elo cold-start mitigated by silent accumulation (Risk #R2).

## Learned lessons
- No em dashes in any output.
- Keep .vibe files concise and token-efficient.
- Default to user-friendly defaults: when user opted "lightest" anti-cheat but elsewhere wanted anti-cheat, ship middle path with explicit risk note rather than block on contradiction.
- Cross-migration consistency: when moving a column to a new table (e.g. friend_code -> profile_secrets in 0004), grep every plpgsql function that referenced it. `generate_friend_code` was missed and crashed signup until 0005.
- On Supabase, plpgsql functions touching pgcrypto must `set search_path = public, extensions` (pgcrypto isn't in `public`).

## Plan archive
