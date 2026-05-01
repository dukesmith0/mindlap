# Future

Long-tail ideas without a phase slot yet. Lift into `plans.md` once decided.

## Asks-pending (Phase 14 — do not build before user picks)

- **More games (~10 total)**: spatial-rotation, dual-task, paired-associate, sudoku revival.
- **Game start-point selection** (length-based games like Digit Span).
- **Custom timer durations + matching leaderboard filters** + per-second ranking.
- **Cross-game leaderboards** (streak / level / scoring factor).
- **Community tab** (`/community`) — player search + recently-active public profiles.

## Badges follow-ups (Phase 5.5 / 9)

- Achievement badges (perfect N-Back, sub-300ms Reaction).
- `/badges` index — locked + earned, criteria visible.
- Pinned badges on profile (`profiles.pinned_badges text[]`).
- Badge rarity %: nightly cron RPC.
- Badge-earn chip on ResultScreen (Phase 9 — `process_submission` already returns events).

## Cognitive-improvement priorities (persona review)

Persona's question: "Am I getting better?" — currently unanswered. Ranked:

1. **Pull Phase 9 sparkline forward.** Per-game 30-day score line. Highest-leverage addition. *Already lifted in plans.md.*
2. **30d-vs-prior-30d delta line under each per-game card** (Phase 9 add-on). Direction-aware. Reuses fetched data.
3. **Improvement score v0** (Phase 9.5 / pull from Phase 15). Per-user z-score delta vs first-5 baseline; no population dependency.
4. **Domain rollup card** (Phase 5.5). Group 7 games into 2-3 cognitive domains; show each domain's 30d delta.
5. **Heatmap default → score view** once sparkline lands.

Already shipped in commit 6:
- Numeric delta replaces "better than" copy: `↑ +12 vs 7d median`.
- Sample size next to median: `n=N days`.

## Profile prestige (Phase 5.5 data + Phase 13 visual)

A high-ranked profile should feel visually distinct. Surface ideas: top-1/10/100 medal chips next to game stats; "global rank N worldwide on Math" line in profile header; rare-rank accent border on profile card. Pairs with badge-rarity + pinned badges.

## Improvement-tracking + graphs (Phase 5.5 / 9 / 15)

- 30-day per-game sparkline on profile cards (Phase 9).
- `/profile/me/history` table view + CSV export (Phase 5.5).
- `/profile/me/graphs` — mindgames-parity score-over-time. Per-game line/scatter, "all plays" vs "daily aggregate", aggregate z-scored cross-game view. Inline SVG.
- Improvement score full version with population data (Phase 15).
- Heatmap toggle `[plays | score]` (Phase 9, decided option A).

## Design system gaps (rolled into Phase 8 — shipped commit 6)

Shipped: Toast, Modal, EmptyState, ConfirmDialog, FormField, DelegatedTooltips, relative-date, tier-colors. Remaining:
- `<PendingOverlay>` / `.is-pending` utility (unify ResultScreen + buttons).
- Migrate inline `<p style={{...}}>[no incoming requests]</p>` patterns on `/friends` to `<EmptyState>`.

## Pre-launch reviews (Phase 13)

- **XP-per-level scaling curve.** `level = floor(sqrt(xp/100)) + 1`. Engaged user (~135-270 xp/day) → Lv 10 in ~30 days, Lv 20 in ~120 days. Re-tune divisor after ≥1 week of users without breaking persisted XP. Pair with "more XP for higher streak" + future "scaled XP per level" + "streak extension options".
- **Replay-token anti-cheat (R1).** Decide ship-here vs defer to Phase 16.

## Post-launch (Phase 16)

- Glicko-2 UI flip at threshold (closes R2). Mind-elo + per-game elo tabs. Elo-tier badges retroactive.
- Multiplayer head-to-head with real opponent rating.
- Public-group request-approval flow.
- Push notifications + daily-seed timezone option.
- Wordle-style emoji result share.
- i18n. Sudoku revival.

## Monetization (Phase 17, traffic-gated)

- Free: 2 games per PT day total.
- Paid: $5/mo or $50/yr (~17% off). Stripe + `profiles.subscription_status`.
- Daily limit on submission insert trigger.
- 7-day full-access trial on signup.
- No pay-to-win.
