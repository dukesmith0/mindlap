# Future

mindlap v1: streak / PB / badges + raw-score leaderboards + friends / groups + new-user flow + Supporter tier. Glicko silent until threshold. Phase 19 closes every open bug + risk before public launch.

## Phase 10 — Flow B: anti-cheat infrastructure

- [ ] Migration: `pending_claims` table (anon score storage; columns `id, anon_session_id, game_key, score, played_at, expires_at`; 5-min TTL row; RLS denies all by default; service-role only).
- [ ] `lib/game-session.ts` — server-issued JWT (sign + verify) carrying `{ game_key, seed, user_or_anon_id, issued_at, expected_duration }`. TTL = duration + 30s.
- [ ] `app/api/game/start/route.ts` — POST returns `{ session_jwt, seed }`. Authed and anon both accepted; session id minted into anon cookie if absent.
- [ ] `app/api/game/submit/route.ts` — POST validates 5 gates: (1) JWT signature + expiry, (2) duration ≈ expected ±0.5s, (3) input_count plausible vs game floor/ceiling, (4) score ≤ humanly-possible cap, (5) score achievable from seed.
- [ ] Per-game seed-to-score plausibility checker for math, digit, n-back, stroop, reaction, mine, word recall.
- [ ] Authed path feeds `process_submission`; anon path writes `pending_claims` row.
- [ ] Rate limit on `/api/game/start` and `/api/game/submit` (per-IP for anon, per-user for authed).
- [ ] **R1** post-launch replay-token noted as upgrade path; not v1.

## Phase 11 — Flow C: anon-friendly /play + landing rewrite

- [ ] Drop auth gate on `/play/<game>` for anon visitors (`proxy.ts` matcher update + `isPublicPath` patch).
- [ ] Anon session cookie (`mindlap_anon_session`, httpOnly + sameSite=lax + secure-in-prod) for play tracking + cap counting.
- [ ] 2-plays-per-PT-day cap enforced server-side in `/api/game/start`; counter resets midnight LA. 3rd attempt returns "daily anon limit hit. sign up to keep playing." with sign-up CTA.
- [ ] Ghost-rank computation: live percentile vs `daily_aggregates` for anon scores; never inserts.
- [ ] Score-screen ghost-rank line: `you'd rank #N of M on today's board · beats X% of players`.
- [ ] **#76** Landing page rewrite (`app/page.tsx`): layout B — tagline + 3 goal bullets + 7 game tiles (name + one-line description) + "play any game free — no signup needed" CTA.

## Phase 12 — Flow D: auth UI + claim path

- [ ] Single auth component (`components/auth/AuthSheet.tsx`) — mode toggle for signin/signup; used in score-sheet modal + `/login` + `/signup`.
- [ ] Score-claim cookie (`mindlap_score_claim`, httpOnly + sameSite=lax + secure-in-prod, 5-min TTL, signed): carries `pending_claims.id`; survives OAuth round-trip.
- [ ] `/auth/callback` consumes claim cookie → migrates `pending_claims` row to `submissions` via `process_submission`; toast on /today: `score claimed · streak started`.
- [ ] OAuth username-only step: post-Google-callback first-time users land on `/onboarding/username` (single field), then `/today`.
- [ ] Strip `/onboarding` to username-only; remove theme + friend-code steps; defaults applied automatically; users edit in `/settings`.
- [ ] Email verification soft-gate: account works immediately; dismissible banner reminds; verification gates only password reset and outbound emails.
- [ ] Inline auth failure modes: wrong password, no account for email, OAuth canceled, claim cookie expired (graceful toast), username taken (with 2 alt suggestions).
- [ ] Resolve open question: `email already registered (signup)` inline error vs prior anti-enumeration decision. Pick one before this phase ships.
- [ ] **#77** Onboarding CLI-style copy de-CLI pass (covered by username-only rewrite).
- [ ] **#92** `signInAction` opaque error (folded into single-component refactor).

## Phase 13 — Flow E: Supporter tier

- [ ] Stripe Checkout setup. New env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`.
- [ ] Migration: `profiles.subscription_status text` + `profiles.subscription_period_end timestamptz` (status enum: `none | active | canceled | past_due`).
- [ ] `/supporter` upgrade flow (Checkout redirect; webhook flips `subscription_status`).
- [ ] $50/yr price added at this phase (was static `/supporter` page in Phase 9).
- [ ] Supporter feature gates: forever detail history (vs 90-day prune for free), all-time leaderboard percentile/z columns, advanced graphs, CSV/JSON export, jump-start staircase games, small username flair, ≥3 pinned badges.
- [ ] `<UpsellSheet>` primitive — only at moment-of-friction (CSV button, all-time history scroll, cross-game graph tab, custom-pin slot >3, jump-start setting). Never ambient.
- [ ] Jump-start opt-in setting per game (Digit Span, N-Back, Word Recall) wired into game-start payload.
- [ ] `/settings` cancel one-click; no retention dialog; data retained 90 days post-cancel.

## Phase 14 — Flow F: review + cleanup (rolling, after each prior phase)

- [ ] Dead-code prune per phase (depcruise + manual sweep); reviewer fixes folded back.
- [ ] `debug/` harnesses for new flows: anon-play, claim, signup, score, today first-visit, daily loop.
- [ ] Security review per phase: CSP (`/api/game/*` and Stripe origins), RLS on `pending_claims` + `subscription_status`, JWT secret rotation policy, rate limits across new endpoints.
- [ ] Playwright smoke tests: landing → anon play → ghost rank → claim → /today → daily loop.
- [ ] Update `.vibe/understanding.md` per phase to reflect shipped state.

## Phase 4.5 — Original Phase 4 follow-ups deferred from the v1 cut

- [ ] Drag-reorder pins on `/today`.
- [ ] Daily Completion sub-tab on `/leaderboards`.
- [ ] 14-day double-XP calendar widget.
- [ ] Group filter on `/leaderboards` (gated on Phase 16).

## Phase 5.5 — Profile expansion + badges

- [ ] `/profile/me/history` table view + CSV export.
- [ ] `/profile/me/graphs` — mindgames-parity score-over-time (per-game line / scatter, all-plays vs daily aggregate, z-scored cross-game). Inline SVG.
- [ ] Achievement badges (perfect N-Back day, sub-300ms Reaction, etc.) extending `lib/badges/icons.ts` + `eval_badges` SQL.
- [ ] `/badges` index page (locked + earned, criteria visible).
- [ ] Pinned badges on profile (migration `profiles.pinned_badges text[]`).
- [ ] Badge rarity % via nightly cron RPC.
- [ ] Profile prestige rankings — data layer (per-game rank fetch, top-1/10/100 medals).

## Phase 15 — Trend visualization (deferred from original Phase 9)

- [ ] Badge-earn celebration chip on ResultScreen (`process_submission` JSON return already carries events).
- [ ] 30-day per-game score sparkline (`components/profile/ScoreSparkline.tsx`, inline SVG).
- [ ] Profile heatmap toggle `[plays | score]` via `?view=` searchParam (default `plays`).
- [ ] 30d-vs-prior-30d delta line under each per-game card (reuses already-fetched data).

## Phase 16 — Groups (was Phase 10)

- [ ] Public + private groups; owner / admin / member roles.
- [ ] `/g/<join_code>` deep-link + cookie stash on anon click.
- [ ] Invites by username / email / join_code.
- [ ] Public-group instant-join (request-approval deferred to post-launch).
- [ ] Group leaderboard page.
- [ ] Group filter on `/leaderboards`.
- [ ] **#111** Re-expose Sidebar "Groups" nav item (hidden until Phase 16 ships).

## Phase 17 — Tutorials (was Phase 11)

- [ ] First-play cutout-mask overlay per game.
- [ ] Auto-open on first play.
- [ ] Replay button on game ready screen.
- [ ] Master skip toggle in `/settings`.

## Phase 18 — Glicko-2 silent (was Phase 12)

- [ ] Persist Glicko rating per game on every submission.
- [ ] `ELO_VISIBLE=false` (progresses **R2** toward natural close at threshold).

## Phase 19 — Launch readiness; owns every remaining bug + risk (was Phase 13)

- [ ] **R13** App-level rate limit (Vercel KV / Upstash); folds R16 + R17.
- [ ] **R22** `daily_aggregates` schema patch — add `stddev`, `p25`, `p75`, `n_submitted`; backfill from `submissions`. Pairs with **#97**.
- [ ] **R25** Cross-game normalization data layer — `game_population_stats` table + nightly cron RPC.
- [ ] **R21** Standardize `set search_path = public, extensions` across every SECURITY DEFINER plpgsql.
- [ ] **R23** Tighten `0011_friend_by_username` regex to lowercase-only or normalize input.
- [ ] **R24** Defense-in-depth deny policies on `submissions` UPDATE/DELETE; DELETE policy on `profile_secrets`.
- [ ] **R15** Migration role-grants runbook entry.
- [ ] **R18** Tighten `profiles.avatar_emoji` CHECK to a single-grapheme regex.
- [ ] **R3** Promote to Resolved.
- [ ] **R19** Move to Resolved (DST hardcode fixed in commit 6).
- [ ] **#26** Profile-page RPC consolidation (~35 RTTs → 1 via `get_public_profile_stats`).
- [ ] **#68** Real `README.md` covering install / env / dev / migration / `.vibe`.
- [ ] **#69** Add `error.tsx` / `loading.tsx` / `not-found.tsx`.
- [ ] **#70** AppShell duplicate-fetch fix via `React.cache` helper.
- [ ] **#71** `DelegatedTooltips` off `pointermove` → `pointerover/pointerout` delegation.
- [ ] **#72** Math mobile minus key (verify generator first).
- [ ] **#73** MineGame mobile flag affordance.
- [ ] **#74** Leaderboards 2000-row truncation fix.
- [ ] **#96** 7d median sample-size floor (gate at n ≥ 4).
- [ ] **#97** Median-of-medians fix (paired with R22).
- [ ] **#79** CI workflow + branch protection + secret-prefix pre-commit hook.
- [ ] **#80** PR template + CONTRIBUTING.md.
- [ ] **#81** Playwright config + smoke test, or remove `test:e2e`.
- [ ] **#82** Document Mgmt-API migration path; remove unused `supabase` devDep.
- [ ] **#83** Friend-request count on Sidebar.
- [ ] **#84** MineGame timer ref + decoupled `<TimerDisplay>`.
- [ ] **#85** ResultScreen `R` after submit.
- [ ] **#86** Sidebar → RSC.
- [ ] **#87** Zod-wrap raw-boolean settings actions.
- [ ] **#88** Dead-export prune + `unused-imports` ESLint rule.
- [ ] **#89** Stable keyboard handlers in ResultScreen / ReactionGame / StroopGame.
- [ ] **#90** `Countdown.onDone` `useCallback`.
- [ ] **#91** NBackGame button-wrap a11y.
- [ ] **#93** Drop `is_bonus_game` RPC param; derive inside.
- [ ] **#94** Promote daily 2× XP to milestone-banner rotation.
- [ ] **#95** Jargon copy pass.
- [ ] **#99** Sidebar "soon" badge color (`var(--line)` → `var(--muted)`).
- [ ] **#100** Onboarding step 3 inbound add-friend input — re-evaluate after onboarding strip in Phase 12; may be obsolete.
- [ ] **#101** TodayCard username overflow ellipsis.
- [ ] **#102** Generate Supabase types; remove `as unknown as` ladders.
- [ ] **#103** `tier-colors.ts:rankColor` comment fix.
- [ ] **#104** Re-enable `typedRoutes` or remove TODO.
- [ ] **#105** `npm outdated` dep refresh.
- [ ] **#106** `find_user_by_friend_code` case-insensitive.
- [ ] **#107** Pre-commit hook (pairs with #79).
- [ ] **#108** Profile single-play "play these next" view.
- [ ] **#109** Pin button glyph + label.
- [ ] **#110** Countdown "get ready" subtitle.
- [ ] **#111** Hide Sidebar "Groups (soon)" until Phase 16 ships.
- [ ] XP-per-level curve retune — capped scaling target ~level 100 cap, 2-3 days/level at top. Simulation-driven; cannot break persisted XP.
- [ ] Cookie consent banner — lightweight, one-time dismiss, privacy-first. Tracking scope: games, traffic, profiles, sign-ins (internal). No third-party analytics.
- [ ] `/friends` inline empty-state → `<EmptyState>` primitive.
- [ ] Promote `.vibe/docs/style-reference/style-page.html` to a live `/style` route in the Next.js app so it imports `app/globals.css` directly. Static HTML rots; live route stays accurate.
- [ ] Profile prestige (visual) — accent medal chips, "global rank N worldwide" header, rare-rank accent border.
- [ ] Notifications system (in-app + email digest opt-in).
- [ ] SEO: titles, meta-description, OG images, sitemap.xml, robots.txt.
- [ ] Legal: ToS + Privacy Policy.
- [ ] Mobile pass: 375 / 414 px audit.
- [ ] Full Playwright e2e suite (signup → onboarding → play → submit → leaderboard → friend → group).
- [ ] Lighthouse: perf ≥ 90, a11y ≥ 95 on `/today`.
- [ ] Production custom domain + DNS + Vercel prod env (domain TBD — see Open Questions).
- [ ] Final bug + risk audit — zero open or each waived in `decisions.md`.

## Post-launch — by-type backlog, no internal ordering

- [ ] More games (slate decided when phase scopes): spatial-rotation, dual-task, paired-associate, sudoku revival.
- [ ] Game start-point selection (length-based games like Digit Span).
- [ ] **R2** Glicko-2 UI flip when ≥ 25 users × ≥ 10 ranked submissions/game.
- [ ] Mind-elo + per-game elo tabs.
- [ ] Elo-tier badges retroactive.
- [ ] Custom timer durations + matching leaderboard filters.
- [ ] Per-second ranking on custom-timer leaderboards.
- [ ] Cross-game leaderboards (streak / level / scoring factor — composite picked at scope-time).
- [ ] Percentile + z columns on leaderboards (visual surface; data layer R25 lands pre-launch).
- [ ] Sticky "your row" with rank + percentile + z.
- [ ] Multiplayer head-to-head with real opponent rating.
- [ ] Public-group request-approval flow.
- [ ] Community tab `/community` — minimal: player search → public profile → add friend.
- [ ] Push notifications.
- [ ] Daily-seed timezone option.
- [ ] Wordle-style emoji result share.
- [ ] i18n.
- [ ] Improvement score v1 — population-aware z-score delta over 30/60/90d windows vs first-5-submissions baseline. Surface as "+N this month" delta.
- [ ] Domain rollup card on profile (group 7 games into 2-3 cognitive domains).
- [ ] **R1** Replay-token system — closes the integrity gap at launch.
- [ ] **R26** Submission index timing oracle — revisit at population scale.

## Inbox

- `<PendingOverlay>` / `.is-pending` utility — unify ResultScreen + button pending states. Decide phase or drop.
- Heatmap default flip from `[plays]` → `[score]` once sparkline lands. Need explicit cutover criterion.
- Cognitive-domain taxonomy (2-3 buckets across the 7 games) — needed before the post-launch domain rollup card can be built.

## Open Questions

1. **Cognitive-domain taxonomy.** What 2-3 domains map cleanly across the 7 games? (working memory / processing speed / attention?) Blocks domain rollup card.
2. **Heatmap default cutover.** What's the explicit signal for switching default `?view=` from `plays` to `score`?
3. **`<PendingOverlay>` / `.is-pending` utility.** Build it (Phase 19 polish) or drop and inline per-component?
4. **Production custom domain.** What's the domain? Phase 19 needs the pick before DNS + Vercel prod env can be wired.
5. **Bug-feedback channel.** GitHub issues only, or `feedback@<domain>` mailto in footer too? Need the address if so.
6. **Streak grace period.** Currently locked as "no grace, resets on missed day." Worth re-litigating for retention before public launch?
7. **TopBar on `/play/[game]` — drop entirely or freeze the streak pulse?** Streak ribbon pulses every 2s in peripheral vision during focus games.
8. **`plays_total` retry tracking — start counting unsubmitted retries?** `process_submission` only increments `plays_submitted`. Tracking would expose cherry-picking but adds RPC + reveals retry behavior.
9. **PB date with no recency context.** Options: (a) `PB (set N days ago)`, (b) `PB ± SE` against population sd, (c) flag PBs from days with `n_submitted=1` as "single play".
10. **`CLAUDE.md` template-share strategy.** Now tracked. Do we also ship a `.claude/settings.json` baseline + per-dev `settings.local.json`?
11. **Heatmap-summing-7-games.** Options: (a) facet per-game, (b) dual encoding (saturation = plays, hue = mean game-level z; needs R25 first), (c) leave as-is.
12. **Anti-enumeration vs auth-clarity tension.** Prior decision: signup treats "already registered" as success silently. New flow: inline `email already registered` error toggles signin mode. Pick one before Phase 12 ships. Options: (a) keep anti-enumeration, drop the inline error (use generic "check your email" messaging); (b) drop anti-enumeration, keep clear inline error; (c) hybrid — generic error with rate limit on signup attempts to deter probing.
