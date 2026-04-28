# Current

Active: mindlap v1, Phase 1 COMPLETE. Awaiting user to apply migrations + test deployed app.

## Progress
- [x] Phase 0 commit (c7467d9)
- [x] Phase 1 schema: `supabase/migrations/0001_init.sql` (15 tables, indexes, CHECK constraints)
- [x] Phase 1 trigger: `supabase/migrations/0002_handle_new_user.sql` (username + friend_code generators, gen_random_bytes for codes)
- [x] Phase 1 RLS: `supabase/migrations/0003_rls_policies.sql` (privacy-aware aggregates/submissions, group write policies)
- [x] Phase 1 seed: `supabase/seed.sql` (7 games + initial badge catalog)
- [x] Helpers: lib/auth/{username,friend-code,avatar-palette}.ts + lib/theme/cookie.ts
- [x] Tests: 25/25 passing in `debug/auth/`
- [x] UI components: Avatar, AvatarColorPicker, StreakRibbon, BracketPill
- [x] Server Actions: actions/auth.ts (signin/signup/google/reset/signout) + actions/profile.ts (theme/avatar/username/basics/privacy/skip-tutorials/onboarding/delete)
- [x] Auth pages: /(auth)/login, /(auth)/signup, /(auth)/callback
- [x] Onboarding flow: /(authed)/onboarding (2-step: username + theme; no avatar step)
- [x] Settings hub: /(authed)/settings (Profile / Preferences / Account / DangerZone)
- [x] Today preview: /(authed)/today (public-readable; signed-in shows streak+level+avatar)
- [x] Layout: SSR theme via cookie, Courier Prime via next/font/local, SpeedInsights wired
- [x] Proxy: onboarding gate, null-profile fallthrough fix, open-redirect guard
- [x] Phase 1 review: 4 HIGH + 6 MEDIUM findings, all addressed
- [x] Re-verify: lint clean, typecheck clean, 25/25 tests, dev Ready in 733ms

## Outstanding (your action items before manual testing)
1. Apply migrations to Supabase: from project root, run `supabase db push` (or paste each .sql file into the Supabase SQL editor in order: 0001 -> 0002 -> 0003 -> seed.sql).
2. Confirm Vercel deployment built green after the next git push.
3. Visit production URL, sign up with email/password (verification link comes from Resend), complete onboarding, explore /settings.

## Next phases
- [ ] Phase 2: game shell + core 4 (Math, Digit Span, N-Back, Stroop)
- [ ] Phase 3: remaining 3 games
- [ ] Phase 4: today's hub + leaderboards + double-XP rotation + pins
- [ ] Phase 5: profile + improvement UX (the v1 headline)
- [ ] Phase 6: XP + badges
- [ ] Phase 7: friends
- [ ] Phase 8: groups
- [ ] Phase 9: tutorials
- [ ] Phase 10: Glicko-2 plumbing (silent)
- [ ] Phase 11: launch readiness
- [ ] Phase 12 (post-launch): flip elo
