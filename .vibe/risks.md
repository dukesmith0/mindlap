# Risks
Next ID: R7 | Last scan: 2026-04-28 (post-Phase-0 review) | Baseline: 0C/0H/2M/1L

## Critical

## High

## Medium
#R1 [MEDIUM] Anti-cheat deferred at launch. Only RLS + DB CHECK + auth.uid()-tied inserts protect submissions. A user could craft API calls inserting any in-range score. Acceptable for friends-and-groups MVP. Revisit before any prize/competitive feature. (planned 2026-04-28)
#R2 [MEDIUM] Glicko-2 cold-start with sparse population produces unstable ratings. Mitigated by `ELO_VISIBLE=false` flag; ratings persist silently. Verify rating distribution before flipping at threshold (≥25 users × ≥10 ranked submissions/game). (planned 2026-04-28)

## Low
#R3 [LOW] Daily-seed cron skip leaves a date without a seed. Mitigation: lazy fallback generator on first request for a date so leaderboards stay comparable. (planned 2026-04-28)

## Resolved
#R4 [HIGH] Proxy redirect dropped refreshed Supabase session cookies. `proxy.ts` returned a fresh `NextResponse.redirect(url)` that did not carry over cookies the SSR client wrote during `getUser()`. Sessions could silently expire mid-flow forcing repeated re-auth. (found 2026-04-28 by reviewer, resolved 2026-04-28: `lib/supabase/proxy.ts` now copies `response.cookies.getAll()` onto the redirect before returning.)
#R5 [HIGH] `/profile/[username]` allowlist used a `/profile/` prefix that also matched `/profile/me/*` private namespaces, leaving them anonymous-readable. (found 2026-04-28 by reviewer, resolved 2026-04-28: `isPublicPath()` now explicitly excludes `/profile/me` and `/profile/me/*` before allowing `/profile/<username>`.)
#R6 [HIGH] Proxy matcher did not exclude `/api/*` routes, causing every API call to perform Supabase session refresh and potentially redirect anonymous JSON clients to an HTML login page. (found 2026-04-28 by reviewer, resolved 2026-04-28: `proxy.ts` matcher negative lookahead now includes `api|`, plus `robots.txt|sitemap.xml|manifest.webmanifest`.)
