# Current

Active: mindlap v1, Phase 0 cleanup COMPLETE. Ready for Phase 1.

## Progress
- [x] Plan approved 2026-04-28; amended same day
- [x] git init + remote `github.com/dukesmith0/mindlap` (public)
- [x] `.vibe/` scaffolded; mindgames reference at `.vibe/docs/mindgames/`
- [x] Courier Prime fonts in `app/fonts/` (Regular/Bold/Italic/BoldItalic .ttf)
- [x] Phase 0 scaffold: Next.js 16 + Tailwind (Zetamac Pure overrides) + Courier Prime via next/font/local
- [x] Phase 0 utilities: lib/supabase/{client,server,proxy}.ts + proxy.ts root
- [x] Phase 0 deps: @supabase/ssr, zod, @vercel/speed-insights, eslint-config-next 16, vitest 4
- [x] Phase 0 review: 3 HIGH + 8 MEDIUM findings, all addressed
  - HIGH#1 (#R4 #1): proxy now copies refreshed cookies onto redirect
  - HIGH#2 (#R5 #2): /profile/me/* gated; /profile/<username> still public
  - HIGH#3 (#R6): /api/* + robots.txt + sitemap.xml + manifest.webmanifest excluded from matcher
  - MEDIUM: eslint-config-next bumped to ^16; supabase moved to devDeps; Tailwind font-family in array form; .gitignore dedup; tsconfig stale path removed; PUBLIC_PREFIXES tightened
  - SpeedInsights wired in app/layout.tsx
  - Lint, typecheck, dev all clean (Ready in 775ms; GET / 200; gated routes redirect)
- [ ] External setup (your action): Supabase project creation, Vercel link, Resend SMTP. See setup guide.
- [ ] Phase 1: auth + profiles + onboarding + preferences hub
- [ ] Phase 2: game shell + core 4
- [ ] Phase 3-12 per plan

## Verification (Phase 0)
- `npm run typecheck` -> clean
- `npm run lint` -> clean (0 errors, 0 warnings)
- `npm run dev` -> Ready in 775ms, no deprecation warnings
- `GET /` -> 200
- `GET /settings` -> 307 -> /login?next=/settings (gated correctly)
- `GET /profile/me/history` -> 307 -> /login?next=/profile/me/history (gated correctly, previously was leaking)
- `GET /profile/someuser` -> 404 (page doesn't exist yet, but anonymous reaches it = correct allowlist behavior)

## Outstanding (before Phase 1)
- User must complete external setup (Supabase project creation, Vercel link, Resend SMTP, MCP tokens). See setup guide.
- Optional: `git commit -am "phase 0 scaffold + cleanup"` before starting Phase 1.

## Next action
Phase 1: auth + profiles + onboarding + preferences hub. Includes:
- Supabase Auth: email/password + Google with identity linking
- Resend wired as Supabase Auth's SMTP provider
- Migration `supabase/migrations/0001_init.sql` (profiles, user_game_pins, daily_bonus, submissions, daily_aggregates, ratings, mind_elo, friendships, groups, group_members, group_invites, badges, user_badges, xp_events)
- `handle_new_user` trigger
- Onboarding flow (username, theme choice, optional avatar)
- Settings hub (Profile / Account / Preferences / Notifications)
- Avatar upload to Supabase Storage
- Privacy toggle, hard-delete cascade with username confirmation
