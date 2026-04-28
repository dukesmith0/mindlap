# Current

Active: mindlap v1, Phase 0 scaffold (running now).

## Progress
- [x] Plan approved 2026-04-28; amended same day with style lock + open-play + Resend + hard-delete + double-XP + pins + privacy + PT timezone + monetization-future
- [x] git init + remote `github.com/dukesmith0/mindlap` (public)
- [x] `.vibe/` scaffolded; mindgames reference at `.vibe/docs/mindgames/`
- [x] Courier Prime fonts in `./Courier_Prime/` (Regular/Bold/Italic/BoldItalic .ttf)
- [ ] Phase 0 scaffold: Next.js + Tailwind + Zetamac Pure tokens + font wired
- [ ] Phase 0 external setup: Supabase project, Vercel link, Resend SMTP, MCPs
- [ ] Phase 1: auth + profiles + onboarding + preferences hub
- [ ] Phase 2: game shell + core 4 + open-ended play + record_play_event + submit
- [ ] Phase 3: remaining 3 games
- [ ] Phase 4: today's hub + leaderboards (full public visibility) + double-XP + pins
- [ ] Phase 5: profile + improvement UX (streak ribbon, per-game cards, heatmap, history, graphs)
- [ ] Phase 6: XP + badges (streak bonus 1.0x to 2.5x scaling)
- [ ] Phase 7: friends (mutual-accept, friend codes, shareable links)
- [ ] Phase 8: groups (public/private toggle, roles, join codes)
- [ ] Phase 9: tutorials
- [ ] Phase 10: Glicko-2 plumbing (silent)
- [ ] Phase 11: launch readiness
- [ ] Phase 12 (post-launch): flip elo + monetization (Stripe, 2/day free, $5/mo unlimited)

## Active scaffolding work
1. `npx create-next-app@latest .` (TypeScript, Tailwind, App Router, no src dir)
2. Tailwind config: disable shadow/radius/font-family/blur/ring utilities
3. Move Courier Prime to `public/fonts/` and wire via `next/font/local`
4. Create `app/globals.css` with Zetamac Pure tokens (light + dark variants)
5. Create base layout with theme attribute on `<html>`
6. Stub pages: landing, login/signup, today, settings, profile
7. Supabase client utilities (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
8. `.env.local.example` with required env vars
