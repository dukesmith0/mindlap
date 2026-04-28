# Bugs
Next ID: 3

## Open

## Deferred

## Resolved
#1 [HIGH] `lib/supabase/proxy.ts` redirect path lost Supabase session cookies refreshed by `getUser()`. Fix: copy cookies from the post-`getUser` `response` onto the `NextResponse.redirect()` before returning. (found 2026-04-28 by Phase 0 reviewer, resolved 2026-04-28)
#2 [HIGH] `lib/supabase/proxy.ts` PUBLIC_PREFIXES `/profile/` allowlisted `/profile/me/*` for anonymous access, contradicting the public-read policy. Fix: replaced flat prefix list with `isPublicPath()` function that explicitly excludes `/profile/me` and `/profile/me/*` before allowing `/profile/<username>`. (found 2026-04-28 by Phase 0 reviewer, resolved 2026-04-28)
