# Current

`origin/main` = `4553763` (commit 6). Production live on `mindlap.vercel.app`. 210/210 vitest, typecheck/lint/build clean.

## Stop-the-line — close before any new-flow phase

- [ ] **#98** Gate recovery cookie on Supabase `?type=recovery`, not the `next` path.
- [ ] **R20** Verify live grants on `award_xp` / `eval_badges` via `npm run db:doctor -- --grants award_xp,eval_badges`; hot-fix revoke if `authenticated` has EXECUTE.
- [ ] Add `SUPABASE_ACCESS_TOKEN` + `SUPABASE_SERVICE_ROLE_KEY` to the Vercel project env (`vercel env add`); both are absent from the linked project so `vercel env pull` strips them. Until then, merge from `.env.local.bak`.
- [ ] Delete legacy `.env` and `.env.local.bak` once new `.env.local` is complete. Rotate the PAT if it ever leaked.

## Phase 9 — Flow A: low-risk new-user UI polish

- [ ] **#30** Score-screen 3-button refactor: `retry [R]` (discard, replay) / `save [S]` (submit, return to /today) / `save+retry [Enter]` (submit, replay). PB ribbon on new PB. Yesterday-delta line shown by default (`PB +6 vs yesterday`).
- [ ] **#75** /today empty-state CTA on unplayed cards: replace `NOT YET PLAYED` with `not played today · play →`.
- [ ] /today progress row above game list: `N / 7 today · M to go` plus dot row (`●●●○○○○`).
- [ ] /today end-of-day state: `✓ daily complete` chip plus `all 7 played today · come back tomorrow` line; render when `played === 7`.
- [ ] First-visit /today welcome banner: `welcome — you're on a 1-day streak. play 6 more games to build it.` (dismissible, only when `streak === 1` and `played === 1`).
- [ ] Lapsed-user re-entry: streak silently 0, soft `welcome back. play any game to start a new streak.` line, no shame copy.
- [ ] Static `/supporter` page (no Stripe): tagline + benefit list + "covers the bills" framing. Linked from footer + `/settings → Account`.
- [ ] **#65** Direction-badge hover restyle as info-chip or inline "click for tutorial" caption.
- [ ] Update `.vibe/understanding.md` Routes table to note `/supporter` and the score-screen behavior change. (Anon `/play` opening + onboarding strip land in later phases; do not pre-document.)
