# Bugs
Next ID: 66

## Open

| ID | Sev | Phase | Note |
|----|-----|-------|------|
| #65 | LOW | 8 | Direction-badge hover (`/today` and `/play/<game>` ready) inverts to solid accent fill, hiding the label and not signalling "click for directions". Already adds "?" suffix and accent border in commit 6, but still feels like a button. Consider: change to info-chip style (no fill on hover, underlined "?" affordance), or show a brief "click for tutorial" caption inline. File: `app/globals.css` `.direction-badge` rules. |
| #30 | MED | 9 | Pre-submit comparison view on `ResultScreen`. Action `getPreSubmitContext(game_key, score)` returning current+projected PB / worst7 / median7 / leaderboard rank with `(+N)` / `(-N)` deltas. |
| #26 | LOW | 13 | Profile page does 28 supabase round-trips per render (4 queries × 7 games). Collapse to one `get_public_profile_stats(user_id)` RPC. File: `app/profile/[username]/page.tsx`. |

## Resolved (2026-04-30 commit 6 — Phases 7.5 + 7.6 + 7.7 + 8 + optimization sweep)

- **#14** Digit Span overflow at length 10+. Step-fn breakpoints (`digit-len-9/10/12/15/18`) in `components/games/DigitGame.tsx` + `app/globals.css`. Test `debug/digit-len-class.test.ts`.
- **#45** Themed tooltips on badges + heatmap. Single delegated bubble in `components/ui/DelegatedTooltips.tsx` mounted in AppShell. `data-tip` attrs on each badge + heatmap cell. `lib/badges/icons.ts` gains `badgeCriteria(key)`.
- **#51** `<TodayMilestoneBanner>` on `/today`. Priority: clean-sweep > today-PB > streak > plays-progress. Hidden when 0 plays + 0 streak. Test `debug/today-milestone.test.ts`.
- **#52** Score-context line under per-game PB. Numeric delta + arrow: `↑ +12 vs 7d median` / `↓ -3 vs 7d median`. Direction-aware. Empty when median unknown or diff < 0.001. Plus `n=N days` sample size next to median value.
- **#53** Per-game grid: `worst` → `low (week)`. Bounded by 7d window via `daily_aggregates` + `ascending: !lower`. `set` keeps absolute date.
- **#54** Direction badge per `/today` card + auto-open directions modal first time per game. Single shared `<DirectionsModal>` (`components/games/DirectionsModal.tsx`) used by `<DirectionBadge>` + `GameShell`. Persists per-game in `localStorage.mindlap.directions.seen.<game_key>`. Each game has a 3-line `directions` array in `lib/games/registry.ts`.
- **#56** 3rd onboarding step — friend-code share + copy + skip. Page passes `friendCode` from `profile_secrets`. Heading "step 3 of 3 - bring a friend".
- **#58** Anti-cheat footnote on `/leaderboards`: "scores are user-reported; replay-token verification ships post-launch."
- **#59** `<Toast>` primitive. Provider in AppShell, `useToast()` hook with no-op outside provider. Wired into AddFriendForm, FriendRow (5 actions), ProfileSocialButtons (5 actions), AvatarEditor (save). 4s TTL, 1px accent border, opacity-only fade.
- **#62** Countdown `STEP_MS` 600 → 500. Total countdown 2.0s. Test updated.
- **#64** `<Modal>` primitive — focus trap (Tab cycle within card), body scroll lock (cleanup on unmount), Escape close, mousedown+click backdrop close. AvatarEditor refactored on top.

Plus shipped this commit (no separate bug ID):
- New primitives: `<EmptyState>`, `<ConfirmDialog>` (DangerZone uses it), `<FormField>`, `<Modal>`, `<Toast>`, `<DelegatedTooltips>`.
- New helpers: `lib/relative-date.ts`, `lib/tier-colors.ts` (`StreakRibbon` migrated to use `streakColor`).
- Cognitive-improvement persona quick wins: numeric delta replaces "better than" copy; sample size `n=N days` next to median.
- Hover sweep: `.lb-tab` / `.lb-scope` accent hover on leaderboards; `.game-card-row:hover` highlights both surrounding lines via adjacent-sibling selector; `.modal-card { text-align: left }`; `button:focus-visible { box-shadow: 0 0 0 1px var(--accent) }`.
- Avatar centering rewrite: SVG `<text>` + `dominant-baseline="central"` + post-mount `getBBox()` measurement. Module-level `Map<string, Offset>` memo so leaderboards renders 100 avatars without re-measuring identical glyphs.
- TopBar avatar reverted to plain `<Link>` (no editor); editing only on own-profile header + `/settings` ProfileSection.
- Optimization: `/today` 5 sequential awaits → one `Promise.all`; friends-mini-leaderboard 7 queries → one `daily_aggregates` query bucketed in JS (drops truncation risk too).
- DST fix: PB-today detection switched from hardcoded `-08:00` offset to a 24h-UTC window + `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' })` client filter (resolves R19).
- Vetted: `let's play -&gt;` literal entity in JSX expression (now `->`). `is_new_pb` non-existent column reference fixed via `xp_events.source='daily_pb'` lookup.

## Resolved (earlier — abridged)

Commits 1-5 resolved 17 bugs (#15, #16, #19, #33, #34, #35, #36, #37, #38, #39, #40, #41, #42, #43, #44, #46, #47, #48, #50, #55, #57, #60, #61). Full history in commit messages and `decisions.md` Plan Archive.
