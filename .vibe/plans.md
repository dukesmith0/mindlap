# Plans

## Active: mindlap v1 build (Zetamac Pure style, open-ended play)

Full plan: `C:\Users\craigs\.claude\plans\snappy-rolling-porcupine.md` (approved 2026-04-28, amended 2026-04-28).

### Goal
Public multi-user rebuild of mindgames with auth, profiles, open-ended play, time-window leaderboards, friends, groups, badges, tutorials, daily double-XP rotation, user game pins, profile privacy. Glicko-2 silent in v1; UI flag-gated until threshold. Improvement-tracking is the v1 headline UX. Visual style locked to Zetamac Pure (Courier Prime, white/dark bg, accent #0066cc).

### Approach
Next.js 16 App Router on Vercel + Supabase (Auth/Postgres/Storage) + Resend for transactional email. All 7 mindgames ported as TS modules. Open play: any game any time, submit-vs-retry on each play, scores capped at 20/game/day FIFO with 90-day detail retention. Leaderboards = time slices (Today/7d/All-time). v1 reward loop: streak + PB + badges + raw scores + 2x-day. Hard delete with cascade on account removal. Pure CSS variables + minimal Tailwind utilities for Zetamac Pure style.

### Success Criteria
- [ ] Sign up email/pw + Google, same email merges to one profile
- [ ] Resend delivers verification, password reset, group invites
- [ ] Onboarding: username, theme (light/dark), optional avatar
- [ ] All 7 games playable in TS with parity scoring
- [ ] Submit-vs-retry on each play. Submit writes; retry replays without saving
- [ ] Storage cap 20/(user,game,day) FIFO enforced
- [ ] `daily_aggregates` updates on every submit; never deleted
- [ ] Daily Double-XP rotation: 2 of 7 games per UTC day, calendar visible 14 days out
- [ ] User pins reorder `/today` cards
- [ ] Profile: streak ribbon pulses, per-game cards (PB+date, worst, 7-day median, 30-day sparkline, plays), heatmap, daily history table, graphs page with All-plays / Daily-average toggle
- [ ] Settings hub: profile/account/preferences/notifications. Theme toggle, pin reorder, tutorial controls
- [ ] Privacy toggle: private = sparse profile view, but username still visible on leaderboards
- [ ] Hard delete cascades correctly
- [ ] Leaderboards: per-game raw best (Today/7d/All-time) + Daily Completion, filter Global/Friends/Group
- [ ] Mutual-accept friends, friend filter on leaderboards
- [ ] Private invite-only groups with leaderboard, invite by username or Resend email-link
- [ ] Badges award automatically (streak/PB/achievement); elo-tier inert
- [ ] Per-game tutorials on first play, replay via "How to play"
- [ ] Glicko-2 ratings persisted on every submission (UI gated)
- [ ] Visual: Zetamac Pure tokens applied app-wide. Courier Prime only. Square corners. No shadows. 1px borders. Streak ribbon pulse animation only
- [ ] Lighthouse perf ≥ 90, a11y ≥ 95 on `/today`
- [ ] Playwright E2E: signup > onboarding > today > play > submit > streak/badge > leaderboard > friend > group

### Tasks (phases)
- [ ] Phase 0: scaffold (Next.js, Supabase, Vercel, Resend, Zetamac Pure tokens, Courier Prime)
- [ ] Phase 1: auth + profiles + onboarding + preferences hub + Resend templates + privacy toggle + hard-delete cascade
- [ ] Phase 2: game shell + core 4 + open-ended play + submit-vs-retry + storage cap trigger
- [ ] Phase 3: remaining 3 games (Reaction, Minesweeper, Word Recall)
- [ ] Phase 4: today's hub + leaderboards + double-XP rotation + user pins + public-read gating
- [ ] Phase 5: profile + streak ribbon + per-game improvement cards + heatmap + history table + graphs page
- [ ] Phase 6: XP + badges (streak/PB/achievement, elo-tier inert)
- [ ] Phase 7: friends (mutual-accept, friend filter)
- [ ] Phase 8: groups (invite-only, leaderboards, Resend email-link tokens)
- [ ] Phase 9: tutorials (configs, overlay, replay, master skip)
- [ ] Phase 10: Glicko-2 plumbing (silent, ELO_VISIBLE=false)
- [ ] Phase 11: launch readiness (notifications, empty states, SEO, legal, mobile pass, E2E, prod domain)
- [ ] Phase 12 (post-launch): flip elo at threshold (≥25 users × ≥10 submissions/game)
