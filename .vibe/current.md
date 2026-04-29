# Current

Active: mindlap v1, Phase 1 LIVE. Onboarding-blockers fixed 2026-04-28; retest then Phase 2.

## Just-resolved 2026-04-28
- #8 CRITICAL: 0006 restored DML grants on public.* (Mgmt-API path skipped default-priv seeding). Applied live, 192 grants verified.
- #9: onboarding button entity literal fixed.
- #10: signup confirm-password added; signin unchanged.

## Last commits
- `8bb869b` fix: signup callback 404 + friend_code trigger crash. Moved `/auth/callback` out of route group, applied 0005 to fix `generate_friend_code` (column rebind + extensions search_path), 0003 group_members policy syntax fix, .vibe condensed.
- `b01656a` Phase 1: auth, profiles, onboarding, settings + security hardening.
- `c7467d9` Phase 0 cleanup: speed-insights, proxy auth, eslint flat config.
- `38c8726` Phase 0 scaffold.

## Live state
- Supabase project `nookxuvlvwtppitqguxf`: migrations 0001-0005 applied. 16 tables, 33 RLS policies, 7 games, 13 badges, auth trigger, friend-code RPC. Verified via `scripts/verify-migrations.mjs`.
- Vercel deployment: auto-deploys from `dukesmith0/mindlap:main`. Latest deploy = commit 8bb869b.
- MCP servers: Supabase npx MCP (read-only) wired with `--access-token` + `--project-ref`. Vercel HTTP MCP authed via OAuth (personal scope, limited team access).

## Outstanding before Phase 2
1. Manual signup retest on Vercel deployment (email/pw). Email link should now resolve to `/auth/callback`, exchange code, land on `/onboarding`.
2. Manual Google OAuth signin retest (after redirect URI was added in Google Cloud Console).
3. Confirm Supabase Auth Site URL = `https://mindlap.vercel.app` and Redirect URLs allowlist includes `http://localhost:3000/auth/callback`, `https://mindlap.vercel.app/auth/callback`, and the wildcard preview pattern.

## New session ramp-up
For a fresh session resumption, read in order: `.vibe/current.md` (this), `.vibe/understanding.md`, `.vibe/decisions.md`, `.vibe/plans.md`, `.vibe/risks.md`, `.vibe/bugs.md`. Visual reference: open `.vibe/docs/style-reference/zetamac-pure.html` in browser. Game logic source: `.vibe/docs/mindgames/`.

## Next phases
- [ ] Phase 2: game shell + core 4 (Math, Digit Span, N-Back, Stroop). Port mindgames vitest cases (~129 tests / 10 files). Submit-vs-retry result screen. Server Action `submitScore()` with Zod validation.
- [ ] Phase 3: remaining 3 games (Reaction, Minesweeper, Word Recall)
- [ ] Phase 4: today's hub + leaderboards + double-XP rotation + pins + public-read gating
- [ ] Phase 5: profile + improvement UX (streak ribbon, per-game cards, heatmap, history table, graphs)
- [ ] Phase 6: XP + badges
- [ ] Phase 7: friends
- [ ] Phase 8: groups
- [ ] Phase 9: tutorials
- [ ] Phase 10: Glicko-2 silent
- [ ] Phase 11: launch readiness (incl. rate limiting per Risk #R13)
- [ ] Phase 12 (post-launch): flip elo at threshold
