# Decisions

| Date       | Person            | Notes |
|------------|-------------------|-------|
| 2026-04-28 | dukesmith0        | Approved v1 plan. Stack = Next.js 16 App Router + Supabase + Vercel + TS strict; RSC default, Server Actions for mutations. |
| 2026-04-28 | dukesmith0        | Email = Resend via Supabase Auth SMTP hook (verification, reset, group invites). |
| 2026-04-28 | dukesmith0        | Auth = email/pw + Google with identity linking on shared verified email. `handle_new_user` trigger creates `profiles` + `profile_secrets`. |
| 2026-04-28 | dukesmith0        | HTTP security headers (CSP, HSTS, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP=same-origin) in `next.config.ts`. CSP allows Supabase REST+ws + Speed Insights only. |
| 2026-04-28 | dukesmith0        | Dev gates `'unsafe-eval'` + `ws://localhost:*` behind `NODE_ENV === "development"`. Prod cannot inherit dev exceptions. |
| 2026-04-28 | dukesmith0        | Proxy auth gate at `proxy.ts` (Next 16 convention, not `middleware.ts`). `isPublicPath()` excludes `/profile/me*`. Matcher excludes `/api/*`. Refreshed cookies copied onto redirects. |
| 2026-04-28 | dukesmith0        | Keep all 7 mindgames, port to TS. Math / Digit Span / N-Back / Stroop = ★ core; Reaction / Minesweeper / Word Recall secondary. |
| 2026-04-28 | dukesmith0        | Open-ended play, no daily seed. Each game uses its own random distribution (zetamac model). |
| 2026-04-28 | dukesmith0        | Storage: every submitted play stored. Detail rows deleted at 90 days; `daily_aggregates` kept forever. No per-day cap. |
| 2026-04-28 | dukesmith0        | Daily boundary = America/Los_Angeles (PT). `played_pt_date` GENERATED column on submissions. |
| 2026-04-28 | dukesmith0        | Streak = any submission per PT day maintains. No grace period. Resets to 0 on missed day. |
| 2026-04-28 | dukesmith0        | 3-2-1-Go countdown before every game. |
| 2026-04-28 | dukesmith0        | Style = Zetamac Pure (locked). Courier Prime via `next/font/local`. Pure CSS variables + minimal Tailwind. 1px borders, square corners, no shadows, no gradients. |
| 2026-04-28 | dukesmith0        | Animations only: streak ribbon pulse 2s; countdown step opacity fade 240ms; result XP/PB fade 320ms. No transforms. |
| 2026-04-28 | dukesmith0        | App shell: 200px sidebar, `>` accent prefix on active, 720px main column, 48/64px padding. Mobile ≤720px collapses sidebar to top strip. |
| 2026-04-28 | dukesmith0        | Reverse "no emoji" rule for streak only. StreakRibbon uses 🔥 with tier-coloured numbers. |
| 2026-04-28 | dukesmith0        | Extend emoji exception list to badges. Each badge_key maps to one themed emoji in `lib/badges/icons.ts`. |
| 2026-04-28 | dukesmith0        | XP bar in TopBar. `levelFromXp(xp) = floor(sqrt(max(0, xp)/100)) + 1`; `xpForLevel(N) = 100 * (N-1)^2`. 96px desktop / 64px mobile. |
| 2026-04-28 | dukesmith0        | v1 reward loop = streak + PB + badges + raw-score leaderboards + double-XP days. Elo is a post-launch flip. |
| 2026-04-28 | CLAUDE-dukesmith0 | XP rules in `lib/xp.ts` + 0008/0009/0010: 5 xp/play capped 5/(user, game, PT date); doubles to 10/play with 10/day cap on bonus days. Daily PB = 25 xp × streak_mult × bonus_mult. Streak mult `min(2.5, 1.0 + 0.1 * (streak-1))` plateauing at streak 16. |
| 2026-04-28 | CLAUDE-dukesmith0 | Pre-multiply XP at the caller in `process_submission`; `award_xp(p_amount, p_multiplier)` writes `xp_events.amount = p_amount` (final), `multiplier` informational. |
| 2026-04-28 | CLAUDE-dukesmith0 | `process_submission` RETURNS jsonb (0010) to avoid OUT-param shadowing of `daily_aggregates` columns. |
| 2026-04-28 | CLAUDE-dukesmith0 | Daily double-XP = deterministic FNV-1a hash of PT date → 2 of 7 game keys. No DB persistence; determinism alone closes R3. |
| 2026-04-28 | CLAUDE-dukesmith0 | `is_bonus_game` derived server-side via `isBonusGame(ptDate(), key)`. Client-trustable in v1 (bounded inflation). Future hardening: derive inside the function (later filed as #93). |
| 2026-04-28 | CLAUDE-dukesmith0 | `eval_badges(user_id)` (internal, no GRANT) called from `process_submission` after streak update. Grants streak (3/7/30/100), per-game first-PB, all-seven-today. Idempotent via `ON CONFLICT DO NOTHING`. |
| 2026-04-28 | dukesmith0        | Profile improvement-tracking is the v1 headline. Profile = streak ribbon + level + XP bar + all-time PB count + total plays + longest streak + per-game cards + badge wall. |
| 2026-04-28 | dukesmith0        | `/settings` hub: Profile / Preferences / Account / Password / Delete. |
| 2026-04-28 | dukesmith0        | Default avatar = 28px circle, `--ink` fill, first letter of display_name (or username) in white. 20-color palette in `lib/auth/avatar-palette.ts`. |
| 2026-04-28 | dukesmith0        | Pinning: globally-starred core uses `*`, user pins use `>`. Independent. |
| 2026-04-28 | dukesmith0        | Privacy: `profiles.is_public` default true. False = sparse `/profile/<username>`. |
| 2026-04-28 | CLAUDE-dukesmith0 | Privacy + leaderboards: 0003 RLS excludes private-profile users entirely from anonymous / non-friend leaderboards. Tracked-as-design for v1. |
| 2026-04-28 | CLAUDE-dukesmith0 | `profile_secrets` table holds friend_code with owner-only RLS. RPCs `find_user_by_friend_code` + `regenerate_friend_code` SECURITY DEFINER, granted authenticated. |
| 2026-04-28 | dukesmith0        | Username = citext UNIQUE. 6-month rotation cron renames inactive accounts. Profanity filter + reserved list. Rate limit 1 change / 30 days. |
| 2026-04-28 | dukesmith0        | Hard delete with cascade. `auth.users` row + all data removed. Group ownership transfers to oldest admin or dissolves. |
| 2026-04-28 | dukesmith0        | Anti-enumeration: `requestPasswordResetAction` always returns ok; signup treats "already registered" as success. |
| 2026-04-28 | dukesmith0        | `signOutAction` pinned to `scope: 'global'` (revoke all refresh tokens server-side). |
| 2026-04-28 | dukesmith0        | Theme cookie httpOnly + secure-in-prod. Server-only consumption (root layout reads via `cookies()`). |
| 2026-04-28 | dukesmith0        | All `actions/*.ts` declare `import "server-only"` to fence service-role / admin paths. |
| 2026-04-28 | dukesmith0        | Password = 10+ chars, ≥1 number/symbol (OWASP ASVS L1). Common-passwords list deferred. |
| 2026-04-28 | CLAUDE-dukesmith0 | One-shot `mindlap_pwreset` cookie set only by `/auth/callback?next=/auth/set-password` (5min TTL, httpOnly + sameSite=lax + secure-in-prod). `setNewPasswordAction` requires its presence. Cookie burned on success / expired-session. (Later flagged as #98 — gate also needs `?type=recovery`.) |
| 2026-04-28 | CLAUDE-dukesmith0 | `changePasswordAction` verifies current password via stateless side `@supabase/supabase-js` client (`persistSession: false`) so live SSR cookies and other tabs are not rotated by the verification call. |
| 2026-04-28 | CLAUDE-dukesmith0 | `RECOVERY_COOKIE` constants live in `lib/auth/recovery-cookie.ts` (not in `actions/auth.ts`; "use server" files only export async functions). |
| 2026-04-28 | dukesmith0        | Friends = mutual-accept; friend filter on leaderboards. |
| 2026-04-28 | dukesmith0        | Groups = per-group public/private toggle (owner-flippable). Roles owner / admin / member. Cap default 100, max 1000. Public-group request-approval deferred to post-launch. |
| 2026-04-28 | dukesmith0        | 8-char codes (friend_code + group join_code), Crockford-ish alphabet (no 0/O/1/I/L). Friend codes regen-from-settings; join_codes regen-by-owner. |
| 2026-04-28 | dukesmith0        | Shareable links `/f/<friend_code>`, `/g/<join_code>`. Anon click stashes code in signed cookie; signup auto-completes. |
| 2026-04-28 | dukesmith0        | Friend request rate limit = 30 outgoing/hour/user. |
| 2026-04-28 | dukesmith0        | Tiers percentile-based: top 1% diamond, 5% platinum, 15% gold, 35% silver, rest bronze. Recomputed weekly. |
| 2026-04-28 | dukesmith0        | Tutorials per-game step configs in `lib/tutorials/<game>.ts`, cutout-mask overlay. First-play auto with prominent Skip. Master skip in settings. |
| 2026-04-28 | dukesmith0        | Glicko-2 sidelined v1: ratings persist on every submitted score, UI gated by `ELO_VISIBLE=false`. Threshold to flip = ≥25 users × ≥10 submissions/game. |
| 2026-04-28 | dukesmith0        | First-launch empty leaderboard copy: "Be the first to set a score on Speed Math today!" + Play CTA. |
| 2026-04-28 | dukesmith0        | UX = desktop-first responsive. Mobile must work, not optimized first. |
| 2026-04-28 | dukesmith0        | Approach B for combined Phase 3 + 4: ship Phase 3 in full + Phase 4 essentials together; defer drag-pins / friends-filter / Daily Completion / 14-day calendar to Phase 4.5 / 5. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: no em dashes in any output. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: keep `.vibe/` files concise and token-efficient. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: when a contradiction surfaces, ship middle path with explicit risk note rather than block. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: cross-migration consistency. When moving a column to a new table, grep every plpgsql function that referenced it. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: on Supabase, plpgsql functions touching pgcrypto must `set search_path = public, extensions`. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: the Mgmt-API migration path bypasses Supabase's default-priv seeding for new tables. Always run a GRANT-all + ALTER DEFAULT PRIVILEGES block. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: `RETURNS TABLE(...)` declares OUT parameters in the function body namespace. Use `RETURNS jsonb` or rename OUT params. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: `"use server"` files can only export async functions. Constants must live in a separate non-server module. |
| 2026-04-28 | CLAUDE-dukesmith0 | Lesson: dev-only CSP relaxations must be gated by `NODE_ENV === "development"` so prod cannot inherit dev exceptions. |
| 2026-04-29 | dukesmith0        | Polish batch scope = full sweep (14 bugs incl. #44 theme latency). Ships as commit 1 with #42 90-day heatmap; defers other 4.5/5.5 follow-ups until after Phase 7. |
| 2026-04-29 | dukesmith0        | Phase 7 scope = full (mutual-accept friendships + `/friends` + add-by-@username AND friend_code + Friends scope on leaderboards + `/f/<code>` + 30/hour rate limit). Ships as commit 2. |
| 2026-04-29 | dukesmith0        | Reverse #41: keep Today mini-leaderboard, convert to friends-only top-5; if my today score is outside top-5, append `…` then a row with my rank below. |
| 2026-04-29 | dukesmith0        | Add `profiles.accepts_friend_requests` opt-out (default true). `addFriendAction` reads it; ProfileSocialButtons shows "[user is not accepting requests]". |
| 2026-04-29 | dukesmith0        | Dark mode bg lifted off pure black to `#1e242b`. `--line` and `--muted` brightened in step (`#353c44`, `#9aa0a6`). |
| 2026-04-29 | dukesmith0        | Social buttons live on their own row below the profile header, right-aligned. |
| 2026-04-29 | CLAUDE-dukesmith0 | `actions/friendships.ts` exposes 5 actions: addFriend, accept, decline, cancel, remove. addFriend handles "they already requested me" race by accepting the inbound row. |
| 2026-04-29 | CLAUDE-dukesmith0 | Rate limit = per-user-per-hour DB count (30 outgoing/hour) in `lib/rate-limit.ts`. KV/Upstash swap deferred (R13). |
| 2026-04-29 | CLAUDE-dukesmith0 | `/f/<code>` deep-link: anon stashes `mindlap_friend_code` (httpOnly + sameSite=lax + secure-in-prod, 30-day TTL); `completeOnboardingAction` consumes one-shot. |
| 2026-04-29 | dukesmith0        | Tier 3 polish (commit 3) over Tier 1 newcomer-experience — ship fast wins while design questions stay open. |
| 2026-04-29 | dukesmith0        | Avatar identity rework (#48): click-to-edit popup off the avatar (TopBar + own-profile + /settings). Remove "avatar color" picker block. Emoji exception extended to avatars (single grapheme). |
| 2026-04-29 | CLAUDE-dukesmith0 | Single-grapheme validation via `Intl.Segmenter` + NFC normalization in `lib/auth/avatar-emoji.ts`. Cap 32 chars (allows ZWJ + skin-tone). Tightening to regex CHECK filed as R18. |
| 2026-04-29 | CLAUDE-dukesmith0 | `setAvatarColorAction` replaced by `setAvatarIdentityAction({ color, emoji })` so a save commits both fields atomically. |
| 2026-04-29 | dukesmith0        | TopBar avatar reverted to plain `<Link>` to own profile (no editor). Editing only on profile header + /settings. TopBar avatar = navigation, not modal. |
| 2026-04-29 | dukesmith0        | Curated 50-emoji palette in `lib/auth/avatar-emoji-palette.ts` (faces / brain / animals / activities / nature) as a 10-col grid in AvatarEditor. |
| 2026-04-29 | dukesmith0        | Tier 1 design calls — #51 milestone banner option A; #52 score-context line option A; #54 direction badge auto-open; #56 3rd onboarding step. |
| 2026-04-29 | dukesmith0        | Tier 2 — #62 Countdown STEP_MS 600 → 500; #53 keep `set` date + rename `worst` → `low (week)`. |
| 2026-04-29 | dukesmith0        | Streak vs skill XP — keep current "more XP for higher streak" rule. Future tuning pairs with scaled XP-per-level + streak-extension options. |
| 2026-04-29 | dukesmith0        | Heatmap fate Phase 9 — keep heatmap AND add 30-day sparkline; profile gets `[plays] [score]` toggle. |
| 2026-04-29 | dukesmith0        | Phase 13 launch readiness owns every remaining open bug + risk. |
| 2026-04-30 | dukesmith0        | Big batch commit 6 — Phases 7.5 (#51/#52/#54/#56) + 7.6 (#62/#53) + 7.7 (#58) + 8 (#59/#45/#14/#64) + optimization sweep + reviewer fixes. |
| 2026-04-30 | dukesmith0        | Persona-review re-prioritized Phase 9 ahead of 4.5 / 5.5 — trend visualization is the #1 missing answer to "am I getting better?". |
| 2026-04-30 | CLAUDE-dukesmith0 | Avatar centering rewritten to SVG `<text>` + `dominant-baseline="central"` + post-mount `getBBox()`. Module-level `Map<string, Offset>` memo so leaderboards renders 100 avatars with one measurement per unique glyph. |
| 2026-04-30 | CLAUDE-dukesmith0 | DelegatedTooltips: single document-level `pointermove` + `focusin` listener watches `data-tip` attrs. (Later flagged as #71 — pointermove is too hot.) |
| 2026-04-30 | CLAUDE-dukesmith0 | Modal primitive: focus trap + body scroll lock + mousedown+click backdrop sequence + Escape close. AvatarEditor + ConfirmDialog + DirectionsModal all built on it. |
| 2026-04-30 | CLAUDE-dukesmith0 | Toast: provider in AppShell, `useToast()` returns `{show: noop}` outside provider. 4s TTL. role=status for info, role=alert for error. |
| 2026-04-30 | CLAUDE-dukesmith0 | DST fix in `/today` PB-today detection: hardcoded `-08:00` swapped for 24h UTC window + `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' })` client filter. Resolves R19. |
| 2026-04-30 | CLAUDE-dukesmith0 | Friends-mini-leaderboard: 7 separate `submissions` queries → one `daily_aggregates` query with `.in('game_key', ...)` + JS-side bucketing. Drops 7 RTTs to 1 + removes 2000-row truncation risk. |
| 2026-04-30 | CLAUDE-dukesmith0 | `/today` 5 sequential awaits → one `Promise.all`. ~5 RTT saving on cold renders. |
| 2026-05-03 | dukesmith0        | R1 anti-cheat (replay tokens) → post-launch (not Phase 13). Launch ships with #58 footnote. |
| 2026-05-03 | dukesmith0        | Net-new games → post-launch. Phase 14 dissolved; slate decided when phase scopes. |
| 2026-05-03 | dukesmith0        | Custom timer durations + per-second ranking → post-launch. Don't expand leaderboard schema before launch. |
| 2026-05-03 | dukesmith0        | Cross-game leaderboards → post-launch. Composite chosen at scope-time. |
| 2026-05-03 | dukesmith0        | Community tab `/community` → minimal scope, post-launch. Player search → public profile → add friend. No feed, no other surface. |
| 2026-05-03 | dukesmith0        | Improvement score v0 → post-launch. Don't pull a Phase-15-lite version into Phase 9.5; full population-aware version ships post-launch. |
| 2026-05-03 | dukesmith0        | XP-per-level curve retune → pre-launch (Phase 13). Target capped scaling, ~level 100 cap, 2-3 days/level at top. Simulation-driven. Cannot break persisted XP. |
| 2026-05-03 | dukesmith0        | `/friends` inline empty-state → pre-launch (Phase 13). Migrate `<p style={{...}}>[no incoming requests]</p>` patterns to `<EmptyState>` primitive. |
| 2026-05-03 | dukesmith0        | Cookie consent UX (Phase 13) decided. Lightweight, low-friction, privacy-first. Tracking scope: games / traffic / profiles / sign-ins (internal). No third-party analytics, no ad networks. |
| 2026-05-03 | CLAUDE-dukesmith0 | Doc reshuffle. Deleted `plans.md`. `current.md` = next phase only. `future.md` = pre-launch + post-launch + inbox + open questions. Every open bug + active risk maps to a specific phase. |
| 2026-05-03 | CLAUDE-dukesmith0 | Adversarial review batch (6 lenses). Filed 46 bugs (#66-#111) and 7 risks (R20-R26). All explicit fixes mapped to Phase 13; ambiguous fixes added to Open Questions. |
| 2026-05-03 | dukesmith0        | Standardize `.vibe/` doc formats; record in CLAUDE.md. bugs/risks: `ID | Name | Note` in High/Medium/Low priority sections. current/future: chronological phase headers with one-line overviews + flat checkbox items referencing IDs. decisions: single chronological table. |
| 2026-05-03 | dukesmith0        | CLAUDE.md un-gitignored and tracked. Project-wide instructions for any developer. |
| 2026-05-03 | dukesmith0        | Scripts consolidation. Locked layout: `scripts/_lib/{env,mgmt-api,admin-api}.mjs` + `db-migrate.mjs` + `db-doctor.mjs` + `db-seed.mjs` + `user-create.mjs` + `seeds/walkthrough.sql`. npm wrappers `db:migrate` / `db:doctor` / `db:seed` / `user:create`. Closes #66 + #78. |
| 2026-05-03 | dukesmith0        | Vercel project env is the canonical env source. `.env.local` is a hot copy via `vercel env pull --yes`. New keys land in Vercel first, then re-pull. |
| 2026-05-03 | dukesmith0        | Style consolidation. Locked canonical Zetamac Pure system: 5 base + `--danger` + `--on-accent` + 3 reaction tokens. Style-reference folder reduced to `style-page.html` + `README.md`; `zetamac-pure.html` deleted (superseded). |
| 2026-05-03 | CLAUDE-dukesmith0 | Canonical button family is exactly six: `<button>`, `.btn-link`, `.btn-danger`, `.btn-sm`, `.btn-icon`, `.btn-ghost` (with `.game-tappable` JSX alias). Deleted `.today-search-clear`, `.toast-dismiss`, `.game-card-pin`, `.game-card-pill`, and `BracketPill`. |
| 2026-05-03 | CLAUDE-dukesmith0 | Canonical bracketed-status convention is `.tag` / `.tag-accent` / `.tag-error`. Brackets live in pseudo-elements; do not include them in JSX content. Errors flipped from `--accent` to `--danger` so they don't read as links. |
| 2026-05-03 | CLAUDE-dukesmith0 | Native `<input type="checkbox">` and `<input type="radio">` styled to match the system. Single allowed `transform` exception in the system is the checkmark glyph rotate in `:checked::after`. |
| 2026-05-03 | CLAUDE-dukesmith0 | Inline-style utilities `.text-muted-sm` (13px), `.text-muted-xs` (12px), `.numeric` (tabular-nums) replace repeated `style={{ color: "var(--muted)", fontSize: 12\|13 }}` patterns. Layout-specific inline styles (gap, margin, width) stay inline. |
| 2026-05-03 | CLAUDE-dukesmith0 | Every form (login, signup, set-password, settings × 4 sections, AddFriend, AvatarEditor) routes label/input pairs through `<FormField>`. `FormField` itself uses `.text-muted-xs` for label/hint and `.tag-error` for error. |
| 2026-05-03 | CLAUDE-dukesmith0 | `DEFAULT_AVATAR_COLOR` from `lib/auth/avatar-palette.ts` is the single source of truth for the slate fallback color. `TopBar.tsx` + `app/(authed)/onboarding/page.tsx` import it instead of literal `#64748b`. |
| 2026-05-03 | CLAUDE-dukesmith0 | Avatar SVG glyph fill (`Avatar.tsx`) and reaction-phase text (`ReactionGame.tsx`) intentionally stay literal `#ffffff` — they sit on user-color / phase-color backgrounds, not on `var(--accent)`, so the contrast pair is "white on saturated mid-tone", not on-accent. Documented atop `app/globals.css`. |
| 2026-05-03 | dukesmith0        | New-user flow philosophy = play-first with ghost-rank + claim on signup-or-signin. Conversion ask happens at score screen, not landing. Supersedes prior "Submit-vs-retry" decision. Brainstorm captured in 2026-05-03 chat session. |
| 2026-05-03 | dukesmith0        | Anon scope = 2 plays per PT day, midnight-LA reset. Anon scores live in `pending_claims` (5-min TTL); never written to `submissions` until claimed. Ghost rank computed live vs `daily_aggregates` (no insert). Supersedes prior "Public-read: anonymous play requires auth". |
| 2026-05-03 | dukesmith0        | Tier model = anon / free / Supporter ($5/mo at launch; $50/yr added with subscription integration). Gameplay never paywalled. Free is fully usable forever. Supporter = analytics depth + retention + jump-start. |
| 2026-05-03 | dukesmith0        | Subscription naming = "Supporter". Pricing-page tone = "covers the bills" (no per-month dollar disclosure required); cancel one-click; no retention dialog. No weekly digest email. No custom timer durations. |
| 2026-05-03 | dukesmith0        | Supporter feature = jump-start option on staircase games (Digit Span, N-Back, Word Recall). Start at PB-1 instead of from scratch. Opt-in per game. Replaces the originally-proposed "custom timer". |
| 2026-05-03 | dukesmith0        | Supporter free-vs-paid gates: forever detail history (vs 90-day prune for free), all-time leaderboard percentile/z columns, advanced graphs, CSV/JSON export, jump-start, small username flair, ≥3 pinned badges. |
| 2026-05-03 | dukesmith0        | Supporter upsell rule = inline only at moment-of-friction (CSV button, all-time history scroll, cross-game graph tab, custom-pin slot >3, jump-start setting). Never on `/today`, `/play`, score screen, `/leaderboards`, or as ambient sidebar nag. Pricing surfaces via footer + `/settings` only. |
| 2026-05-03 | dukesmith0        | Landing page layout = B. Tagline + 3 goal bullets (`> play 7 short focus games`, `> beat your own PBs and build a streak`, `> see how you rank against everyone today`) + 7 game tiles (name + one-line description) + "play any game free — no signup needed" CTA. Separate from gaming page. |
| 2026-05-03 | dukesmith0        | Signup field set = email + password + username for email path; username-only post-OAuth for new Google users. No theme / friend-code / avatar collection at signup. Onboarding wizard reduced to username-only. Supersedes 3-step onboarding. |
| 2026-05-03 | dukesmith0        | Single auth UI component, mode toggle (signin/signup). Used in score-sheet modal (claim path), `/login`, and `/signup`. Same OAuth + email/password flow in all three contexts. |
| 2026-05-03 | dukesmith0        | Anti-cheat v1 = 5 server-side validation gates per submission: (1) JWT signature + expiry, (2) duration ≈ expected ±0.5s, (3) input_count plausible, (4) score ≤ humanly-possible cap, (5) score achievable from seed. Server-issued game-session JWT carries `{ game_key, seed, user_or_anon_id, issued_at, expected_duration }`. Replay-token (full input replay) stays post-launch (R1). Supersedes prior "Anti-cheat v1 = RLS + DB CHECK". |
| 2026-05-03 | CLAUDE-dukesmith0 | Score-claim cookie = httpOnly + secure-in-prod, 5-min TTL, signed; carries `pending_claims.id`; survives OAuth round-trip; consumed on first authed page load post-signup/signin. |
| 2026-05-03 | dukesmith0        | Score screen 3-button = `retry [R]` (discard, replay) / `save [S]` (submit, return to /today) / `save+retry [Enter]` (submit then replay). Yesterday-delta on by default (`PB +6 vs yesterday`). New-PB ribbon flashes on personal best. Supersedes prior "Submit-vs-retry: retry replays without saving" decision. |
| 2026-05-03 | dukesmith0        | Just-signed-in /today = philosophy 3 (visual hierarchy, no wizard). Banner: `welcome — you're on a 1-day streak. play 6 more games to build it.` (dismissible). Empty-state CTA on unplayed cards: `not played today · play →`. Full sidebar visible from minute one. Resolves #75. Supersedes "NOT YET PLAYED filler" decision. |
| 2026-05-03 | dukesmith0        | Daily loop polish: progress row format `N / 7 today · M to go` with dot row above the game list; end-of-day chip `✓ daily complete` + line `all 7 played today · come back tomorrow`; yesterday-delta on played cards on by default. |
| 2026-05-03 | CLAUDE-dukesmith0 | Lapsed-user re-entry = streak silently 0, soft `welcome back. play any game to start a new streak.` line, no shame copy. No "you broke your streak" headline. |
| 2026-05-03 | CLAUDE-dukesmith0 | Email verification = soft-gate. Account works immediately after signup; dismissible banner reminds; verification gates only password reset and outbound emails. Not a hard block on /today. Open question: reconcile inline `email already registered (signup)` failure mode with prior anti-enumeration decision before Phase 12 ships. |
| 2026-05-03 | dukesmith0        | Phase reordering. Active phase becomes Phase 9 = Flow A (low-risk new-user UI polish). New Phases 10-14 = Flow B-F (anti-cheat infra, anon `/play` + landing, auth UI + claim path, Supporter tier, review + cleanup) inserted before existing Phase 4.5 / 5.5. Original Phase 9 trend-viz items (sparkline + heatmap toggle + delta line) deferred to new Phase 15. Existing Phases 10-13 renumbered to 16-19. |

## Plan archive
- v1 plan: `C:\Users\craigs\.claude\plans\snappy-rolling-porcupine.md` (approved 2026-04-28).
