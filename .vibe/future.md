# Future

## Monetization (post-launch)
- Free: 2 games per PT day total (any combination).
- Paid: $5/mo unlimited. Annual $50/yr (~17% off).
- Stripe. `profiles.subscription_status` (free/active/past_due/canceled) + `subscription_period_end`.
- Daily limit enforced on submission insert trigger: free + at-limit > reject with "Upgrade" UI.
- No pay-to-win: leaderboards/streak/XP/badges unaffected by tier.
- 7-day full-access trial on signup to convert habit.
- Defer until traffic justifies.

## Pre-launch reviews
- Review the XP-per-level scaling curve before public launch. Current: `level = floor(sqrt(xp / 100)) + 1`, so Lv 2 at 100 xp, Lv 3 at 400, Lv 4 at 900, Lv 10 at 8100, Lv 20 at 36100. With participation cap 5/play and PB bonus 25 × streak × 2x, average daily XP for an engaged user (7 plays + 4 PBs) is roughly `35 (participation) + 4*25 = 135` at streak 1, scaling to ~270 at streak 7. So Lv 10 at ~30 days of consistent play, Lv 20 at ~120 days. Decide pre-launch: is this curve too fast (rewards exhaust quickly, no long-tail goals), too slow (early levels feel grindy), or correct? Sample population data once we have ≥1 week of users and re-tune the divisor (currently 100) without breaking persisted XP.

## Pre-launch / v1.x ideas
- Community tab: dedicated page (or sidebar item) with a player-search input + paginated list of recently-active public profiles, each as a clickable card (avatar + username + level + streak). Complements the friend-add-by-username surface from Phase 7. Defer until friends/groups land so the social graph has somewhere to plug in.

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
