# Bugs
Next ID: 112

## High Priority

| ID  | Name | Note |
|-----|------|------|
| #98 | Recovery cookie gate | `app/auth/callback/route.ts:37` mints recovery crumb on `next === "/auth/set-password"` regardless of Supabase token type. Lured OAuth init → reset pivot. Gate on `?type=recovery`. |
| #26 | Profile RPC consolidation | `app/profile/[username]/page.tsx` does ~35 RTTs (5 awaits × 7 games + heatmap + badges). Collapse via single `get_public_profile_stats(user_id)` RPC. |
| #30 | Pre-submit comparison | Pre-submit context on ResultScreen — current+projected PB, worst7, median7, leaderboard rank, with `(+N)` / `(-N)` deltas. Action `getPreSubmitContext(game_key, score)`. |
| #68 | Empty README | `README.md` is a 6-byte BOM. Add 30-line install / env / dev / migration / `.vibe` link. |
| #69 | Missing route surfaces | No `loading.tsx` / `error.tsx` / `not-found.tsx` anywhere in `app/`. Add `app/error.tsx`, `app/(authed)/loading.tsx`, `app/profile/[username]/not-found.tsx`. |
| #70 | AppShell duplicate fetches | `components/layout/AppShell.tsx:16-27` re-runs `getUser()` + profile select on every authed page; `/today:47` re-fetches the same row. Hoist into `React.cache`-wrapped helper. |
| #71 | DelegatedTooltips pointermove | `components/ui/DelegatedTooltips.tsx:29` per-pixel listener calls `setPos(null)` every move. Switch to `pointerover/pointerout` + last-host memo. |
| #72 | Math mobile minus key | `components/games/MathGame.tsx:79` `inputMode="numeric"` hides minus on iOS/Android. Verify generator; switch to `inputMode="decimal"` if negatives possible. |
| #73 | MineGame mobile flag | `components/games/MineGame.tsx:97` flag fires only on `onContextMenu`. Mine unplayable on touch. Add 350ms `onTouchStart` long-press or flag-mode toggle. |
| #74 | Leaderboards 2000-row truncation | `app/leaderboards/page.tsx:138` aggregates client-side from raw submissions capped at 2000. Switch to `daily_aggregates` rollup or server-side `distinct on (user_id)`. |
| #75 | First /today welcome | New user (streak=0, plays=0) sees null banner + 7 cards saying `NOT YET PLAYED`. Reads as failure. Empty-state welcome + "start here → Speed Math" pointer. |
| #76 | Landing/signup game pitch | `app/page.tsx` and `/signup` say only "Track your cognitive performance over time". Add 7-game teaser line or thumbnails above the fold. |
| #77 | Onboarding CLI-style copy | `OnboardingFlow.tsx:86,91,114` reads like CLI flags (`[error]` brackets, "let's play ->"). Plain prose pass. |
| #96 | 7d median no n-floor | `app/profile/[username]/page.tsx:168-172` renders 7d median + delta with no sample-size floor. At n=1 median is one play. Gate display + delta behind n ≥ 4. |
| #97 | Median-of-medians wrong | `app/profile/[username]/page.tsx:158-172` takes median of `daily_aggregates.median`, weighting a 1-play day equal to a 30-play day. Use weighted median over `submissions` or persist p25/p50/p75 + n. Pairs with R22. |

## Medium Priority

| ID  | Name | Note |
|-----|------|------|
| #79 | Missing CI / branch protection | No CI, no `main` branch protection, no pre-commit hook. 15 commits direct to `main`. Add `.github/workflows/ci.yml` (typecheck + lint + test on PRs); enable branch protection; secret-prefix pre-commit. |
| #80 | Missing PR template / CONTRIBUTING | Add `.github/PULL_REQUEST_TEMPLATE.md` (summary / test plan / `.vibe/` updated?) + `CONTRIBUTING.md` block in README pointing at `git worktree add`. |
| #81 | Broken test:e2e script | `package.json` advertises `test:e2e: playwright test` but no `playwright.config.ts` and no test files. Scaffold config + 1 smoke test, or remove the script. |
| #82 | Migration workflow split | `scripts/apply-migrations.mjs` (Mgmt API, used) vs `supabase` CLI devDep (^2.95.6, never invoked). Document Mgmt API as canonical; remove unused CLI from devDeps. |
| #83 | Friend-request count badge | No friend-request signal in Sidebar or TopBar. Incoming requests invisible until `/friends`. Add `(N)` suffix on Sidebar Friends item. |
| #84 | MineGame 60Hz re-render | `components/games/MineGame.tsx:31-41` `requestAnimationFrame` setting `setElapsedMs` reconciles 100-cell board ~60×/s. Write timer to ref + decoupled `<TimerDisplay>` updated 5-10Hz. |
| #85 | ResultScreen R after submit | `components/games/ResultScreen.tsx:69-71` `r` re-runs the game even after `submitted=true`, throwing away the milestone UI. Disable `r` post-submit or repurpose as "play again". |
| #86 | Sidebar use client redundant | `components/layout/Sidebar.tsx` is `"use client"` solely for `usePathname`. Make RSC; compute active via `useSelectedLayoutSegment()` in a 5-line client child. |
| #87 | Settings actions raw boolean | `actions/profile.ts:163-198` — `setProfilePrivacy` / `setAcceptsFriendRequests` / `setSkipTutorials` accept raw booleans. Wrap with `z.boolean().parse(...)` for symmetry. |
| #88 | Dead exports + Groups item | Dead: `lib/relative-date.ts`, `RANK_TIERS` + `rankColor` in `tier-colors.ts`, `gameMeta()` in `lib/games/registry.ts`, `void remaining;` in `addFriendAction`, disabled Groups Sidebar item. Delete; add `unused-imports/no-unused-imports` ESLint rule. |
| #89 | Stale eslint-disable closures | Keyboard effects in `ResultScreen.tsx:63-80`, `ReactionGame.tsx:72-81`, `StroopGame.tsx:47-57` `eslint-disable react-hooks/exhaustive-deps` while closing over potentially stale handlers. Stash latest in ref, or `useEvent`-style stable handler. |
| #90 | Countdown.onDone closure | `components/games/GameShell.tsx:91` passes a fresh closure to `Countdown`; effect-deps double-fire under StrictMode. `useCallback` on parent or capture in ref. |
| #91 | NBackGame button-wrap | `components/games/NBackGame.tsx:91-108` wraps the entire stage in a `<button>`. Single AT label "tap on match" swallows HUD/letter/dots; Space + keydown listener can double-fire. Move click target to inner element; outer is `<div>`. |
| #92 | signInAction error leak | `actions/auth.ts:85` returns Supabase error verbatim ("Invalid login" vs "Email not confirmed" vs "User not found"). Leaks account existence. Collapse to single opaque string. |
| #93 | Client-trusted bonus param | `actions/submission.ts:45` derives `is_bonus_game` server-side, but `process_submission` accepts `p_is_bonus_game` from caller; direct PostgREST RPC doubles XP. Drop the param; derive inside the function. |
| #94 | Daily 2x XP invisible | `TodayCard.tsx:81` shows daily 2× XP as a tiny inline `[2x xp]` pill. Promote into milestone-banner rotation when bonus games unplayed ("Today's bonus: Stroop + Word — 2x XP"). |
| #95 | Jargon in copy | TopBar XP tooltip, profile per-game cards (`PB`, `low (week)`, `7d median`, `n=N days`, `↑ +12 vs 7d median`), and the leaderboards anti-cheat footnote use jargon. Rename `PB` → "Best ever"; `7d median` → "typical week"; drop replay-token sentence until R1 ships. |

## Low Priority

| ID   | Name | Note |
|------|------|------|
| #65  | Direction-badge hover restyle | `app/globals.css` `.direction-badge` hover inverts to solid accent fill, hiding the label and not signalling "click for directions". Info-chip style or "click for tutorial" caption. |
| #99  | Sidebar soon badge invisible | `app/globals.css:929-935` "soon" disabled-state badge uses `color: var(--line)`, near-invisible on light mode. Bump to `var(--muted)`. |
| #100 | Onboarding step 3 one-way | Step 3 only shows the user's friend code; cannot paste a friend's @username or code. Add inbound input alongside the share affordance. |
| #101 | TodayCard username overflow | `.lb-preview-row` grid `24px 1fr auto` (`TodayCard.tsx:98`, `app/globals.css:575`) lacks `min-width: 0` + `text-overflow: ellipsis`; 12-char usernames push score off the card. |
| #102 | as unknown as escape hatches | `app/(authed)/today/page.tsx:100`, `app/(authed)/friends/page.tsx:57`. Generate Supabase types (`supabase gen types typescript`); remove escape hatches. |
| #103 | tier-colors comment lies | `lib/tier-colors.ts:37-43` comment claims "lowest tier whose min ≤ rank"; loop picks the largest. Code correct, comment wrong. Rewrite. |
| #104 | typedRoutes config drift | `next.config.ts:56` — `typedRoutes: true` commented "after Phase 4"; Phase 4 shipped. Re-enable or remove TODO. |
| #105 | Outdated deps | `npm outdated` pass: `@types/node ^22` (Node 23 LTS current), `@vercel/speed-insights` one major behind, `eslint-config-next` pinned `^16.2.4`. |
| #106 | find_user_by_friend_code case | Case-sensitive `=` on uppercase-stored codes. `actions/friendships.ts:48` doesn't normalize; lowercase user input returns "User not found". Call `normalizeFriendCode` before RPC, or `upper()` inside. |
| #107 | Aspirational githook | `.gitignore:76` references nonexistent `.githooks/pre-commit`. Create the hook (pairs with #79) or delete the comment. |
| #108 | Profile single-play sparse | `app/profile/[username]/page.tsx:340-405` per-game grid renders mostly `-` placeholders for low-play users. When `total_submitted < N`, replace grid with "play these next" list. |
| #109 | Pin button glyph | `TodayCard.tsx:73` pin glyph (`*` / `>`) has zero affordance. Use word "pin" / "unpin", or star icon (☆ / ★). |
| #110 | Countdown no get-ready | `Countdown.tsx` shows just "3 2 1 go" at 96px with no get-ready cue. Optional small "get ready..." subtitle under "3", removed at "go". |
| #111 | Sidebar Groups (soon) hide | Sidebar advertises "Groups (soon)" to all users on every page. Hide nav item until Phase 10 ships. |

## Resolved (2026-05-03 commit 7)

#67 Plans.md git-state drift — `.vibe/plans.md` removed via working-tree delete + commit. #66 .env legacy conflict — scripts ported to `.env.local` via `scripts/_lib/env.mjs`. #78 Hardcoded project ref — `SUPABASE_PROJECT_REF` read from env in `scripts/_lib/mgmt-api.mjs`.

## Resolved (2026-04-30 commit 6)

#14 Digit Span overflow at length 10+ → step-fn breakpoints. #45 Themed tooltips on badges + heatmap → single delegated bubble. #51 `<TodayMilestoneBanner>` on /today. #52 Score-context line `↑ +N vs 7d median`. #53 Per-game grid: `worst` → `low (week)` bounded by 7d. #54 Direction badge per /today + auto-open directions modal. #56 3rd onboarding step (friend-code share). #58 Anti-cheat footnote on /leaderboards. #59 `<Toast>` primitive wired site-wide. #62 Countdown STEP_MS 600 → 500. #64 `<Modal>` primitive (focus trap + scroll lock + Escape).

## Resolved (commits 1-5, abridged)

17 bugs across commits 1-5: #15, #16, #19, #33, #34, #35, #36, #37, #38, #39, #40, #41, #42, #43, #44, #46, #47, #48, #50, #55, #57, #60, #61. Full history in commit messages and `decisions.md`.
