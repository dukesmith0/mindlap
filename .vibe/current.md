# Current

Active: Commit 1 (polish batch + heatmap + theme toggle) landed at `46637bc`. Commit 2 (Phase 7 friends + #41 friends-only Today mini-leaderboard + #47 social buttons + dark-mode lift + NOT YET PLAYED filler) staged on disk, ready to commit. Vercel auto-deploys on push.

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

## Open bugs (5)
- #50 [LOW] Filed and resolved in same commit (profile social-buttons layout). Watch for regressions.
- #48 [MED] Avatar identity rework (color + emoji + click-to-edit modal). Defer to its own commit.
- #46 [LOW] Profile header centering off due to .subtitle 40px bottom margin. Defer.
- #45 [MED] Themed tooltips for badges + heatmap (single delegated hover bubble). Defer.
- #30 [MED] Pre-submit comparison view on ResultScreen.
- #26 [LOW] Profile RPC consolidation (Phase 11).
- #14 [MED] Digit Span overflow at length 10+. Needs design call.

(Note: #50 is actually closed — listed for visibility. Open count is 6 by strict interpretation, 5 if we treat #50 as resolved.)

## Open risks (`0C / 1H / 2M / 4L`)
- R13 [HIGH] No app-level rate limit on auth endpoints. Phase 11. Phase 7 friend-request DB-counter is a stopgap that folds under R13.
- R1, R2 [MED] Anti-cheat deferred; Glicko cold-start unstable.
- R3, R15, R16, R17 [LOW] Daily-bonus cron, future-migration grant regression, side-client password-grant rate sharing, per-user submission spam.

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
- [x] Phase 7 friends + #41 reframe + #47 social (commit 2, staged)
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
- Supabase project `nookxuvlvwtppitqguxf`: migrations 0001-0012 applied. `process_submission(text, numeric, boolean) -> jsonb` is the only writer for submissions and daily_aggregates. `find_user_by_friend_code` and `find_user_by_username` (0011) handle friend-add lookups. `profiles.accepts_friend_requests` (0012) gates inbound requests.
- Vercel project `mindlap` linked. Env vars unchanged.
- GitHub: `dukesmith0/mindlap` (public). Latest `origin/main` = `46637bc`.

## New-session ramp-up
Read in order: `.vibe/current.md` -> `understanding.md` -> `decisions.md` -> `plans.md` -> `risks.md` -> `bugs.md` -> `future.md`. Visual ref: `.vibe/docs/style-reference/zetamac-pure.html`.

Pick-up candidates after commit 2 lands: #48 avatar identity rework (color + emoji popup), #45 themed tooltips for badges + heatmap, then Phase 4.5 / 5.5 follow-ups, then Phase 8 groups.
