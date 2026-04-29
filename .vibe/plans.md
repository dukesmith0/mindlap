# Plans

## Active: mindlap v1
Full plan: `C:\Users\craigs\.claude\plans\snappy-rolling-porcupine.md` (approved 2026-04-28).

### Goal
Public multi-user rebuild of mindgames with auth, profiles, open-ended play, time-window leaderboards, friends, groups, badges, tutorials, daily double-XP, user pins, profile privacy. Glicko-2 silent in v1, UI flag-gated until threshold. Improvement-tracking is the headline. Style locked to Zetamac Pure (Courier Prime, white/dark bg, accent #0066cc).

### Approach
Next.js 16 App Router on Vercel + Supabase (Auth/Postgres/Storage) + Resend. All 7 mindgames as TS modules. Open play + submit-vs-retry. No daily cap on submissions. 90-day detail retention; aggregates forever. Hard delete with cascade. Pure CSS variables + minimal Tailwind for Zetamac Pure.

### Success criteria
- [ ] Sign up email/pw + Google, same email merges to one profile
- [ ] Signup uses password + confirm-password; signin single-password
- [ ] Resend delivers verification, password reset, group invites
- [ ] Reset-password flow: forgot-password email -> click link -> /auth/callback -> set-new-password form (calls `supabase.auth.updateUser({ password })`) -> redirect /settings. Needs both: account section in /settings exposing "change password" for signed-in users, and a post-reset gate that requires new password before any other action.
- [ ] Onboarding: username, theme, optional avatar
- [ ] All 7 games playable with parity scoring
- [ ] Submit-vs-retry on each play
- [ ] `daily_aggregates` updates on every submit; never deleted
- [ ] Daily Double-XP rotation, 14-day calendar
- [ ] User pins reorder `/today`
- [ ] Profile shows streak ribbon, per-game cards (PB+date, worst, 7d median, 30d sparkline, plays), heatmap, history, graphs
- [ ] Settings hub: profile/account/preferences/notifications
- [ ] Privacy toggle: private = sparse profile, username still on leaderboards
- [ ] Hard delete cascades correctly
- [ ] Leaderboards: Today/7d/All-time + Daily Completion, filter Global/Friends/Group
- [ ] Mutual-accept friends, friend filter
- [ ] Public + private groups, leaderboard, invite via username/email/join_code
- [ ] Badges award automatically; elo-tier inert
- [ ] First-play tutorial overlay + replay
- [ ] Glicko-2 ratings persisted on every submission (UI gated)
- [ ] Visual: Zetamac Pure tokens app-wide, square corners, no shadows, 1px borders
- [ ] Lighthouse perf ≥90, a11y ≥95 on `/today`
- [ ] Playwright e2e: signup > onboarding > play > submit > leaderboard > friend > group

### Phases (v1 = 0-8 + 11; Phase 10 silent from Phase 2; Phase 12 post-launch)
- [ ] Phase 0: scaffold (Next, Supabase, Vercel, Resend, Zetamac tokens, Courier Prime)
- [x] Phase 1: auth + profiles + onboarding + settings + Resend templates + privacy + hard-delete
- [ ] Phase 1.5 (entry gate for Phase 2): close all open auth-flow risks/bugs. Ship reset-password landing page + change-password in /settings (R14). Confirm bugs.md Open is empty. R13 stays Phase 11 by decision; R1/R2 stay deferred by decision; R15 is ops hygiene.
- [ ] Phase 2: game shell + core 4 + open-ended play + submit-vs-retry
- [ ] Phase 3: remaining 3 games (Reaction, Mine, Word)
- [ ] Phase 4: today's hub + leaderboards + double-XP + pins + public-read gating
- [ ] Phase 5: profile + improvement UX (streak ribbon, per-game cards, heatmap, history, graphs)
- [ ] Phase 6: XP + badges
- [ ] Phase 7: friends
- [ ] Phase 8: groups
- [ ] Phase 9: tutorials
- [ ] Phase 10: Glicko-2 plumbing (silent, ELO_VISIBLE=false)
- [ ] Phase 11: launch readiness (notifications, empty states, SEO, legal, mobile pass, e2e, prod domain, rate limit)
- [ ] Phase 12 (post-launch): flip elo at threshold (≥25 users × ≥10 submissions/game)
