# Current

Active: Phases 0-2 + 1.5 done. 4 core games playable end-to-end on dev. Awaiting `/vibe:review` verdict before commit + push to `main`.

## Just-shipped 2026-04-28 (uncommitted)

### Phase 1.5 - reset/change password
- `/auth/set-password` page + `SetPasswordForm` (new password + confirm).
- `setNewPasswordAction` gated by one-shot `mindlap_pwreset` cookie set by `/auth/callback` only when `next=/auth/set-password`. Stolen-cookie session cannot pivot to password reset.
- `changePasswordAction` in `/settings` PasswordSection. Verifies current password via stateless side client (`@supabase/supabase-js` with `persistSession:false`) so the live session cookies / refresh token are not rotated and other tabs stay signed in.
- `requestPasswordResetAction` redirect updated to `/auth/set-password`.
- `proxy.ts` ONBOARDING_ALLOWED includes `/auth/set-password`.

### Phase 2 - 4 core games
- `lib/games/{math,digit,nback,stroop}/index.ts` pure logic, parity-tested (36 new vitest cases; 61 total passing).
- `components/games/*Game.tsx` React ports + shared `Countdown` (3-2-1-Go opacity fade, only animation besides streak pulse) + `GameShell` (ready/countdown/playing/result phase machine) + `ResultScreen` (autofocus submit, Enter=submit, R=retry, N=next core game).
- `actions/submission.ts` `submitScoreAction`: Zod `int().nonnegative()` score, range-checks `games.min_score`/`max_score`, RLS user_id binding via `auth.uid()`. Inserts to `submissions`. NOTE: `daily_aggregates` NOT yet auto-written; Phase 4 ships `process_submission()` PG fn.
- `app/(authed)/play/[game]/page.tsx` route.
- `/today` shows 4 zetamac-pure game cards + best-today (from `daily_aggregates`, currently empty until Phase 4) + topbar streak/level/avatar.
- `lib/pt-date.ts` server-locale-safe PT formatter.
- `app/globals.css` adds in-game type scale (Math 56 / Digit 80 / NBack 96 / Stroop 56 / Result 96; mobile breakpoint @ 640px), `.btn-link` anchor-as-button, `@keyframes countdown-fade`.

### Infra
- `next.config.ts` gates `'unsafe-eval'`, `ws://localhost:*`, and absence of `upgrade-insecure-requests` behind `NODE_ENV === "development"`. Production CSP unchanged.
- `0006_restore_role_grants.sql` (already applied live earlier today): GRANT SELECT/INSERT/UPDATE/DELETE on all `public.*` to anon/authenticated/service_role + ALTER DEFAULT PRIVILEGES.
- `.gitignore` adds `CLAUDE.md`, `scripts/create-dev-user.mjs`, `.playwright-mcp/`.

## Bugs resolved this round
#7-#13 closed earlier today. New since /vibe:review:
- (none new fixed yet; #14-#19 logged Open below for next iteration)

## Bugs still open (logged from manual playtest, not committing fixes this round)
- #14 MED Digit Span sequence overflows column at length 10+; needs shrink-to-fit + readability discussion before fix.
- #15 MED /settings has no obvious back affordance.
- #16 LOW /favicon.ico 404 noise.
- #17 MED /play/[game] back link ("<- today") looks unclickable, no hover state.
- #18 LOW No XP bar surfaced anywhere; defer until Phase 6.
- #19 LOW Avatar initial letter renders slightly above geometric center (Courier Prime cap baseline).

## Risk delta
Baseline now `0C/1H/2M/2L`. R14 (reset-password half-state) -> Resolved. R13 (rate limiting) still HIGH for Phase 11. R1/R2 MED, R3/R15 LOW unchanged.

## Dev workflow
```
npm run dev                                    # http://localhost:3000
node scripts/create-dev-user.mjs <email> <pw>  # gitignored; needs SUPABASE_SERVICE_ROLE_KEY in .env.local
node scripts/apply-migrations.mjs <file>       # one-off migration apply via Mgmt API
```
Dev account already created: `dev@mindlap.test` / `changeme1234`.

## Live state
- Supabase project `nookxuvlvwtppitqguxf`: migrations 0001-0006 applied (last verified via `npx supabase migration list --linked`).
- Vercel project `mindlap` (linked). Env vars: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in Dev/Preview/Prod; SUPABASE_SERVICE_ROLE_KEY + RESEND_API_KEY in Preview/Prod only.
- Latest commit on origin/main: `c9e3752` (RLS grants + onboarding entity + signup confirm-pw).

## New-session ramp-up order
`.vibe/current.md` -> `understanding.md` -> `decisions.md` -> `plans.md` -> `risks.md` -> `bugs.md`. Visual ref: `.vibe/docs/style-reference/zetamac-pure.html`. Game source: `C:\Users\craigs\OneDrive\Desktop\Projects\mindgames\js\*.js`.

## Next phases
- Phase 3: Reaction, Minesweeper, Word Recall (TS port + parity tests + UIs).
- Phase 4: today hub finish (pins/2x/leaderboard preview), `process_submission()` PG fn (aggregates + silent Glicko + XP placeholder), public-read gating.
