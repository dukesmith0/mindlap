# Current

Active: Phases 0/1/1.5/2/3/4-essentials/5-essentials/6 shipped on `origin/main` (latest commit `be39d27`). Vercel auto-deploys. Awaiting next-session work.

## What works end-to-end
- Sign up email/pw or Google -> email confirm -> `/auth/callback` -> `/onboarding` -> `/today`.
- All 7 games playable: 3-2-1-Go countdown -> game -> result -> Enter to submit -> `+N xp` + `[new PB]` indicator -> `N` to chain to the next game.
- `process_submission` RPC writes the submission, upserts daily_aggregates (best/worst/mean/median + plays_submitted), updates streak/longest/total_submitted, awards xp_events (participation cap + PB bonus * streak_mult * 2x), and grants streak/PB/all-seven badges in one tx.
- `/today`: pinned > 2x > core > rest, top-3 leaderboard preview per card, click-to-pin, search input.
- `/leaderboards`: Today/7d/All-time × 7 game tabs, anonymous-readable.
- `/profile/<username>`: public profile with summary + per-game cards + badge wall. Sparse for private profiles.
- `/settings`: Profile / Preferences / Account / Password (current-pw-verified) / Delete.
- Reset password: forgot-pw email -> `/auth/callback?next=/auth/set-password` (sets recovery cookie) -> `/auth/set-password` (gated by cookie) -> save -> `/today`.

## Open bugs (3)
- #30 [MED] Pre-submit comparison view on ResultScreen (PB/worst/7d-median/leaderboard delta with green +N / red -N). Bigger feature; deferred from last session. Needs a `getPreSubmitContext(game_key, score)` Server Action.
- #26 [LOW] /profile/<username> does 28 supabase round-trips. Collapse to one `get_public_profile_stats` RPC in Phase 11.
- #19 [LOW] Avatar initial visually offset above center (Courier Prime cap-baseline).

## Open risks (`0C / 1H / 2M / 4L`)
- R13 [HIGH] No app-level rate limit on auth endpoints. Block before public launch (Phase 11).
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
- [ ] Phase 4.5 follow-up: drag-reorder pins, Daily Completion sub-tab, 14-day calendar widget, leaderboards Friends/Group filter (post Phase 7/8)
- [ ] Phase 5.5 follow-up: 90-day heatmap, 30-day SVG sparkline, /profile/me/{history,graphs} + CSV export, achievement badges (perfect N-back, sub-300ms reaction)
- [ ] Phase 7 friends (mutual-accept + filter + /f/<friend_code>)
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
- Supabase project `nookxuvlvwtppitqguxf`: migrations 0001-0010 applied. 192 role grants restored (0006). `process_submission(text, numeric, boolean) -> jsonb` is the only writer for submissions and daily_aggregates.
- Vercel project `mindlap` linked. Env vars in Vercel: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in Dev/Preview/Prod; SUPABASE_SERVICE_ROLE_KEY + RESEND_API_KEY in Preview/Prod only (Dev users add the service-role key to `.env.local` to run create-dev-user.mjs).
- GitHub: `dukesmith0/mindlap` (public). Latest `origin/main` = `be39d27`.

## New-session ramp-up
Read in order: `.vibe/current.md` -> `understanding.md` -> `decisions.md` -> `plans.md` -> `risks.md` -> `bugs.md` -> `future.md`. Visual ref: `.vibe/docs/style-reference/zetamac-pure.html`. Game source: `C:\Users\craigs\OneDrive\Desktop\Projects\mindgames\js\*.js`.

Pick-up candidates (most-bang-for-buck first): #30 pre-submit comparison view, #14 digit-span overflow design call, Phase 7 friends, #15 settings back affordance.
