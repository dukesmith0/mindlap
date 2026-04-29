# Risks
Next ID: R18 | Last scan: 2026-04-28 | Baseline: 0C/1H/2M/4L

## Critical

## High
#R13 [HIGH] No app-level rate limiting on signup/signin/reset. Public-launch DoS surface: attacker can burn Resend quota or grind credential-stuffing. v1 dev-deploy relies on Supabase Auth's per-IP throttling. Action: Vercel KV / Upstash IP bucket in Phase 11. Required before public launch.

## Medium
#R1 [MEDIUM] Anti-cheat deferred. Only RLS + DB CHECK + auth.uid()-tied insert protect submissions; user could craft API calls with any in-range score. Acceptable for friends-and-groups MVP. Revisit before any prize/competitive feature.
#R2 [MEDIUM] Glicko-2 cold-start with sparse population produces unstable ratings. Mitigated by `ELO_VISIBLE=false` (silent accumulation). Verify rating distribution before flipping at threshold (≥25 users × ≥10 ranked submissions/game).

## Low
#R17 [LOW] No per-user submission rate limit. A determined attacker with a valid session could spam `submitScoreAction` once Phase 4 ships `process_submission()` (would inflate `daily_aggregates`). Folds into R13's Phase 11 IP/user bucket.
#R16 [LOW] `changePasswordAction` calls `signInWithPassword` against Supabase Auth on the side client, which counts toward the per-IP password-grant rate limit. A user repeatedly entering wrong current-password from /settings can throttle their normal login from the same IP. Mitigation: R13 IP bucket in Phase 11 sits in front; document only.
#R15 [LOW] Future migrations may regress role grants if a table is created by a non-`postgres` owner. 0006's `alter default privileges in schema public` is keyed to the executing role; only objects created by `postgres` (Management API path) inherit. Mitigation: keep using `scripts/apply-migrations.mjs` for all schema changes; if a Studio/manual path is used, re-run 0006-style grant block.
#R3 [LOW] Daily-bonus cron skip leaves a date without a seeded rotation. Mitigation: lazy fallback generator on first request for a date.

## Resolved (2026-04-28)
#R14 [HIGH] Reset-password half-state. `/auth/set-password` page + change-password in /settings shipped (Phase 1.5). Hardened: setNewPasswordAction requires a one-shot `mindlap_pwreset` cookie crumb that `/auth/callback` only writes when next=/auth/set-password, so a stolen-cookie session cannot pivot to password reset. changePasswordAction verifies current password via a stateless side client (no cookie rotation, other tabs unaffected).
#R12 [MEDIUM] Friend codes used `random()` (deterministic LCG). Fix: switched to `gen_random_bytes()` from pgcrypto.
#R11 [HIGH] Open-redirect via `next` param in signin/Google/callback. Fix: `safeNext()` rejects protocol-relative and absolute URLs.
#R10 [HIGH] Missing INSERT/UPDATE/DELETE policies on group_members and group_invites. Fix: explicit policies for public-group join, leave-group, admin-manage-invites.
#R9 [HIGH] daily_aggregates + submissions public SELECT leaked private-profile play history. Fix: privacy-aware SELECT (owner OR public profile OR accepted friend).
#R8 [HIGH] group_members SELECT policy column shadowing leaked all rosters. Fix: qualified outer row's `group_id` with full table name `public.group_members.group_id` (CREATE POLICY has no table-alias syntax).
#R7 [HIGH] `groups.owner_id ON DELETE RESTRICT` would block account deletion for any group owner. Fix: switched to ON DELETE CASCADE; Phase 8 trigger will add ownership transfer to oldest admin.
#R6 [HIGH] Proxy matcher did not exclude `/api/*`, causing every API call to perform Supabase session refresh and potentially redirect anonymous JSON clients to HTML login. Fix: matcher negative lookahead now includes `api|robots.txt|sitemap.xml|manifest.webmanifest`.
#R5 [HIGH] `/profile/[username]` allowlist used `/profile/` prefix that also matched `/profile/me/*` private namespaces. Fix: `isPublicPath()` explicitly excludes `/profile/me*` before allowing `/profile/<username>`.
#R4 [HIGH] Proxy redirect dropped refreshed Supabase session cookies. Sessions silently expired mid-flow. Fix: `lib/supabase/proxy.ts` copies `response.cookies.getAll()` onto the redirect before returning.
