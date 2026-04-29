# Future

Long-tail ideas that don't yet have a phase slot. Once one is decided + sized, lift it into `plans.md`.

## Asks-pending (do not build before user picks)

These are carried into Phase 14:

- **More games — target ~10 total.** Candidates: spatial-rotation, dual-task, paired-associate, sudoku revival.
- **Game start-point selection** (length-based games like Digit Span — pick a starting length on the ready screen).
- **Custom timer durations + matching leaderboard filters** (so 30s-Math doesn't compete against 60s-Math) + per-second ranking.
- **Cross-game leaderboards** by streak / level / overall scoring factor (composite metric).
- **Community tab** (`/community`) — player search + recently-active public profiles.

## Badges system follow-ups (Phase 5.5 / 6.5)

- **Achievement badges** (perfect N-Back day, sub-300ms Reaction, etc.). Extends `lib/badges/icons.ts` + `eval_badges` SQL.
- **`/badges` index page** — locked + earned, criteria visible, earned date on hover. Same `badgeCriteria(key)` source as Phase 8 #45 tooltips.
- **Pinned badges on profile** — user picks top N badges (default 3-5) to highlight at the top of the badge wall. Storage: `profiles.pinned_badges text[]` migration.
- **Badge rarity %** — surface "X% of users have earned this" on each badge tooltip + on the `/badges` index. Computed from `count(distinct user_id) / count(distinct user_id with any submission)`. Refresh nightly via cron or RPC.
- **Badge-earn celebration on ResultScreen** — when a play unlocks a new badge, show a small `[new badge: <emoji> <name>]` chip below the XP/PB indicators. Reads `process_submission` JSON return (already includes badge events; just plumb through).

## Profile prestige (Phase 5.5 / 13)

- **Prominent leaderboard rankings on profile.** A high-ranked player's profile should feel visually distinct + aspirational vs a fresh profile, so newcomers want to climb. Surface ideas: top-1 / top-10 / top-100 per-game medal chips next to game stats; a "global rank" line in the profile header (e.g. "rank 47 worldwide on Math"); rare-rank highlight (top 10 globally on any game gets an accent border on the profile card). Pairs with badge-rarity % and pinned badges. Phase 5.5 lands the data; Phase 13 polishes the visual hierarchy.

## Improvement-tracking + graphs (Phase 5.5 / 9 / 15)

- **Per-game 30-day score sparkline** on profile cards (Phase 9, planned).
- **`/profile/me/history`** table view + CSV export (Phase 5.5).
- **`/profile/me/graphs`** mindgames-parity graphical view: per-game line / scatter charts of submitted scores over time, toggle for "all plays" vs "daily aggregate" (PB / mean / median per day). Plus aggregate view overlaying all 7 games on one z-scored time axis. Inline SVG, 1px stroke + accent fill, no shadows. (Phase 5.5 — explicitly carries the original mindgames score-over-time tracking the user wants reproduced.)
- **Improvement score** — composite z-score delta vs first-5-submissions baseline; surfaces on /profile + as "+N this month" delta on /today (Phase 15).
- **Heatmap toggle** between `[plays]` (current) and `[score]` (sparkline) view (Phase 9, decided option A).

## Design system gaps (rolled into Phase 8)

The UI/UX-pro-max review surfaced these. None blocking individually; they multiply when Phase 10 groups land:

- `<Toast>` / `<ErrorBox role="alert">` (#59 owns this)
- `<EmptyState>`
- `<PendingOverlay>` / `.is-pending`
- `<FormField>`
- `<ConfirmDialog>` (#64 modal primitive lays the groundwork)
- `lib/relative-date.ts` (47-days-ago formatter)
- `lib/tier-colors.ts` (StreakRibbon + leaderboard tier colors single source of truth)

## Pre-launch reviews (Phase 13)

- **XP-per-level scaling curve.** `level = floor(sqrt(xp/100)) + 1`. Lv 2 at 100 xp, Lv 10 at 8100, Lv 20 at 36100. Engaged user (~135-270 xp/day) hits Lv 10 in ~30 days, Lv 20 in ~120 days. Sample population data after ≥1 week of users; re-tune the divisor without breaking persisted XP. Pairs with the user's "more XP for higher streak" preference + future "scaled XP per level" + "streak extension options" — re-tune all three together so daily curves stay enjoyable across novice → expert.
- **Replay-token anti-cheat (R1).** Decision-pending whether to ship in Phase 13 or defer to Phase 16. The #58 footnote acknowledges the gap; full server-issued seeded tokens + signed event logs are the resolution.

## Post-launch (Phase 16)

- Flip Glicko-2 UI when ≥ 25 users × ≥ 10 ranked/game (closes R2). Mind-elo + per-game elo tabs. Elo-tier badges retroactive.
- Multiplayer head-to-head with real opponent rating.
- Public-group request-approval flow (instant-join is v1).
- Push notifications + daily-seed timezone option.
- Wordle-style emoji result share for daily completion.
- i18n.
- Sudoku revival.

## Monetization (Phase 17, traffic-gated)

- Free: 2 games per PT day total.
- Paid: $5/mo unlimited or $50/yr (~17% off). Stripe + `profiles.subscription_status` + `subscription_period_end`.
- Daily limit on submission insert trigger.
- 7-day full-access trial on signup.
- No pay-to-win — leaderboards/streak/XP/badges unaffected.
