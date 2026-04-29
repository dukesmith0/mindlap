# Current

Active: Polish batch (commit 1) staged but not committed yet. Phases 0/1/1.5/2/3/4-essentials/5-essentials/6 plus today's polish sweep + 90-day heatmap + theme-toggle optimistic-flip are on disk. Last shipped commit is `a1c083a`. Vercel will auto-deploy on commit 1 push. Commit 2 (Phase 7 friends + #41 friends-only Today mini-leaderboard reframe) is the next batch.

## What works end-to-end (commit 1 staged)
- Sign up email/pw or Google -> email confirm -> `/auth/callback` -> `/onboarding` -> `/today`.
- All 7 games playable: 3-2-1-Go countdown (600ms per step, equal timing) -> game -> result -> Enter to submit -> `+N xp` + `[new PB]` indicator -> `N` to chain to the next game.
- `process_submission` RPC writes the submission, upserts daily_aggregates, updates streak/longest/total_submitted, awards xp_events (participation cap + PB bonus * streak_mult * 2x), grants streak/PB/all-seven badges.
- `/today`: pinned > 2x > core > rest, top-3 leaderboard preview per card (gets reframed to friends-only top-5 in commit 2), click-to-pin, search input right-aligned with the play column.
- `/leaderboards`: Today/7d/All-time x 7 game tabs; rows now render avatar disc + clickable username link; long usernames ellipsize.
- `/profile/<username>`: header > badges (with per-key emoji) > 90-day heatmap (13x7 grid, 4 intensity buckets) > per-game card (6-column grid: PB / set / worst / 7d median / 30d plays / total plays). Sparse render for private profiles.
- `/settings`: back-to-today nav link; Profile / Preferences / Account / Password / Delete sections; theme toggle flips instantly (optimistic dataset write + server-side persist + rollback on failure); DELETE ACCOUNT heading + button render in red (`#d62828`).
- Reset password: forgot-pw email -> `/auth/callback?next=/auth/set-password` (sets recovery cookie) -> `/auth/set-password` (gated by cookie) -> save -> `/today`.
- `*` core-game indicator now surfaces a zetamac-pure tooltip on hover/focus.
- Streak ribbon: only the 🔥 emoji pulses; number + "days" stay steady.
- Favicon: `app/icon.svg` with prefers-color-scheme accent swap (light #0066cc / dark #5aa3ff).

## Open bugs (4)
- #41 [LOW] Reframed: keep the Today mini-leaderboard but scope to friends-only top-5; if my today score is outside the top-5, append `...` then a row with my rank + name + score; my row in accent. Ships in commit 2 (Phase 7) since it depends on friend IDs.
- #30 [MED] Pre-submit comparison view on ResultScreen (PB/worst/7d-median/leaderboard delta with green +N / red -N). Bigger feature; deferred. Needs a `getPreSubmitContext(game_key, score)` Server Action.
- #26 [LOW] /profile/<username> does ~28 supabase round-trips. Acceptable for v1; collapse to one `get_public_profile_stats` RPC in Phase 11.
- #14 [MED] Digit Span overflows column at length 10+. Needs design call before fix.

## Open risks (`0C / 1H / 2M / 4L`)
- R13 [HIGH] No app-level rate limit on auth endpoints. Block before public launch (Phase 11). Phase 7 friend-request rate limit is a per-user-DB-row stopgap that folds under R13.
- R1, R2 [MED] Anti-cheat deferred; Glicko cold-start unstable.
- R3, R15, R16, R17 [LOW] daily-bonus cron, future-migration grant regression, side-client password-grant rate sharing, per-user submission spam. All fold into Phase 11.

## Phase plan
- [x] Phase 0 scaffold
- [x] Phase 1 auth + profiles + onboarding + settings + privacy + hard-delete
- [x] Phase 1.5 reset/change password (recovery-cookie crumb gate)
- [x] Phase 2 game shell + 4 core games
- [x] Phase 3 remaining 3 games (Reaction, Mine, Word)
- [x] Phase 4 essentials (`/leaderboards`, click-to-pin, daily 2x, top-3 preview, `process_submission`)
- [x] Phase 5 essentials (`/profile/<username>`)
- [x] Phase 6 (XP events + streak/PB/all-seven badges via process_submission)
- [x] Polish batch + 90-day heatmap + theme-toggle latency fix (commit 1, staged 2026-04-29)
- [ ] Phase 7 friends (mutual-accept + add by code AND username + /friends + leaderboards Friends scope + /f/<code> deep-link + 30/hour rate limit + #41 friends-only Today mini-leaderboard reframe). Commit 2.
- [ ] Phase 4.5 follow-up: drag-reorder pins, Daily Completion sub-tab, 14-day calendar widget, leaderboards Group filter (post Phase 8)
- [ ] Phase 5.5 follow-up: 30-day SVG sparkline, /profile/me/{history,graphs} + CSV export, achievement badges
- [ ] Phase 8 groups (public/private + roles + /g/<join_code>)
- [ ] Phase 9 tutorials (cutout-mask first-play overlay)
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
Dev creds live in CLAUDE.md (gitignored). Never paste them into `.vibe/` (committed) or any tracked file.

## Live state
- Supabase project `nookxuvlvwtppitqguxf`: migrations 0001-0010 applied. 192 role grants restored (0006). `process_submission(text, numeric, boolean) -> jsonb` is the only writer for submissions and daily_aggregates. Migration 0011 (`find_user_by_username`) is queued for commit 2.
- Vercel project `mindlap` linked. Env vars in Vercel: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in Dev/Preview/Prod; SUPABASE_SERVICE_ROLE_KEY + RESEND_API_KEY in Preview/Prod only.
- GitHub: `dukesmith0/mindlap` (public). Latest `origin/main` = `a1c083a`.
- Tests: 186 passing across 19 files (was 163/16); added `debug/badge-icons.test.ts`, `debug/heatmap.test.ts`, `debug/countdown.test.ts`.

## New-session ramp-up
Read in order: `.vibe/current.md` -> `understanding.md` -> `decisions.md` -> `plans.md` -> `risks.md` -> `bugs.md` -> `future.md`. Visual ref: `.vibe/docs/style-reference/zetamac-pure.html`. Game source: `C:\Users\craigs\OneDrive\Desktop\Projects\mindgames\js\*.js`.

Pick-up candidates after commit 1 lands: Phase 7 friends (commit 2), then #30 pre-submit comparison view, then #14 digit-span overflow design call.
