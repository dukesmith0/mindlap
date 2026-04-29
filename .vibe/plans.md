# Plans

mindlap v1: public Next.js 16 + Supabase + Vercel + Resend rebuild of mindgames. Streak/PB/badges as headline, raw-score leaderboards, friends now, groups next. Glicko-2 silent until ≥25 users × ≥10 ranked/game. Style locked to Zetamac Pure (Courier Prime, accent `#0066cc`).

**Standing rule (per user 2026-04-29):** every Open bug + every active risk must land in a phase below, and all must close before public launch (Phase 13). If a phase here doesn't own a tracked item, the gap is a planning bug.

## Shipped

| Phase | Scope | Marker |
|-------|-------|--------|
| 0 | scaffold | — |
| 1 | auth + profiles + onboarding + settings + privacy + hard-delete | — |
| 1.5 | reset/change password + recovery-cookie crumb gate (closes R14) | — |
| 2 | game shell + 4 core games + 3-2-1 countdown + Enter/R/N | — |
| 3 | remaining 3 games | — |
| 4 | pins, [2x] pill, leaderboard preview, /leaderboards, public-read gating, process_submission RPC | — |
| 5 | /profile/[username] + per-game stats + badges | — |
| 6 | XP events 0008/0009/0010 + streak/PB/all-seven badge eval | — |
| 7 + commit 1 polish | 14 polish bugs + 90-day heatmap + theme-toggle latency fix | `46637bc` |
| 7 + commit 2 friends | mutual-accept friends + add by @ or code + leaderboards Friends scope + /f/<code> + 30/hr rate-limit + accepts_friend_requests opt-out + ProfileSocialButtons + #41 friends-only Today mini-leaderboard | `c2ca5d6` |
| 7 + commit 3 polish | Tier 3 polish (#46/#55/#57/#60/#61) | `3d4b224` |
| 7 + commit 4 avatar | #48 avatar identity rework: migration 0013, AvatarEditor modal, click-to-edit on TopBar + own-profile + settings, color picker removed from /settings | `b038ae1` |
| 7 + commit 5 avatar polish | Avatar centering fix (paddingBottom scaled with font), hover blur + "edit" overlay, curated 50-emoji picker grid + shortcut hint, `.vibe` consolidation | staged |

## Active

### Phase 7.5 — Newcomer experience

Bugs owned: #51, #52, #54, #56. All decided.

- **#51** `<TodayMilestoneBanner>` at top of /today: surfaces "🔥 day N — keep going" / "🏆 first PB earned today" / "X / 7 games today". Authed-only. Reads `profiles.streak_current` + today's `daily_aggregates` rows. Hidden once user crosses 7 games or after first week.
- **#52** Score context line under per-game grid stats. Format: "↑ above your 7d median" / "↓ below your 7d median" / "= matches your 7d median". One row per stat. Uses already-fetched data, no new query.
- **#54** Direction badge on each `/today` game card (small `lower` / `higher` chip). Tap opens a directions popup auto-keyed off the game's `lib/games/registry.ts` entry. Auto-opens on first play of each game (dismiss persists in localStorage `mindlap.directions.seen.<game_key>`).
- **#56** 3rd onboarding step: friend-code share with copy button + "skip" CTA. Edits `app/(authed)/onboarding/OnboardingFlow.tsx` (1→2→3 step machine).

### Phase 7.6 — Daily-user friction

Bugs owned: #62, #53. All decided. Streak-XP rule **kept** (more XP for higher streak — user confirmed; future tuning will pair with scaled-XP-per-level + streak-extension options).

- **#62** Countdown `STEP_MS` 600 → 500 in `components/games/Countdown.tsx`. Total countdown 2.0s. Update `debug/countdown.test.ts`.
- **#53** Per-game grid: keep absolute date for `set`. Rename column `worst` → `low (week)` (rolling 7-day low). Will be revisited once Phase 9 sparkline + Phase 5.5 graphs land.

### Phase 7.7 — Trust + transparency

Bugs owned: #58. Decided.

- **#58** Anti-cheat footnote on `/leaderboards`: small muted line "scores are user-reported; replay-token verification ships post-launch." Single edit to `app/leaderboards/page.tsx`.

### Phase 8 — Design system + remaining UX

Bugs owned: #14, #45, #59, #64. All decided.

- **#59** `<Toast>` primitive (1px accent border, 4s auto-dismiss, opacity-only fade). Wired into ProfileSocialButtons, AddFriendForm, FriendRow, settings forms.
- **#64** `<Modal>` primitive extracted from AvatarEditor with focus trap + body scroll lock. AvatarEditor refactored on top.
- **#45** Themed tooltips for badges + heatmap. Single delegated hover bubble (one mounted `<Tooltip>`, listens to `pointermove` + `data-tip` attributes — avoids 91 mounted instances on the heatmap). `lib/badges/icons.ts` gains `badgeCriteria(key)`.
- **#14** Digit Span overflow at length 10+: step-fn breakpoints. Classes `digit-len-9` (80px) / `-10` (72px) / `-12` (64px) / `-15` (48px) / `-18` (36px). JSX picks based on current length.
- Other primitives (no tracked bug, but blocking Phase 10): `<EmptyState>`, `<PendingOverlay>` / `.is-pending`, `<FormField>`, `<ConfirmDialog>`, `lib/relative-date.ts`, `lib/tier-colors.ts`.

### Phase 9 — Result screen + sparkline

Bugs owned: #30. Heatmap fate decided (option A: keep heatmap AND add sparkline; user toggles).

- **#30** Pre-submit comparison view on `ResultScreen`. New action `getPreSubmitContext(game_key, score)` returning `{ pb, worst7, median7, leaderboardRank, projected }`. Renders above submit button with green `(+N)` / red `(-N)` deltas.
- **Badge-earn celebration on ResultScreen.** When a play unlocks a new badge, render a small `[new badge: <emoji> <name>]` chip below the XP/PB indicators. `process_submission` JSON return already carries badge events — just plumb through.
- Per-game 30-day score sparkline component (inline SVG, 1px stroke + accent fill, no shadows). Lives in `components/profile/ScoreSparkline.tsx`.
- Profile heatmap section gets a tab toggle: `[plays] [score]`. `[plays]` = current heatmap; `[score]` = sparkline. State stored in `?view=plays` / `?view=score` searchParam.

### Phase 4.5 — Original Phase 4 follow-ups

No tracked bugs.

- Drag-reorder pins on /today.
- Daily Completion sub-tab on /leaderboards.
- 14-day double-XP calendar widget.
- Group filter on /leaderboards (gated on Phase 10).

### Phase 5.5 — Original Phase 5 follow-ups + badge / prestige expansion

No tracked bugs.

- `/profile/me/history` table view + CSV export.
- **`/profile/me/graphs` mindgames-parity score-over-time graphs.** Per-game line / scatter charts of submitted scores over time, toggle for "all plays" vs "daily aggregate" (PB / mean / median per day). Aggregate view overlays all 7 games on one z-scored time axis (direction-up = better regardless of higher-or-lower). Inline SVG, 1px stroke + accent fill, no shadows. Carries the original mindgames score-over-time UX the user wants reproduced.
- Achievement badges (perfect N-Back day, sub-300ms Reaction, etc.). Extends `lib/badges/icons.ts` + `eval_badges` SQL.
- `/badges` index page (locked + earned, criteria visible). Same `badgeCriteria(key)` source as #45 tooltips.
- **Pinned badges on profile.** User picks top N badges (default 3-5) to highlight at the top of the badge wall. Migration: `profiles.pinned_badges text[]`.
- **Badge rarity %.** Surface "X% of users have earned this" on each badge tooltip + on `/badges`. Computed as `count(distinct user_id) / count(distinct user_id with any submission)`. Refresh nightly via cron RPC.
- **Profile prestige rankings (data layer).** Fetch each user's per-game leaderboard rank (top-1 / top-10 / top-100 medals) + global rank. Surfaces lightly here; full visual hierarchy lands in Phase 13.

### Phase 10 — Groups

No tracked bugs. Risk delta: depends on Phase 8 ConfirmDialog + Toast primitives.

- Public + private groups. Roles: owner / admin / member.
- `/g/<join_code>` deep-link.
- Invites by username / email / join_code.
- Public-group instant-join (request-approval deferred to Phase 16).
- Group leaderboard page; group filter on /leaderboards.

### Phase 11 — Tutorials

No tracked bugs.

- First-play cutout-mask overlay per game. Auto on first play. Replay button on game ready screen. Master skip toggle (`profiles.skip_tutorials` already exists).

### Phase 12 — Glicko-2 silent

Risk owned: R2 (cold-start). Resolves naturally once threshold population accumulates.

- Persist Glicko rating per game on every submission.
- `ELO_VISIBLE=false`.
- No UI surface yet.

### Phase 13 — Launch readiness

**This phase owns every remaining bug + risk.** Cannot ship public launch with any open.

Risks owned:
- **R13 [HIGH]** App-level rate limit (Vercel KV or Upstash) on auth + friend-request paths. Replaces `lib/rate-limit.ts` per-DB stopgap.
- **R16 [LOW]** side-client password-grant rate sharing — folds into R13.
- **R17 [LOW]** per-user submission spam — folds into R13.
- **R18 [LOW]** Tighten `profiles.avatar_emoji` CHECK to a regex matching "exactly one extended grapheme" (or accept the drift if Postgres regex can't express it cleanly).
- **R1 [MED]** Anti-cheat. Decision-pending whether to ship full replay tokens here or defer to Phase 16. The #58 footnote (Phase 7.7) acknowledges the gap; full server-issued seeded tokens + signed event logs land here unless deferred. **Surface options before launch.**
- **R3 [LOW]** Daily-bonus rotation — already deterministic; promote to Resolved during the next refresh.
- **R15 [LOW]** Future-migration role grants — process-only risk; document in a launch runbook entry (`scripts/apply-migrations.mjs` enforces correct ownership).

Bugs owned:
- **#26 [LOW]** Profile page RPC consolidation (`get_public_profile_stats(user_id)`) — collapses 28 round-trips to 1.

Other launch tasks:
- Notifications system (in-app + email digest opt-in). Streak reminders, friend requests, badges, group invites.
- **Profile prestige (visual layer).** Render the Phase 5.5 rank data as accent medal chips next to game stats, a "global rank" line in the profile header, and a top-10-globally accent border on the profile card. Goal: a high-ranked profile feels visibly distinct + aspirational vs a fresh profile, so newcomers want to climb.
- SEO: titles, meta-description, OG images, sitemap, robots.txt.
- Legal: ToS + Privacy Policy pages.
- Mobile pass: 375 / 414 px audit, tap-target review.
- Full Playwright e2e: signup → onboarding → play → submit → leaderboard → friend → group.
- Lighthouse: perf ≥ 90, a11y ≥ 95 on /today.
- Production domain + DNS + Vercel prod env.
- **Pre-launch review:** XP-per-level scaling curve. Sample after ≥1 week of users; re-tune the divisor (currently 100) without breaking persisted XP.
- **Final bug + risk audit:** zero open bugs, zero unresolved risks (or each explicitly parked with a launch waiver in `decisions.md`).

### Phase 14 — Cross-game + game expansion *(asks-pending)*

All `[?]` items per `future.md` "Pre-launch / v1.x ideas". Surface options + wait before coding.

- More games — target ~10 total. Candidates: spatial-rotation, dual-task, paired-associate, sudoku revival.
- Game start-point selection for length-based games (Digit Span starts at chosen length).
- Custom timer durations + matching leaderboard filters + per-second ranking.
- Cross-game leaderboards (streak / level / overall scoring factor).
- Community tab (`/community`) — player search + recently-active public profiles.

### Phase 15 — Improvement score

Depends on Phase 5.5 graphs + ≥30 days population data.

- Per-game z-score delta over 30/60/90-day windows vs user's first-5-submissions baseline.
- Averaged across games with optional weighting toward the cognitively-core 4.
- Surfaces on /profile and as "+N this month" delta on /today.

### Phase 16 — Post-launch

- Flip Glicko-2 UI when ≥ 25 users × ≥ 10 ranked/game (closes R2).
- Mind-elo + per-game elo tabs. Elo-tier badges retroactively awarded.
- Replay-token anti-cheat (closes R1 fully if deferred from Phase 13).
- Multiplayer head-to-head with real opponent rating.
- Public-group request-approval flow.
- Push notifications + daily-seed timezone option.
- Wordle-style emoji result share for daily completion.
- i18n.
- Sudoku revival.

### Phase 17 — Monetization *(traffic-gated)*

- Free: 2 games per PT day total.
- Paid: $5/mo unlimited or $50/yr (~17% off). Stripe + `profiles.subscription_status` + `subscription_period_end`.
- Daily limit on submission insert trigger.
- 7-day full-access trial on signup.
- No pay-to-win — leaderboards/streak/XP/badges unaffected.
