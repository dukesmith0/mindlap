# Current

Active: Commits 1-3 landed (`46637bc` polish + `c2ca5d6` Phase 7 + `3d4b224` Tier 3 polish). Commit 4 (avatar identity rework #48) staged on disk, ready to commit: migration 0013, AvatarEditor modal, click-to-edit on TopBar + own-profile + settings, color picker removed from /settings Preferences, AvatarColorPicker.tsx deleted, 202/202 tests pass. New bug #64 filed (modal focus trap + scroll lock, deferred). New risk #R18 filed (DB CHECK vs grapheme validator drift, self-inflicted only). Vercel auto-deploys on push.

## What works end-to-end (post commit 2 staging)
- Sign up email/pw or Google -> email confirm -> `/auth/callback` -> `/onboarding` -> `/today`. If the user landed on `/f/<code>` first, the friend code is stashed and a pending friendship is auto-created on first onboarding submit.
- All 7 games playable. Countdown 600ms x 4 (equal). Submit -> `+N xp` + `[new PB]` -> `N` chains to next.
- `/today`: pinned > 2x > core > rest, friends-only mini-leaderboard top-5 + overflow self row (accent) below each card. Cards the user hasn't played show a "NOT YET PLAYED" accent filler instead of the leaderboard.
- `/leaderboards`: Today/7d/All-time x 7 game tabs x [global / friends] scope toggle. Friends scope filters to `{me + accepted friends}`; empty-state CTA links to `/friends` for anon or no-friend users. Rows render avatar + clickable username link.
- `/friends`: incoming / outgoing / active sections, each row with state-aware actions (accept/decline, cancel, remove). AddFriendForm at the top accepts @username OR 8-char friend code.
- `/f/[code]`: public deep-link page. Anon -> stash code in cookie + signup CTA. Authed -> sends request and redirects to /friends.
- `/profile/<username>`: header > social buttons (state-aware: add / cancel / accept+decline / remove / blocked / opt-out filler) > badges (per-key emoji) > 90-day heatmap > per-game grid (PB / set / worst / 7d median / 30d plays / total plays). Sparse render for private profiles.
- `/settings`: Profile / Preferences / Account (now with public-profile + accept-friend-requests toggles) / Password / Delete. Theme toggle is optimistic (instant <html data-theme> swap with rollback on action failure). DELETE in red. Back-to-today nav above the h1.
- Sidebar: Friends item now enabled.
- Dark mode background lifted to VS Code-ish `#1e242b` with brighter `--line`/`--muted` for contrast.
- 192/192 vitest passing across 20 files (added `debug/friend-code-cookie.test.ts`).

## Open bugs
- #64 [LOW] AvatarEditor modal lacks focus trap + body scroll lock. Defer until a second modal lands.
- #62 [LOW] Countdown 2.4s × 7 = ~17s waiting. Decision-pending: STEP_MS=400 vs skip toggle.
- #59 [MED] Server-action error toast/inline pattern missing. Decision-pending.
- #58 [MED] Anti-cheat disclaimer on /leaderboards. Decision-pending tone.
- #56 [LOW] Friends not surfaced during onboarding. Decision-pending: 3rd step vs post-arrival nudge.
- #54 [MED] Game taglines on /today don't say direction. Decision-pending tone.
- #53 [MED] Profile per-game grid: `worst` + `set` columns. Decision-pending.
- #52 [MED] Score-context line under per-game stats missing. Decision-pending: text vs arrow indicators.
- #51 [MED] No Day-1 win for newcomers. Decision-pending: milestone banner vs hide leaderboards.
- #45 [MED] Themed tooltips for badges + heatmap (single delegated hover bubble).
- #30 [MED] Pre-submit comparison view on ResultScreen.
- #26 [LOW] Profile RPC consolidation (Phase 11).
- #14 [MED] Digit Span overflow at length 10+. Needs design call.

## Open risks (`0C / 1H / 2M / 5L`)
- R13 [HIGH] No app-level rate limit on auth endpoints. Phase 11. Phase 7 friend-request DB-counter is a stopgap that folds under R13.
- R1, R2 [MED] Anti-cheat deferred; Glicko cold-start unstable.
- R3, R15, R16, R17, R18 [LOW] Daily-bonus cron, future-migration grant regression, side-client password-grant rate sharing, per-user submission spam, DB-CHECK vs grapheme-validator drift on avatar_emoji.

## Phase plan
- [x] Phase 0 scaffold
- [x] Phase 1 auth + profiles + onboarding + settings + privacy + hard-delete
- [x] Phase 1.5 reset/change password
- [x] Phase 2 game shell + 4 core games
- [x] Phase 3 remaining 3 games
- [x] Phase 4 essentials
- [x] Phase 5 essentials
- [x] Phase 6 XP + badges
- [x] Polish batch commit (commit 1, `46637bc`)
- [x] Phase 7 friends + #41 reframe + #47 social (commit 2, `c2ca5d6`)
- [x] Tier 3 polish (commit 3, `3d4b224`)
- [x] Avatar identity rework #48 (commit 4, staged)
- [ ] Phase 4.5 follow-up: drag-reorder pins, Daily Completion sub-tab, 14-day calendar widget
- [ ] Phase 5.5 follow-up: 30-day SVG sparkline, /profile/me/{history,graphs} + CSV export, achievement badges
- [ ] Phase 8 groups (public/private + roles + /g/<join_code>)
- [ ] Phase 9 tutorials
- [ ] Phase 10 silent Glicko surface
- [ ] Phase 11 launch readiness (rate limiting, notifications, SEO, legal, mobile pass, full e2e, prod domain)
- [ ] Phase 12 (post-launch) elo flip when ≥25 users × ≥10 ranked/game

## Dev workflow
```
npm run dev                                       # http://localhost:3000
node scripts/create-dev-user.mjs <email> <pw>     # gitignored; needs SUPABASE_SERVICE_ROLE_KEY in .env.local
node scripts/apply-migrations.mjs <file>          # one-off migration apply via Mgmt API
npm test | npm run typecheck | npm run lint | npm run build
```

## Live state
- Supabase project `nookxuvlvwtppitqguxf`: migrations 0001-0013 applied. `process_submission(text, numeric, boolean) -> jsonb` is the only writer for submissions and daily_aggregates. `find_user_by_friend_code` and `find_user_by_username` (0011) handle friend-add lookups. `profiles.accepts_friend_requests` (0012) gates inbound requests. `profiles.avatar_emoji` (0013) optional single-grapheme glyph for avatars.
- Vercel project `mindlap` linked. Env vars unchanged.
- GitHub: `dukesmith0/mindlap` (public). Latest `origin/main` = `46637bc`.

## Pending design calls (open questions to settle before coding)

Surfaced by 6 adversarial reviews (3 user personas + UI/UX pro max + frontend design + security/risks) on 2026-04-29 after commit 2 (`c2ca5d6`). Each item is a question — read CLAUDE.md "Ask before guessing on unanswered implementation questions": surface 2-3 options and wait for the user before building.

**Tier 1 — strikes the goals (low friction / easy / informative / intuitive) hardest:**
- **Day-1 win for newcomers (#51).** Empty heatmap + streak 0 + "47/50 in Math" first-leaderboard visit is demoralizing. *Question:* Do we surface a "first-streak / first-PB / first-game-of-the-day" milestone banner at the top of /today, OR is a `<TodayMilestoneBanner>` too cute and we should instead just hide leaderboards entirely on Day 1? Personas 1+2.
- **Heatmap is activity, not improvement (#42 already filed for build, but goal is questioned).** Heatmap shows play-count, not score trend. *Question:* Keep heatmap as activity surface AND add a per-game 30-day score sparkline (Phase 5.5), OR replace heatmap with the sparkline outright? Personas 2+3 + UI/UX.
- **No score interpretability (#52).** `PB 47` for N-Back accuracy is meaningless without context. *Question:* Do we render a small context line under each value ("↑ above your 7d median"), arrow-only indicators, or wait for population z-scores in Phase 12? Persona 3 + UI/UX.
- **Game taglines don't say direction (#54).** "Speed Math" alone doesn't tell a newcomer higher=better. *Question:* Extend the `lib/games/registry.ts` taglines to include direction + a one-line example, OR add a separate "direction" badge on each card, OR leave as-is and rely on the start screen? Persona 1.
- **Friends not surfaced during onboarding (#56).** No "share your code" prompt; new users land lonely. *Question:* Add a 3rd onboarding step (friend-code share with skip CTA), OR a one-time post-onboarding banner on /today, OR an in-app email "your friend code is ABCD2345 — share it with a friend"? Persona 1.

**Tier 2 — friction that compounds for daily users:**
- **Profile page round-trips (~28).** Already filed as `#26` for Phase 11 RPC consolidation. No question pending; tracked.
- **Per-game grid `worst` and `set` columns are low-signal (#53).** *Question:* Drop `worst` outright, hide behind a details toggle, OR keep but rename to "low this week" so it's bounded? And replace `set` (absolute date) with relative ("47 days ago"), drop entirely, or keep? Persona 2.
- **Countdown is 2.4s × 7 games = ~17s of waiting for chained play (#62).** *Question:* Reduce STEP_MS from 600 to 400 (1.6s total countdown), add a "skip countdown" toggle in /settings persisted to a new `profiles.skip_countdown` column, OR leave countdown timing alone and fix elsewhere? Persona 2.
- **Streak multiplier rewards consistency over skill.** A 100-day streak gets ×2.5 XP for a half-effort play. *Question:* Decouple streak from XP multiplier (make streak cosmetic + only PB awards XP), OR keep as-is until population data exists, OR introduce a separate "skill streak" (consecutive PB days) alongside the play streak? Persona 3. Defer to its own commit; needs decision before any tuning.
- **Anti-cheat undisclosed on leaderboards (#58).** Scores aren't replay-verified (R1). *Question:* Show a small "scores are user-reported; anti-cheat verification arrives in Phase 12" footnote on /leaderboards, OR stay silent until replay tokens land? Persona 3.

**Tier 3 — design system + polish (5 shipped in commit 3, remainders below):**
- ~~#46 profile header centering~~ shipped commit 3.
- ~~#55 DangerZone red warning~~ shipped commit 3.
- ~~#57 username 30-day lock onboarding warning~~ shipped commit 3.
- ~~#60 ResultScreen aria-busy + visual dim~~ shipped commit 3.
- ~~#61 light-mode heatmap CSS~~ shipped commit 3.
- **Heatmap day-of-week axis labels.** Folds into #45 (themed tooltips on badges + heatmap). No question pending.
- **Server-action error toast / inline error (#59).** *Question:* Build a `<Toast>` primitive (1px accent border, 4s auto-dismiss) and surface action errors there, OR use inline-under-button errors per consumer, OR a top-of-page banner? Frontend + UI/UX.
- **No reusable error/empty-state/pending/modal/form-field primitives.** Tracked in future.md as a design-system buildout. *Question:* Invest now (small commit) or wait until Phase 8 groups multiplies the duplication?

When you pick any of these up: re-read CLAUDE.md, surface the options, and wait for the answer before coding.

## New-session ramp-up
Read in order: `.vibe/current.md` -> `understanding.md` -> `decisions.md` -> `plans.md` -> `risks.md` -> `bugs.md` -> `future.md`. Visual ref: `.vibe/docs/style-reference/zetamac-pure.html`.

Pick-up candidates after commit 2 lands: tackle "Pending design calls" Tier 1 items first (highest goal alignment), then Tier 3 ready-to-ship polish, then #48 avatar identity rework, then #45 themed tooltips, then Phase 4.5 / 5.5 follow-ups, then Phase 8 groups.
