# Plans

## Active: mindlap v1
Full plan: `C:\Users\craigs\.claude\plans\snappy-rolling-porcupine.md` (approved 2026-04-28).

### Goal
Public multi-user rebuild of mindgames with auth, profiles, open-ended play, time-window leaderboards, friends, groups, badges, tutorials, daily double-XP, user pins, profile privacy. Glicko-2 silent in v1, UI flag-gated until threshold. Improvement-tracking is the headline. Style locked to Zetamac Pure (Courier Prime, white/dark bg, accent #0066cc).

### Approach
Next.js 16 App Router on Vercel + Supabase (Auth/Postgres/Storage) + Resend. 7 games as TS modules, parity-tested. Open play + submit-vs-retry. No daily cap on submissions. 90-day detail retention; aggregates forever. Hard delete with cascade. Pure CSS variables + minimal Tailwind for Zetamac Pure.

### Success criteria
- [x] Sign up email/pw + Google, same email merges to one profile
- [x] Signup uses password + confirm-password; signin single-password
- [x] Resend delivers verification, password reset, group invites (groups Phase 8)
- [x] Reset-password flow: forgot-pw email -> /auth/callback (writes recovery cookie crumb) -> /auth/set-password (gated) -> /today. /settings exposes change-password (current pw verified via stateless side client; live session not rotated).
- [x] Onboarding: username, theme, optional avatar
- [x] All 7 games playable with parity scoring
- [x] Submit-vs-retry on each play, with `+N xp` + `[new PB]` indicator
- [x] daily_aggregates updates on every submit (process_submission RPC)
- [x] Daily Double-XP rotation deterministic (FNV-1a hash of PT date), `[2x xp]` pill on /today
- [ ] 14-day double-XP calendar widget (Phase 4.5)
- [x] User pins reorder /today (click-to-pin; drag-reorder Phase 5.5)
- [x] Profile shows streak ribbon, level chip, all-time PB count, per-game cards (PB+date, worst, 7d median, 30d plays), badge wall
- [ ] Profile heatmap (90d), sparkline (30d), history table, graphs page (Phase 5.5)
- [x] Settings hub: profile / preferences / account / password / delete
- [ ] Notifications settings (Phase 11)
- [x] Privacy toggle: private = sparse profile + hidden from leaderboards (decisions.md 2026-04-28 reconciliation)
- [x] Hard delete cascades correctly
- [x] Leaderboards: Today / 7d / All-time × 7 game tabs, anonymous-readable
- [ ] Daily Completion sub-tab on leaderboards (Phase 4.5)
- [x] Friends scope on leaderboards (Phase 7); Group filter still pending Phase 8
- [x] Mutual-accept friends + friend filter (Phase 7). add-by-@username AND friend_code both supported via `find_user_by_username` (0011) + `find_user_by_friend_code` (0004).
- [ ] Public + private groups, leaderboard, invite via username/email/join_code (Phase 8)
- [x] Streak/PB/all-seven-today badges award automatically via process_submission
- [ ] Achievement badges (perfect N-back day, sub-300ms reaction) (Phase 5.5)
- [ ] Elo-tier badges inert (Phase 10/12)
- [ ] First-play tutorial overlay + replay (Phase 9)
- [ ] Glicko-2 ratings persisted on every submission (Phase 10, silent)
- [x] Visual: Zetamac Pure tokens app-wide, square corners, no shadows, 1px borders. Streak 🔥 emoji exception per 2026-04-28 decision.
- [ ] Lighthouse perf ≥90, a11y ≥95 on /today (Phase 11)
- [ ] Playwright e2e: signup > onboarding > play > submit > leaderboard > friend > group (incremental, full pass Phase 11)

### Phases
- [x] Phase 0: scaffold (Next, Supabase, Vercel, Resend, Zetamac tokens, Courier Prime)
- [x] Phase 1: auth + profiles + onboarding + settings + Resend templates + privacy + hard-delete
- [x] Phase 1.5: reset/change password + recovery-cookie crumb gate (closes R14)
- [x] Phase 2: game shell + 4 core games + 3-2-1 countdown + submit-vs-retry + Enter/R/N shortcuts
- [x] Phase 3: remaining 3 games (Reaction, Minesweeper, Word Recall)
- [x] Phase 4 essentials: pins, [2x] pill, top-3 leaderboard preview, /leaderboards, public-read gating, process_submission PG fn
- [x] Phase 5 essentials: /profile/[username] + per-game stats + badge wall
- [x] Phase 6: XP events (0008/0009/0010) + streak/PB/all-seven badge eval inside process_submission
- [x] Polish batch + 90-day heatmap + theme-toggle latency fix (commit 1, `46637bc`)
- [x] Phase 7: friends (mutual-accept + add-by-username AND friend-code + leaderboards Friends scope + /f/<code> deep-link with cookie stash + 30/hour rate limit + accepts_friend_requests opt-out + ProfileSocialButtons + #41 friends-only Today mini-leaderboard reframe). commit 2 (staged)
- [ ] Phase 4.5 follow-up: drag-reorder pins, Daily Completion sub-tab, 14-day double-XP calendar widget, leaderboards Group filter (post-Phase-8)
- [ ] Phase 5.5 follow-up: 30-day SVG sparkline, /profile/me/{history,graphs} + CSV export, achievement badges
- [ ] Phase 8: groups (public/private, roles, /g/<join_code>, invites by username/email)
- [ ] Phase 9: tutorials (cutout-mask overlay, first-play auto, master skip)
- [ ] Phase 10: Glicko-2 plumbing surfaced when ELO_VISIBLE flips (post-threshold)
- [ ] Phase 11: launch readiness (notifications, empty states, SEO, legal, mobile pass, full e2e, prod domain, rate limiting per R13)
- [ ] Phase 12 (post-launch): flip elo at threshold (≥25 users × ≥10 submissions/game)

### Pre-launch reviews (logged in future.md)
- XP-per-level scaling curve (`level = floor(sqrt(xp/100)) + 1`) — sample population data once we have ≥1 week of users; re-tune the divisor without breaking persisted XP.
