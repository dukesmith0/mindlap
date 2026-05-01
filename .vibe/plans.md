# Plans

mindlap v1: public Next.js 16 + Supabase + Vercel + Resend rebuild of mindgames. Streak/PB/badges as headline, raw-score leaderboards, friends now, groups next. Glicko-2 silent until threshold. Style locked to Zetamac Pure (Courier Prime, accent `#0066cc`).

**Standing rule:** every Open bug + every active risk lands in a phase below; all close before public launch (Phase 13).

## Shipped

| # | Scope | Marker |
|---|-------|--------|
| 0 | scaffold | — |
| 1 | auth + profiles + onboarding + settings + privacy + hard-delete | — |
| 1.5 | reset/change password + recovery-cookie crumb gate | — |
| 2 | game shell + 4 core games + 3-2-1 countdown + Enter/R/N | — |
| 3 | remaining 3 games | — |
| 4 | pins, [2x] pill, leaderboard preview, /leaderboards, public-read gating, process_submission RPC | — |
| 5 | /profile/[username] + per-game stats + badges | — |
| 6 | XP events + streak/PB/all-seven badge eval | — |
| 7 commit 1 | 14 polish bugs + 90-day heatmap + theme-toggle latency | `46637bc` |
| 7 commit 2 | mutual-accept friends + add by @ or code + leaderboards Friends scope + /f/code + 30/hr rate-limit + accepts_friend_requests + ProfileSocialButtons + #41 mini-leaderboard | `c2ca5d6` |
| 7 commit 3 | Tier 3 polish (#46/#55/#57/#60/#61) | `3d4b224` |
| 7 commit 4 | #48 avatar identity rework: migration 0013, AvatarEditor modal, click-to-edit avatar | `b038ae1` |
| 7 commit 5 | avatar centering, hover affordance, emoji picker, .vibe consolidation | staged |
| **7 commit 6** | **Phases 7.5 + 7.6 + 7.7 + 8 + optimization sweep + reviewer fixes** | **staged** |

## Active

### Phase 9 — Result + sparkline *(persona-priority lift)*

Persona review (cognitive-improvement tracker) ranked trend visualization as the highest-leverage gap. Pull this ahead of Phase 4.5 / 5.5.

- **#30** Pre-submit comparison view on ResultScreen. Action `getPreSubmitContext(game_key, score) → { pb, worst7, median7, rank, projected }`. Renders above submit with `(+N)` / `(-N)` deltas.
- **Badge-earn celebration on ResultScreen.** When a play unlocks a badge, render a small `[new badge: <emoji> <name>]` chip below the XP/PB indicators. `process_submission` JSON return already carries badge events.
- **30-day per-game score sparkline.** Inline SVG, 1px stroke + accent fill. Lives in `components/profile/ScoreSparkline.tsx`. Surfaces on profile cards.
- **Profile heatmap toggle `[plays | score]`.** State in `?view=plays`/`?view=score` searchParam. Default `plays` for now; flip to `score` once sparkline is solid.
- **30d-vs-prior-30d delta line under each per-game card.** Direction-aware percent or absolute. Reuses already-fetched data; no new query.

### Phase 4.5 — Original Phase 4 follow-ups

- Drag-reorder pins on /today.
- Daily Completion sub-tab on /leaderboards.
- 14-day double-XP calendar widget.
- Group filter on /leaderboards (gated on Phase 10).

### Phase 5.5 — Original Phase 5 follow-ups + badge / prestige expansion

- `/profile/me/history` table view + CSV export.
- **`/profile/me/graphs`** mindgames-parity score-over-time graphs. Per-game line / scatter, "all plays" vs "daily aggregate", aggregate z-scored cross-game view. Inline SVG.
- Achievement badges (perfect N-Back day, sub-300ms Reaction, etc.). Extends `lib/badges/icons.ts` + `eval_badges` SQL.
- `/badges` index page (locked + earned, criteria visible).
- **Pinned badges on profile** — user picks top N badges. Migration `profiles.pinned_badges text[]`.
- **Badge rarity %** — `count(distinct user_id) / count(distinct user_id with any submission)`. Refresh nightly via cron RPC.
- **Profile prestige rankings (data layer)** — fetch each user's per-game leaderboard rank (top-1/10/100 medals) + global rank. Lightly surfaced here; visual hierarchy lands in Phase 13.

### Phase 10 — Groups

- Public + private groups. Roles: owner / admin / member.
- `/g/<join_code>` deep-link. Invites by username / email / join_code.
- Public-group instant-join (request-approval deferred to Phase 16).
- Group leaderboard page; group filter on /leaderboards.

### Phase 11 — Tutorials

- First-play cutout-mask overlay per game. Auto on first play. Replay button on game ready screen. Master skip toggle.

### Phase 12 — Glicko-2 silent

- Persist Glicko rating per game on every submission. `ELO_VISIBLE=false`. Closes R2 once threshold reached.

### Phase 13 — Launch readiness

**Owns every remaining bug + risk.**

Risks:
- **R13 [HIGH]** App-level rate limit (Vercel KV / Upstash). Replaces `lib/rate-limit.ts` per-DB stopgap.
- **R16, R17 [LOW]** Fold into R13.
- **R18 [LOW]** Tighten `profiles.avatar_emoji` CHECK to a regex matching exactly one extended grapheme.
- **R1 [MED]** Anti-cheat replay tokens. Decide: ship here vs defer to Phase 16. The #58 footnote acknowledges the gap.
- **R3 [LOW]** Promote to Resolved.
- **R15 [LOW]** Document in launch runbook.

Bugs:
- **#26 [LOW]** Profile page RPC consolidation (`get_public_profile_stats`).

Other:
- **Profile prestige (visual)** — render Phase 5.5 rank data as accent medal chips next to game stats, "global rank" line in profile header, top-10-globally accent border.
- Notifications system (in-app + email digest opt-in).
- SEO: titles, meta-description, OG images, sitemap, robots.txt.
- Legal: ToS + Privacy Policy.
- Mobile pass: 375 / 414 px audit.
- Full Playwright e2e: signup → onboarding → play → submit → leaderboard → friend → group.
- Lighthouse: perf ≥ 90, a11y ≥ 95 on /today.
- Production domain + DNS + Vercel prod env.
- **Pre-launch review:** XP-per-level scaling curve. Re-tune divisor.
- **Final bug + risk audit:** zero open or each explicitly waived in `decisions.md`.

### Phase 14 — Cross-game + game expansion *(asks-pending)*

Surface options + wait before coding:
- More games (~10 total). Candidates: spatial-rotation, dual-task, paired-associate, sudoku revival.
- Game start-point selection (length-based games).
- Custom timer durations + matching leaderboard filters + per-second ranking.
- Cross-game leaderboards (streak / level / scoring factor).
- Community tab (`/community`).

### Phase 15 — Improvement score

Depends on Phase 5.5 graphs + ≥30 days population data.

- Per-game z-score delta over 30/60/90-day windows vs first-5-submissions baseline.
- Averaged across games with optional weighting toward cognitively-core 4.
- Surfaces on /profile + as "+N this month" delta on /today.

### Phase 16 — Post-launch

- Flip Glicko-2 UI when ≥ 25 users × ≥ 10 ranked/game (closes R2).
- Mind-elo + per-game elo tabs. Elo-tier badges retroactive.
- Replay-token anti-cheat (closes R1 if deferred from Phase 13).
- Multiplayer head-to-head with real opponent rating.
- Public-group request-approval flow.
- Push notifications + daily-seed timezone option.
- Wordle-style emoji result share.
- i18n. Sudoku revival.

### Phase 17 — Monetization *(traffic-gated)*

- Free: 2 games per PT day total.
- Paid: $5/mo or $50/yr (~17% off). Stripe + `profiles.subscription_status` + `subscription_period_end`.
- Daily limit on submission insert trigger.
- 7-day full-access trial on signup.
- No pay-to-win — leaderboards/streak/XP/badges unaffected.
