# Risks
Next ID: R20 | Baseline: 0C/1H/2M/6L | Last scan: 2026-04-30

## High
**R13** No app-level rate limit on signup/signin/reset/friend-request paths. Public-launch DoS + Resend quota burn + credential-stuffing. Phase 13 swap to Vercel KV / Upstash IP+user bucket. Block before public launch. Folds R16 + R17.

## Medium
**R1** Anti-cheat deferred. RLS + DB CHECK + `auth.uid()`-tied insert + range-check only; user could craft any in-range score. #58 footnote acknowledges. Decide pre-launch (Phase 13) whether to ship full replay tokens here or defer to Phase 16.

**R2** Glicko-2 cold-start unstable with sparse population. Mitigated by `ELO_VISIBLE=false` (silent accumulation, Phase 12). Resolves naturally at threshold (≥25 users × ≥10 ranked submissions/game).

## Low
**R3** Daily-bonus rotation deterministic (FNV-1a, no DB). Promote to Resolved next refresh.

**R15** Future migrations may regress role grants if a table is created by a non-`postgres` owner. Mitigation: always use `scripts/apply-migrations.mjs`. Document in launch runbook (Phase 13).

**R16** `changePasswordAction` side-client `signInWithPassword` counts against Supabase per-IP password-grant limit. Folds into R13.

**R17** No per-user submission rate limit; spamming `submitScoreAction` could inflate aggregates. Folds into R13.

**R18** `profiles.avatar_emoji` CHECK allows `char_length 1..32` but app validator enforces exactly one extended grapheme. Self-inflicted only (RLS scopes UPDATE to own row). Phase 13 — tighten to a regex CHECK.

**R19** ~~PT-DST hardcode in `today/page.tsx` PB-today detection~~ — **resolved 2026-04-30 commit 6** (24h UTC window + Intl.DateTimeFormat client filter). Move to Resolved next refresh.

## Resolved (2026-04-28)
R14 reset-password half-state → Phase 1.5 page + recovery-cookie crumb gate. Stolen-session pivot blocked.
R12 friend codes used `random()` LCG → `gen_random_bytes()` from pgcrypto.
R11 open-redirect via `next` param → `safeNext()` rejects protocol-relative + absolute.
R10 missing INSERT/UPDATE/DELETE policies on group_members + group_invites → explicit policies.
R9 daily_aggregates + submissions public SELECT leaked private play history → privacy-aware SELECT.
R8 group_members SELECT policy column shadowing → qualified with `public.group_members.group_id`.
R7 `groups.owner_id ON DELETE RESTRICT` blocked account deletion → CASCADE; ownership-transfer trigger Phase 8.
R6 proxy matcher missed `/api/*` exclusion → matcher includes `api|robots.txt|sitemap.xml|manifest.webmanifest`.
R5 `/profile/` allowlist matched `/profile/me/*` → `isPublicPath()` excludes `/profile/me*` first.
R4 proxy redirect dropped refreshed Supabase cookies → copy `response.cookies.getAll()` onto the redirect.
