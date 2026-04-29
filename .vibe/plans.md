# Plans

## Active: mindlap v1
Full plan: `C:\Users\craigs\.claude\plans\snappy-rolling-porcupine.md` (approved 2026-04-28).

### Goal
Public multi-user rebuild of mindgames with auth, profiles, open-ended play, time-window leaderboards, friends, groups, badges, tutorials, daily double-XP, user pins, profile privacy. Glicko-2 silent in v1, UI flag-gated until threshold. Improvement-tracking is the headline. Style locked to Zetamac Pure (Courier Prime, white/dark bg, accent #0066cc).

### Approach
Next.js 16 App Router on Vercel + Supabase (Auth/Postgres/Storage) + Resend. All 7 mindgames as TS modules. Open play + submit-vs-retry. No daily cap on submissions. 90-day detail retention; aggregates forever. Hard delete with cascade. Pure CSS variables + minimal Tailwind for Zetamac Pure.

### Success criteria
- [x] Sign up email/pw + Google, same email merges to one profile
- [x] Signup uses password + confirm-password; signin single-password
- [x] Resend delivers verification, password reset, group invites
- [x] Reset-password flow: email link -> /auth/callback (writes one-shot `mindlap_pwreset` cookie crumb) -> /auth/set-password -> setNewPasswordAction (gated by crumb) -> /today. /settings exposes change-password (current pw verified via stateless side client; no live-session cookie rotation).
- [x] Onboarding: username, theme, optional avatar
- [ ] All 7 games playable with parity scoring (4/7 shipped: Math, Digit, N-Back, Stroop. Phase 3 ships Reaction/Mine/Word.)
- [x] Submit-vs-retry on each play
- [ ] `daily_aggregates` updates on every submit; never deleted (Phase 4 ships `process_submission()` PG fn that writes the aggregate alongside the submission insert. Phase 2 inserts to `submissions` only.)
- [ ] Daily Double-XP rotation, 14-day calendar (Phase 4)
- [ ] User pins reorder `/today` (Phase 4)
- [ ] Profile shows streak ribbon, per-game cards (PB+date, worst, 7d median, 30d sparkline, plays), heatmap, history, graphs (Phase 5)
- [x] Settings hub: profile/account/preferences (notifications page Phase 11)
- [x] Privacy toggle: private = sparse profile, username still on leaderboards
- [x] Hard delete cascades correctly
- [ ] Leaderboards: Today/7d/All-time + Daily Completion, filter Global/Friends/Group (Phase 4)
- [ ] Mutual-accept friends, friend filter (Phase 7)
- [ ] Public + private groups, leaderboard, invite via username/email/join_code (Phase 8)
- [ ] Badges award automatically; elo-tier inert (Phase 6)
- [ ] First-play tutorial overlay + replay (Phase 9)
- [ ] Glicko-2 ratings persisted on every submission (UI gated) (Phase 10, runs from Phase 4 silent)
- [x] Visual: Zetamac Pure tokens app-wide, square corners, no shadows, 1px borders
- [ ] Lighthouse perf >=90, a11y >=95 on `/today` (Phase 11)
- [ ] Playwright e2e: signup > onboarding > play > submit > leaderboard > friend > group (incremental, full pass Phase 11)

### Phases (v1 = 0-8 + 11; Phase 10 silent from Phase 4; Phase 12 post-launch)
- [x] Phase 0: scaffold (Next, Supabase, Vercel, Resend, Zetamac tokens, Courier Prime)
- [x] Phase 1: auth + profiles + onboarding + settings + Resend templates + privacy + hard-delete
- [x] Phase 1.5: reset-password landing + change-password in /settings + recovery-cookie crumb gate (closes R14)
- [x] Phase 2: game shell + 4 core games (Math/Digit/N-Back/Stroop) + 3-2-1 countdown + submit-vs-retry + Enter/R/N power-user shortcuts
- [ ] Phase 3 (in progress): remaining 3 games (Reaction, Mine, Word)
- [ ] Phase 4 (in progress, essentials only): pins (click-to-pin), `[2x]` pill via deterministic daily_bonus, top-5 leaderboard preview on /today, /leaderboards page (Today/7d/All-time x 7 games, anonymous full visibility), public-read gating verified, `process_submission()` PG fn (aggregates + streak + plays counters; XP/Glicko stubbed for Phase 6/10).
- [ ] Phase 4.5 follow-up: drag-reorder pins, leaderboards Friends/Group filter (post-Phase-7/8), Daily Completion sub-tab, 14-day double-XP calendar widget.
- [ ] Phase 5: profile + improvement UX (streak ribbon, per-game cards, heatmap, history, graphs)
- [ ] Phase 6: XP + badges (full event log, multipliers, streak bonus, badge eval triggers)
- [ ] Phase 7: friends (mutual-accept, friend filter on leaderboards, /f/<friend_code> deep-link)
- [ ] Phase 8: groups (public/private, roles, /g/<join_code>, invites by username/email)
- [ ] Phase 9: tutorials (cutout-mask overlay, first-play auto, master skip)
- [ ] Phase 10: Glicko-2 plumbing surfaced when ELO_VISIBLE flips (post-threshold)
- [ ] Phase 11: launch readiness (notifications, empty states, SEO, legal, mobile pass, full e2e, prod domain, rate limiting per R13)
- [ ] Phase 12 (post-launch): flip elo at threshold (>=25 users x >=10 submissions/game)
