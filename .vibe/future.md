# Future

## Monetization (post-launch)
- Free: 2 games per PT day total (any combination).
- Paid: $5/mo unlimited. Annual $50/yr (~17% off).
- Stripe. `profiles.subscription_status` (free/active/past_due/canceled) + `subscription_period_end`.
- Daily limit enforced on submission insert trigger: free + at-limit > reject with "Upgrade" UI.
- No pay-to-win: leaderboards/streak/XP/badges unaffected by tier.
- 7-day full-access trial on signup to convert habit.
- Defer until traffic justifies.

## Post-launch
- Flip Glicko-2 UI (Phase 12) at ≥25 users × ≥10 ranked/game. Mind-elo + per-game elo tabs surface. Elo-tier badges retroactively awardable.
- Replay-token anti-cheat: server-issued seeded tokens, signed event logs, server-side replay on submit.
- Multiplayer head-to-head: same Glicko-2 update with real opponent rating.
- Public-group request-approval flow (v1 has instant 1-click join only).
- Mobile-first redesign if mobile traffic dominates.
- Sudoku revival (code retained in mindgames, hidden).
- Push notifications + email digests (streak reminder, friend request, badge, group invite).
- i18n.
- Daily-seed timezone option (currently PT-anchored).
- Wordle-style emoji result share for daily completion.
