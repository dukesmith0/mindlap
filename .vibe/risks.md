# Risks
Next ID: R18 | Baseline: 0C/1H/2M/4L | Last scan: 2026-04-28

## High
#R13 No app-level rate limit on signup/signin/reset. Public-launch DoS + Resend quota burn + credential-stuffing. v1 relies on Supabase per-IP. Phase 11: Vercel KV / Upstash IP+user bucket. Block before public launch.

## Medium
#R1 Anti-cheat deferred. RLS + DB CHECK + `auth.uid()`-tied insert only; user could craft any in-range score. OK for friends-and-groups MVP. Revisit before prize/competitive features.
#R2 Glicko-2 cold-start unstable with sparse pop. Mitigated by `ELO_VISIBLE=false` (silent accumulation). Verify rating distribution at flip threshold (>=25 users × >=10 ranked submissions/game).

## Low
#R17 No per-user submission rate limit; spamming `submitScoreAction` could inflate aggregates once Phase 4 ships. Folds into R13.
#R16 `changePasswordAction` side-client `signInWithPassword` counts against Supabase per-IP password-grant limit; repeat wrong-current-password can throttle normal login. Folds into R13.
#R15 Future migrations may regress role grants if table created by non-`postgres` owner (0006's `ALTER DEFAULT PRIVILEGES` is per-role). Mitigation: always use `scripts/apply-migrations.mjs` (Mgmt API as `postgres`).
#R3 Daily-bonus cron skip leaves a date without seeded rotation. Mitigation: lazy fallback generator on first request for that date (Phase 4 ships this).

## Resolved (2026-04-28)
#R14 [HIGH] Reset-password half-state -> Phase 1.5 page + recovery-cookie crumb gate (one-shot `mindlap_pwreset` set only by `/auth/callback?next=/auth/set-password`). Stolen-session pivot blocked.
#R12 [MED] Friend codes used `random()` LCG -> `gen_random_bytes()` from pgcrypto.
#R11 [HIGH] Open-redirect via `next` param -> `safeNext()` rejects protocol-relative + absolute.
#R10 [HIGH] Missing INSERT/UPDATE/DELETE policies on group_members + group_invites -> explicit policies (public-group join, leave-group, admin-manage-invites).
#R9 [HIGH] daily_aggregates + submissions public SELECT leaked private play history -> privacy-aware SELECT (owner OR public profile OR accepted friend).
#R8 [HIGH] group_members SELECT policy column shadowing leaked all rosters -> qualified with `public.group_members.group_id`.
#R7 [HIGH] `groups.owner_id ON DELETE RESTRICT` blocked account deletion -> `ON DELETE CASCADE`; ownership-transfer trigger Phase 8.
#R6 [HIGH] Proxy matcher missed `/api/*` exclusion (every API call did session refresh + could HTML-redirect JSON clients) -> matcher includes `api|robots.txt|sitemap.xml|manifest.webmanifest`.
#R5 [HIGH] `/profile/` allowlist matched `/profile/me/*` private namespaces -> exclude `/profile/me*` explicitly.
#R4 [HIGH] Proxy redirect dropped refreshed Supabase cookies (sessions silently expired) -> copy `response.cookies.getAll()` onto the redirect.
