# Current

`origin/main` = `b038ae1` (commit 4 avatar identity). Commit 5 staged: avatar centering rewrite, hover edit affordance, curated emoji picker, TopBar avatar reverted to plain profile link, all Tier 1/2/3 design calls resolved, `.vibe` consolidated. 202/202 vitest. Vercel auto-deploys on push.

## What ships end-to-end

- Auth: email/pw + Google. `/auth/callback` → `/onboarding` → `/today`. `/f/<code>` cookie stash auto-creates pending friendship on first onboarding submit.
- 7 games. 3-2-1 countdown 600ms × 4 = 2.4s (→ 500ms in Phase 7.6). Submit → `+N xp` + `[new PB]` → N chains to next.
- `/today`: pinned > 2x > core > rest. Friends-only top-5 mini-leaderboard with overflow self-row in accent. NOT-YET-PLAYED accent filler when user hasn't played.
- `/leaderboards`: Today/7d/All-time × 7 games × global/friends scope toggle. Avatar + clickable username. Empty-state CTA links to /friends.
- `/friends`: incoming/outgoing/active. AddFriendForm accepts @username or 8-char code.
- `/profile/<u>`: header (own-profile avatar opens editor) > social buttons > badges > 90-day heatmap > per-game grid. Sparse for private.
- `/settings`: Profile (avatar opens editor) / Preferences (theme + skip-tutorials) / Account / Password / Delete.
- TopBar avatar: routes to own profile (clicking does NOT open the editor).
- Avatar editor: 50-emoji curated grid + free-form input + 20-color swatch palette. Hover blur + EDIT overlay. Single-grapheme NFC validation.
- Dark mode `#1e242b` VS-Code-ish.

## Open bugs (13 total — all decided or open + phased)

| ID | Sev | Phase | Status |
|----|-----|-------|--------|
| #14 | MED | 8 | decided — step-fn breakpoints |
| #26 | LOW | 13 | open |
| #30 | MED | 9 | open |
| #45 | MED | 8 | decided — single delegated tooltip bubble |
| #51 | MED | 7.5 | decided — TodayMilestoneBanner |
| #52 | MED | 7.5 | decided — text context line |
| #53 | MED | 7.6 | decided — keep date, rename worst → "low (week)" |
| #54 | MED | 7.5 | decided — direction badge + popup auto on first play |
| #56 | LOW | 7.5 | decided — 3rd onboarding step |
| #58 | MED | 7.7 | decided — anti-cheat footnote |
| #59 | MED | 8 | decided — Toast primitive |
| #62 | LOW | 7.6 | decided — STEP_MS=500 |
| #64 | LOW | 8 | deferred — folds into Modal primitive |

## Open risks (`0C / 1H / 2M / 5L`) — all phased

- **R13 [HIGH]** → Phase 13 (Vercel KV / Upstash app-level rate limit). Folds R16 + R17.
- **R1 [MED]** anti-cheat replay tokens → Phase 13 or 16 (decision-pending).
- **R2 [MED]** Glicko cold-start → resolves naturally at Phase 12 / 16 threshold.
- **R3 [LOW]** daily-bonus cron → already deterministic; promote to Resolved next refresh.
- **R15 [LOW]** future-migration role grants → process risk, runbook entry in Phase 13.
- **R16 [LOW]** side-client password-grant rate sharing → folds into R13 (Phase 13).
- **R17 [LOW]** per-user submission spam → folds into R13 (Phase 13).
- **R18 [LOW]** avatar_emoji DB CHECK vs grapheme-validator drift → tighten in Phase 13.

**Standing rule:** Phase 13 cannot ship with any open bug or unresolved risk.

## Phase plan

- [x] Phases 0-7 + commits 1-4 (`46637bc`, `c2ca5d6`, `3d4b224`, `b038ae1`)
- [x] Commit 5 avatar polish + `.vibe` consolidation (staged)
- [ ] **7.5 newcomer experience** — #51 + #52 + #54 + #56
- [ ] **7.6 daily-user friction** — #62 + #53
- [ ] **7.7 trust** — #58
- [ ] **8 design system + polish** — Toast (#59), Modal (#64), tooltips (#45), Digit Span (#14), EmptyState, FormField, ConfirmDialog, relative-date, tier-colors
- [ ] **9 result + sparkline** — #30 pre-submit comparison, 30-day score sparkline, profile heatmap toggle [plays|score]
- [ ] **4.5 deferred** — drag pins, Daily Completion sub-tab, 14-day calendar
- [ ] **5.5 deferred** — `/profile/me/{history,graphs}` (mindgames-parity score-over-time graphs), achievement badges, `/badges` index
- [ ] **10 groups** — public/private + roles + `/g/<code>` + leaderboard group filter
- [ ] **11 tutorials** — first-play overlay + master skip
- [ ] **12 silent Glicko** — persisted, ELO_VISIBLE=false (closes R2)
- [ ] **13 launch readiness** — owns #26, R13/R16/R17/R18, R1 (or defers), R15 runbook; notifications, SEO, legal, mobile, e2e, prod domain, XP curve review
- [ ] **14 cross-game + game expansion** *(asks-pending)*
- [ ] **15 improvement score** — z-score delta, +N this month
- [ ] **16 post-launch** — flip Glicko (closes R1 fully if deferred), multiplayer, push, i18n
- [ ] **17 monetization** — Stripe, traffic-gated

## Live state

- Supabase `nookxuvlvwtppitqguxf`: migrations 0001-0013. Single writer for submissions + daily_aggregates is `process_submission(text, numeric, boolean) → jsonb`.
- Vercel project `mindlap` linked.
- GitHub `dukesmith0/mindlap` (public).

## Dev workflow

```
npm run dev                                       # http://localhost:3000
node scripts/create-dev-user.mjs <email> <pw>     # gitignored; needs SUPABASE_SERVICE_ROLE_KEY in .env.local
node scripts/apply-migrations.mjs <file>          # one-off Mgmt API apply
npm test | npm run typecheck | npm run lint | npm run build
```

## Pickup order

1. **Phase 7.5** (4 newcomer items) — biggest goal-alignment gain. All decided.
2. **Phase 7.6** (#62 + #53) — quick wins, both decided.
3. **Phase 7.7** (#58) — single line of copy.
4. **Phase 8** primitives + #14 + #45 + #59 + #64.
5. **Phase 9** sparkline + ResultScreen pre-submit comparison.

Read order for new sessions: `current.md` → `understanding.md` → `decisions.md` → `plans.md` → `risks.md` → `bugs.md` → `future.md`. Visual ref: `.vibe/docs/style-reference/zetamac-pure.html`.
