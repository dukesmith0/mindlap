# Risks
Next ID: R27

## High Priority

| ID  | Name | Note |
|-----|------|------|
| R20 | DB grant audit needed | `0006` runs `grant all on all functions … to authenticated` and `alter default privileges … functions` AFTER `0008`'s explicit revoke on `award_xp` + `eval_badges`. If the blanket grant won, an authed user can call `award_xp(self, 'submission', 9999)` directly. Verify via `\df+` against the linked DB; if leaked, hot-fix revoke + drop functions from default-priv block. Block before public launch. |
| R13 | App-level rate limit missing | No app-level rate limit on signup / signin / reset / friend-request paths. DoS + Resend quota burn + credential-stuffing exposure. Phase 13 swap to Vercel KV / Upstash IP+user bucket. Folds R16 + R17. |
| R22 | daily_aggregates schema lossy | Stores `best/worst/mean/median` only — no `stddev`, no `p25/p75`, no `n_submitted` distinct from `plays_submitted`. After 90-day cron deletes detail submissions, post-90d longitudinal analysis is permanently lossy. Pre-launch migration: add columns + backfill from `submissions`. |
| R25 | Cross-game normalization missing | Math (~30-50), Reaction (~250-500ms, lower-better), Digit (3-18), Word (0-10) on incomparable scales. "All-time PB X/7", leaderboard rank, future improvement-score all treat raw scores as comparable. Pre-launch data layer: `game_population_stats` table + nightly cron. |

## Medium Priority

| ID  | Name | Note |
|-----|------|------|
| R1  | Anti-cheat replay tokens deferred | RLS + DB CHECK + range-check only; user could craft any in-range score. Replay-token system ships post-launch per 2026-05-03 decision. Launch goes out with #58 footnote. |
| R2  | Glicko cold-start | Glicko-2 unstable with sparse population. Mitigated by `ELO_VISIBLE=false`. Resolves naturally at threshold (≥25 users × ≥10 ranked submissions/game). |
| R21 | search_path missing extensions | Every SECURITY DEFINER plpgsql except `generate_friend_code` (patched in 0005) declares `set search_path = public` without `extensions`. Future migration adding inline pgcrypto/uuid will silent-fail. Standardize across all functions. |
| R23 | Username regex drift | `0001:41` and `lib/auth/username.ts:6` enforce lowercase-only `[a-z0-9_-]{3,24}`; `0011:26` lookup RPC tolerates uppercase via `[a-zA-Z0-9_-]{3,24}`. Citext masks at SELECT but the RPC will rot when copied. Tighten 0011 to lowercase-only or normalize input. |
| R24 | Defense-in-depth deny policies | `submissions` lacks `for delete using (false)` / `for update using (false)` despite "immutable" intent; `profile_secrets` lacks DELETE policy. With 0006's GRANT ALL, RLS is the only barrier. Add explicit policies. |
| R15 | Migration role-grants drift | Future migrations may regress role grants if a table is created by a non-`postgres` owner. Mitigation: always use `scripts/apply-migrations.mjs`. Document in launch runbook. |
| R16 | changePassword IP rate | `changePasswordAction` side-client `signInWithPassword` counts against Supabase per-IP password-grant limit. Folds into R13. |
| R17 | Submission spam rate | No per-user submission rate limit; spamming `submitScoreAction` could inflate aggregates. Folds into R13. |

## Low Priority

| ID  | Name | Note |
|-----|------|------|
| R3  | Daily-bonus deterministic | Daily-bonus rotation is deterministic (FNV-1a, no DB), so cron-skip is safe. Promote to Resolved next refresh. |
| R18 | avatar_emoji CHECK drift | `profiles.avatar_emoji` CHECK allows `char_length 1..32` while app validator enforces exactly one extended grapheme. Self-inflicted only (RLS scopes UPDATE to own row). Tighten DB CHECK to a regex matching one grapheme. |
| R19 | PT-DST hardcode | Resolved in commit 6 (24h UTC window + Intl.DateTimeFormat client filter). Move to Resolved next refresh. |
| R26 | Submission index timing oracle | `submissions_game_score_idx` (`0001:96`) orders all scores DESC; the privacy-aware SELECT policy filters per-row, opening a measurable timing oracle on private-profile membership. Negligible at v1 scale; revisit at population scale. |

## Resolved (2026-04-28)

R14 reset-password half-state → recovery-cookie crumb gate. R12 friend codes used `random()` → `gen_random_bytes()`. R11 open-redirect via `next` → `safeNext()` rejects protocol-relative + absolute. R10 missing INSERT/UPDATE/DELETE on group_members + group_invites → explicit policies. R9 daily_aggregates + submissions public SELECT leaked private play history → privacy-aware SELECT. R8 group_members SELECT column shadowing → qualified `public.group_members.group_id`. R7 `groups.owner_id ON DELETE RESTRICT` blocked deletion → CASCADE. R6 proxy matcher missed `/api/*` exclusion → matcher fixed. R5 `/profile/` allowlist matched `/profile/me/*` → `isPublicPath()` excludes me first. R4 proxy redirect dropped refreshed Supabase cookies → copy `getAll()` onto redirect.
