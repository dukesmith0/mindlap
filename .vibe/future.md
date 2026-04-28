# Future Plans

## Monetization (post-launch, planned)
- Free tier: 2 games per PT day total (any combination of plays counts toward limit).
- Paid tier: $5/month for unlimited plays.
- Stripe integration for subscriptions. `profiles.subscription_status` ('free' | 'active' | 'past_due' | 'canceled') + `subscription_period_end`.
- Daily play limit enforced on submission insert: trigger checks subscription_status and `daily_aggregates.plays_total` for the day. If free + already at limit, reject with "Upgrade to play more" UI.
- Submissions still post to leaderboards, no preferential treatment for paid users (no pay-to-win).
- Streak/XP/badges all unaffected by tier.
- Free trial: 7-day full access on signup to convert habit.
- Annual discount: $50/yr (~17% off).
- Builder note: defer to v2 once user base proves engagement. Don't ship paywall until traffic justifies it.

## Post-launch
- Flip Glicko-2 UI exposure (Phase 12), threshold ≥25 users × ≥10 ranked/game. Mind-elo + per-game elo tabs surface. Elo-tier badges retroactively awardable.
- Replay-token anti-cheat: server-issued seeded tokens, signed event logs, server-side replay on submit.
- Multiplayer head-to-head: same Glicko-2 update with real opponent rating.
- Public discoverable groups (browse/join).
- Mobile-first redesign if mobile traffic dominates.
- Sudoku revival (code retained in mindgames, hidden).
- Push notifications + email digests (streak reminder, friend request, badge, group invite).
- i18n.
- Daily-seed timezone option (currently UTC anchored).
- Wordle-style emoji result share for daily completion.
