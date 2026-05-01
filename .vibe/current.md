# Current

`origin/main` = `b038ae1`. **Commit 6 staged** (single commit covering Phases 7.5 + 7.6 + 7.7 + 8 + optimization sweep + reviewer fixes). 210/210 vitest, typecheck/lint/build clean. Vercel auto-deploys on push.

## What ships end-to-end (post commit 6)

- Auth: email/pw + Google → `/auth/callback` → `/onboarding` (3-step) → `/today`. `/f/<code>` cookie stash auto-creates pending friendship on first onboarding submit.
- Onboarding: 3 steps — username, theme, friend-code share + copy + skip.
- 7 games. Countdown `STEP_MS=500` × 4 = 2.0s. Submit → `+N xp` + `[new PB]` → N chains to next.
- `/play/[game]`: directions modal auto-opens first time per game (localStorage-gated). Manual reopen via "directions" badge.
- `/today`: pinned > 2x > core > rest. Friends-only top-5 mini-leaderboard from `daily_aggregates`. NOT-YET-PLAYED filler. Direction badge per card. `<TodayMilestoneBanner>` for streak/PB-today/clean-sweep.
- `/leaderboards`: 7 games × Today/7d/All-time × global/friends. Anti-cheat footnote. EmptyState empty paths.
- `/friends`: incoming/outgoing/active. AddFriendForm + Toast on success/error.
- `/profile/<u>`: header (own avatar opens editor) → social buttons → badges (per-key emoji + delegated tooltip) → 90-day heatmap (delegated tooltip) → per-game grid (PB / set / low (week) / 7d median + `n=N days` / 30d plays / total plays) + score-context line `↑ +N vs 7d median`.
- `/settings`: ProfileSection avatar opens editor. Theme toggle optimistic. Public/accept-friends toggles. DangerZone ConfirmDialog.
- TopBar avatar links to own profile (no editor).
- Avatar editor: 50-emoji curated grid + free-form input + 20 colors + live preview. SVG bbox-centered glyph.
- Toast wired site-wide via `<ToastProvider>` in AppShell. DelegatedTooltips watch `data-tip` attrs.
- Dark mode `#1e242b`. Hover sweep: leaderboard tabs/scopes accent on hover; game-card hover lights both surrounding lines; modal text-align corrected; button focus-visible accent halo.

## Open bugs

| ID  | Sev | Phase | Status |
|-----|-----|-------|--------|
| #65 | LOW | 8     | open — direction-badge hover state still reads as a button fill, not a tutorial-opener; consider adding "?" suffix or restyling as info chip with hint icon. |
| #30 | MED | 9     | open — pre-submit comparison view on ResultScreen. |
| #26 | LOW | 13    | open — profile-page RPC consolidation (28 round-trips → 1). |

All Phase 7.5/7.6/7.7/8 bugs (#14, #45, #51, #52, #53, #54, #56, #58, #59, #62, #64) shipped in commit 6.

## Open risks (`0C / 1H / 2M / 6L`)

- **R13 [HIGH]** App-level rate limit (Vercel KV/Upstash) → Phase 13. Folds R16, R17.
- **R1 [MED]** Anti-cheat replay tokens → Phase 13 or 16 (decision-pending).
- **R2 [MED]** Glicko cold-start → resolves at Phase 12/16 threshold.
- **R3 [LOW]** Daily-bonus deterministic — promote to Resolved next refresh.
- **R15 [LOW]** Future-migration role grants — process risk.
- **R16, R17 [LOW]** Fold into R13.
- **R18 [LOW]** avatar_emoji DB CHECK vs grapheme validator drift.
- **R19 [LOW]** PT-DST hardcode in `today/page.tsx` — **resolved in commit 6** (24h UTC window + Intl.DateTimeFormat client filter); will move to Resolved next refresh.

**Standing rule:** Phase 13 cannot ship with any open bug or unresolved risk.

## Phase plan

- [x] 0-7 + commits 1-6 (`46637bc` polish, `c2ca5d6` Phase 7, `3d4b224` Tier 3, `b038ae1` avatar identity, commit 5 avatar polish, **commit 6 Phases 7.5/7.6/7.7/8 + optimization** staged)
- [ ] **9 result + sparkline** — #30 pre-submit, 30-day per-game score sparkline, profile heatmap toggle [plays|score]. **Persona-review priority lift: pull this ahead of 4.5/5.5.**
- [ ] **4.5 deferred** — drag pins, daily-completion sub-tab, 14-day calendar.
- [ ] **5.5 deferred** — `/profile/me/{history,graphs}` (mindgames-parity score-over-time), achievement badges, `/badges` index, pinned-badges, badge rarity %, profile prestige rankings (data layer).
- [ ] **10 groups** — public/private + roles + `/g/<code>` + leaderboard group filter.
- [ ] **11 tutorials** — first-play overlay + master skip.
- [ ] **12 silent Glicko** — persisted, `ELO_VISIBLE=false` (closes R2).
- [ ] **13 launch readiness** — owns #26, R13/R16/R17/R18, R1 (or defers), R15 runbook; notifications, SEO, legal, mobile pass, e2e, prod domain, XP curve review.
- [ ] **14 cross-game + game expansion** *(asks-pending)*.
- [ ] **15 improvement score**.
- [ ] **16 post-launch** — Glicko UI, multiplayer, push, i18n.
- [ ] **17 monetization** — Stripe, traffic-gated.

## Live state

- Supabase `nookxuvlvwtppitqguxf`: migrations 0001-0013. Single writer is `process_submission(text, numeric, boolean) → jsonb`.
- Vercel project `mindlap` linked.
- GitHub `dukesmith0/mindlap` (public). Walkthrough test user: `walkthrough@test.com` / `testpass123` (seeded with 30 days of practice via `scripts/seed-walkthrough.sql`).

## Dev workflow

```
npm run dev                                       # http://localhost:3000
node scripts/create-dev-user.mjs <email> <pw>     # gitignored
node scripts/apply-migrations.mjs <file>          # one-off Mgmt API apply
npm test | npm run typecheck | npm run lint | npm run build
```

Playwright walkthrough screenshots live in `.playwright-mcp/` (gitignored).

## Pickup order

1. **Phase 9** — pull sparkline forward per persona review. Ship trend visualization before any other deferred items.
2. **#65** — restyle direction badge so the tutorial affordance is unambiguous.
3. **Phase 4.5 / 10 / 11** in any order.

## New-session ramp-up

Read order: `current.md` → `understanding.md` → `decisions.md` → `plans.md` → `risks.md` → `bugs.md` → `future.md`. Visual ref: `.vibe/docs/style-reference/zetamac-pure.html`.
