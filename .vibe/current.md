# Current

Active: mindlap v1, Phase 1 COMPLETE + LIVE. Migrations applied to Supabase project `nookxuvlvwtppitqguxf`. Signup verified working after fixing #6.

## Recent
- Phase 0 commit c7467d9, Phase 1 commit b01656a (pushed to dukesmith0/mindlap:main).
- Migrations 0001-0005 applied via `scripts/apply-migrations.mjs` (Supabase Management API). Schema verified: 16 tables, 33 RLS policies, 7 games, 13 badges, auth trigger, friend-code RPC.
- Bug #6 fixed: signup hit "Database error saving new user" because `generate_friend_code()` (0002) referenced the dropped `profiles.friend_code` column and lacked `extensions` on its search_path (pgcrypto's home). Migration 0005 fixed both.
- MCP servers: Vercel HTTP MCP authed via OAuth (limited team access on personal scope). Supabase npx MCP wired with `--access-token` + `--project-ref` flags.

## Outstanding
1. Manual signup retry on Vercel deployment.
2. Configure Supabase Auth Site URL + redirect allowlist so Resend confirmation emails point to the deployed URL, not localhost (Resend templates inherit Supabase's Site URL).
3. Re-add Google OAuth client redirect URI `https://nookxuvlvwtppitqguxf.supabase.co/auth/v1/callback` in Google Cloud Console (the redirect_uri_mismatch issue from earlier).

## Next phases
- [ ] Phase 2: game shell + core 4 (Math, Digit Span, N-Back, Stroop)
- [ ] Phase 3: remaining 3 games
- [ ] Phase 4: today's hub + leaderboards + double-XP + pins
- [ ] Phase 5: profile + improvement UX
- [ ] Phase 6: XP + badges
- [ ] Phase 7: friends
- [ ] Phase 8: groups
- [ ] Phase 9: tutorials
- [ ] Phase 10: Glicko-2 silent
- [ ] Phase 11: launch readiness (incl. rate limiting)
- [ ] Phase 12: flip elo (post-launch)
