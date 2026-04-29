# Risks
Next ID: R19 | Baseline: 0C/1H/2M/5L | Last scan: 2026-04-29

## High
#R13 No app-level rate limit on signup/signin/reset. Public-launch DoS + Resend quota burn + credential-stuffing. v1 relies on Supabase per-IP. Phase 11: Vercel KV / Upstash IP+user bucket. Block before public launch. **Phase 7 update (2026-04-29):** scope expanded to include friend-request flooding via `/f/<code>` social engineering and onboarding-cookie auto-add path. Phase 7 friend-request rate limit (`lib/rate-limit.ts`, 30/hour/user) is a per-DB-row stopgap that folds under R13 when KV swap lands.

## Medium
#R1 Anti-cheat deferred. RLS + DB CHECK + `auth.uid()`-tied insert + games-catalog range check only; user could craft any in-range score. OK for friends-and-groups MVP. Revisit before prize/competitive features. **Disclosure question pending** (#58 in bugs.md): should /leaderboards carry a "scores are user-reported, anti-cheat verification arrives later" footnote until replay tokens ship, or stay silent? Persona 3 review surfaced this as a "leaderboard theater" risk for the "improvement-tracking" v1 thesis.
#R2 Glicko-2 cold-start unstable with sparse pop. Mitigated by `ELO_VISIBLE=false` (silent accumulation, Phase 10). Verify rating distribution at flip threshold (≥25 users × ≥10 ranked submissions/game).

## Low
#R18 0013 `profiles.avatar_emoji` CHECK allows `char_length 1..32` but `lib/auth/avatar-emoji.ts` enforces exactly one extended grapheme. Self-inflicted only (RLS UPDATE policy scopes write to own row); no cross-user impact. Tighten to a regex CHECK or accept. Filed in commit 4 (avatar identity rework).
#R17 No per-user submission rate limit; spamming `submitScoreAction` could inflate aggregates. Folds into R13.
#R16 `changePasswordAction` side-client `signInWithPassword` counts against Supabase per-IP password-grant limit; repeat wrong-current-password can throttle normal login. Folds into R13.
#R15 Future migrations may regress role grants if a table is created by a non-`postgres` owner (0006's `ALTER DEFAULT PRIVILEGES` is per-role). Mitigation: always use `scripts/apply-migrations.mjs` (Mgmt API as `postgres`).
#R3 Daily-bonus rotation no longer a risk: `lib/daily-bonus.ts` is deterministic FNV-1a, no DB persistence required (no cron, no skip case). Status: kept LOW until decisions.md note bakes in for ≥1 release; could be promoted to Resolved next refresh.

## Resolved (2026-04-28)
#R14 [HIGH] Reset-password half-state -> Phase 1.5 page + recovery-cookie crumb gate. Stolen-session pivot blocked.
#R12 [MED] Friend codes used `random()` LCG -> `gen_random_bytes()` from pgcrypto.
#R11 [HIGH] Open-redirect via `next` param -> `safeNext()` rejects protocol-relative + absolute.
#R10 [HIGH] Missing INSERT/UPDATE/DELETE policies on group_members + group_invites -> explicit policies.
#R9 [HIGH] daily_aggregates + submissions public SELECT leaked private play history -> privacy-aware SELECT.
#R8 [HIGH] group_members SELECT policy column shadowing -> qualified with `public.group_members.group_id`.
#R7 [HIGH] `groups.owner_id ON DELETE RESTRICT` blocked account deletion -> CASCADE; ownership-transfer trigger Phase 8.
#R6 [HIGH] Proxy matcher missed `/api/*` exclusion -> matcher includes `api|robots.txt|sitemap.xml|manifest.webmanifest`.
#R5 [HIGH] `/profile/` allowlist matched `/profile/me/*` -> `isPublicPath()` excludes `/profile/me*` first.
#R4 [HIGH] Proxy redirect dropped refreshed Supabase cookies -> copy `response.cookies.getAll()` onto the redirect.
