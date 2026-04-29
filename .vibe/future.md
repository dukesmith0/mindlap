# Future

## Monetization (post-launch)
- Free: 2 games per PT day total (any combination).
- Paid: $5/mo unlimited. Annual $50/yr (~17% off).
- Stripe. `profiles.subscription_status` (free/active/past_due/canceled) + `subscription_period_end`.
- Daily limit enforced on submission insert trigger: free + at-limit > reject with "Upgrade" UI.
- No pay-to-win: leaderboards/streak/XP/badges unaffected by tier.
- 7-day full-access trial on signup to convert habit.
- Defer until traffic justifies.

## Open design questions (from 2026-04-29 reviews)
Each item is a pending design call surfaced by 6 adversarial reviews after commit 2. See `.vibe/current.md` "Pending design calls" for the full list with options. The headline questions:
- **Streak vs skill XP**: decouple streak multiplier from XP gain (streak becomes cosmetic; only PB awards XP) so a 100-day streak doesn't reward half-effort streak-saver plays at ×2.5. Or keep current rule until population data exists. Or introduce a separate "skill streak" (consecutive PB days) alongside the play streak.
- **Day-1 win surface**: should new users see a milestone banner on /today, OR is that too cute and we hide leaderboards entirely until they have ≥3 plays?
- **Heatmap fate**: keep as activity surface AND add a per-game 30-day score sparkline (Phase 5.5), OR replace heatmap with the sparkline outright?
- **Score interpretability**: render text context lines under per-game stats ("↑ above your 7d median"), arrow-only indicators, or wait for population z-scores in Phase 12?
- **Anti-cheat disclaimer tone**: explicit footnote on /leaderboards now, or stay silent until replay tokens land?
- **Onboarding flow length**: add a 3rd step (friend-code share) or stay 2-step + post-arrival nudge?
- **Per-game grid columns**: drop `worst`, hide behind details, or keep with a renamed semantic?
- **Server-action error UX**: `<Toast>` primitive vs inline-under-button vs top-of-page banner?

## Design system gaps
From the UI/UX pro max review. None of these are blocking; they multiply pain as Phase 8 lands. Decide whether to invest now (one focused commit) or wait until duplication in groups/history/graphs surfaces forces the issue.
- `<Toast>` / `<ErrorBox role="alert">` primitive — server actions return errors but ProfileSocialButtons + AddFriendForm + FriendRow swallow them. Pairs with bug #59.
- `<EmptyState>` primitive — friends scope-with-zero-friends, leaderboards-with-no-submissions, today-with-no-games-matched all render inline `<p>`. No consistent styling.
- `<PendingOverlay>` / `.is-pending` utility — some components dim buttons via opacity, others just disable. ResultScreen submit button has no visible busy state.
- `<FormField label="" error="">` primitive — AddFriendForm + settings forms manually create label + input + error structures.
- `<ConfirmDialog>` — no modal pattern for confirmations (e.g. delete account currently uses inline username-confirm field instead of a centered overlay).
- Relative-date helper (`lib/relative-date.ts`) — profile heatmap and per-game PB dates show absolute dates; no shared "47 days ago" formatter.
- Tier-color palette (`lib/tier-colors.ts`) — StreakRibbon has inline tier colors; leaderboard tier colors are separate; no single source of truth.

## Pre-launch reviews
- Review the XP-per-level scaling curve before public launch. Current: `level = floor(sqrt(xp / 100)) + 1`, so Lv 2 at 100 xp, Lv 3 at 400, Lv 4 at 900, Lv 10 at 8100, Lv 20 at 36100. With participation cap 5/play and PB bonus 25 × streak × 2x, average daily XP for an engaged user (7 plays + 4 PBs) is roughly `35 (participation) + 4*25 = 135` at streak 1, scaling to ~270 at streak 7. So Lv 10 at ~30 days of consistent play, Lv 20 at ~120 days. Decide pre-launch: is this curve too fast (rewards exhaust quickly, no long-tail goals), too slow (early levels feel grindy), or correct? Sample population data once we have ≥1 week of users and re-tune the divisor (currently 100) without breaking persisted XP.

## Pre-launch / v1.x ideas
- Community tab: dedicated page (or sidebar item) with a player-search input + paginated list of recently-active public profiles, each as a clickable card (avatar + username + level + streak). Complements the friend-add-by-username surface from Phase 7. Defer until friends/groups land so the social graph has somewhere to plug in.
- Badge index / catalog page (`/badges`): a public page that lists every available badge with its emoji, label, and acquisition criteria. Locked badges (criteria not yet met) render at reduced opacity; earned badges render full color with the earned date on hover. Doubles as discovery (users see what's possible) and reduces "what does this badge mean" friction on profiles. Pairs with bug #45 (themed criteria tooltips on profile badges) — both surfaces should pull from the same `badgeCriteria(key)` source. Defer until Phase 5.5 / 6.5 since achievement badges (perfect N-back, sub-300ms reaction) will land then and the catalog should ship with all badges visible.
- Progress graphs (mindgames parity): per-game line / scatter charts of submitted scores over time, with toggles for "all plays" vs "daily aggregate" (PB / mean / median per day). Plus an aggregate view that overlays all 7 games on the same time axis (z-scored or normalized so direction-up = better regardless of higher-or-lower). Lives at `/profile/me/graphs` per Phase 5.5. Reuse the heatmap palette tokens for visual continuity. No external chart library — Zetamac Pure is hostile to defaults; render inline SVG with 1px stroke + accent fill, no shadows, no gradients.
- More games — eventually ~10 total (3 more beyond the current 7). Candidates from mindgames or new: spatial-rotation, dual-task, paired-associate, sudoku revival. Defer until Phase 11+ once core polish + social are stable.
- Game start-point selection (where applicable). For length-based games (Digit Span) allow the user to start at a chosen length (e.g. start at 5 instead of 3). For timer-based games (Math, Stroop, Reaction, etc.) this doesn't apply. Surfaces as a small "start at length N" stepper on the GameShell ready screen for eligible games. Defer.
- Cross-game leaderboards (streak / level / overall scoring factor): expand /leaderboards beyond per-game tabs to include leaderboards by current streak, by level (XP), and by an overall "scoring factor" composite (likely the same metric as the future improvement score, or a normalized cross-game performance index). Each becomes its own tab alongside the 7 per-game leaderboards. **ASK BEFORE IMPLEMENTING** — the user wants to design the composite metric before this surface lands.
- Custom timer durations per game (replace the locked 60s / 30s defaults with user-chosen timer presets) + matching leaderboard filters so 30s-Math doesn't get compared against 60s-Math. Plus a "per-second" ranking option for games where rate matters more than total. **ASK BEFORE IMPLEMENTING** — the user wants to revisit the design tradeoffs (leaderboard fragmentation vs flexibility) before this lands.
- Improvement score (post-graphs): a single composite number that summarizes how much a user's cognitive performance has grown. Candidate formulation: per-game z-score delta over a 30/60/90-day window vs the user's own baseline (their first 5 submissions in that game), then averaged across games with optional weighting toward the cognitively-core 4. Surfaces on /profile and as a "+N this month" delta on /today. Ties into the v1 thesis (improvement-tracking is the headline, not raw rating). Pairs with Glicko-2 silent surfacing (Phase 10) but is conceptually independent — improvement score is intra-user, Glicko is inter-user. Defer until ≥30 days of population data exist so the baselines aren't noisy.

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
