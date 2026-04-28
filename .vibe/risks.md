# Risks
Next ID: R14 | Last scan: 2026-04-28 (post-security-audit) | Baseline: 0C/1H/2M/1L

## Critical

## High

## High
#R13 [HIGH] No app-level rate limiting on signup, signin, password reset. Public-launch DoS surface: an attacker can burn the Resend email quota or grind credential-stuffing. v1 dev-deploy relies on Supabase Auth's built-in throttling. Action: Vercel KV / Upstash IP bucket in Phase 11 launch readiness. Required before opening to public. (planned 2026-04-28)

## Medium
#R1 [MEDIUM] Anti-cheat deferred at launch. Only RLS + DB CHECK + auth.uid()-tied inserts protect submissions. A user could craft API calls inserting any in-range score. Acceptable for friends-and-groups MVP. Revisit before any prize/competitive feature. (planned 2026-04-28)
#R2 [MEDIUM] Glicko-2 cold-start with sparse population produces unstable ratings. Mitigated by `ELO_VISIBLE=false` flag; ratings persist silently. Verify rating distribution before flipping at threshold (≥25 users × ≥10 ranked submissions/game). (planned 2026-04-28)

## Low
#R3 [LOW] Daily-seed cron skip leaves a date without a seed. Mitigation: lazy fallback generator on first request for a date so leaderboards stay comparable. (planned 2026-04-28)

## Resolved
#R7 [HIGH] groups.owner_id ON DELETE RESTRICT would block account deletion for any user who owns a group. Resolved 2026-04-28: changed to ON DELETE CASCADE so owner deletion dissolves the group (Phase 8 trigger will add ownership transfer to oldest admin).
#R8 [HIGH] group_members SELECT policy column shadowing leaked all rosters. Resolved 2026-04-28: added explicit `gm_outer` alias and qualified `group_id` references in correlated subqueries.
#R9 [HIGH] daily_aggregates + submissions public SELECT leaked private-profile play history. Resolved 2026-04-28: replaced with privacy-aware SELECT that allows owner, public profiles, or accepted friends only.
#R10 [HIGH] Missing INSERT/UPDATE/DELETE policies on group_members and group_invites. Resolved 2026-04-28: added explicit policies for public-group join, leave-group, admin-manage-invites.
#R11 [HIGH] Open-redirect via `next` param in signin/Google/callback. Resolved 2026-04-28: `safeNext()` helper rejects protocol-relative and absolute URLs.
#R12 [MEDIUM] Friend codes used `random()` (deterministic LCG). Resolved 2026-04-28: switched to `gen_random_bytes()` from pgcrypto.
#R4 [HIGH] Proxy redirect dropped refreshed Supabase session cookies. `proxy.ts` returned a fresh `NextResponse.redirect(url)` that did not carry over cookies the SSR client wrote during `getUser()`. Sessions could silently expire mid-flow forcing repeated re-auth. (found 2026-04-28 by reviewer, resolved 2026-04-28: `lib/supabase/proxy.ts` now copies `response.cookies.getAll()` onto the redirect before returning.)
#R5 [HIGH] `/profile/[username]` allowlist used a `/profile/` prefix that also matched `/profile/me/*` private namespaces, leaving them anonymous-readable. (found 2026-04-28 by reviewer, resolved 2026-04-28: `isPublicPath()` now explicitly excludes `/profile/me` and `/profile/me/*` before allowing `/profile/<username>`.)
#R6 [HIGH] Proxy matcher did not exclude `/api/*` routes, causing every API call to perform Supabase session refresh and potentially redirect anonymous JSON clients to an HTML login page. (found 2026-04-28 by reviewer, resolved 2026-04-28: `proxy.ts` matcher negative lookahead now includes `api|`, plus `robots.txt|sitemap.xml|manifest.webmanifest`.)
