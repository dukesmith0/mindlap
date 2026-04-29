# Bugs
Next ID: 65

## Open

| ID | Sev | Phase | Status | Note |
|----|-----|-------|--------|------|
| #64 | LOW | 8 | deferred | AvatarEditor modal needs focus trap + body scroll lock. Resolves when `<Modal>` primitive lands. File: `components/ui/AvatarEditor.tsx`. |
| #62 | LOW | 7.6 | decided | Countdown `STEP_MS` 600 → 500. Total countdown 2.0s. File: `components/games/Countdown.tsx`. |
| #59 | MED | 8 | decided | `<Toast>` primitive (1px accent border, 4s auto-dismiss, opacity-only fade). Wired into ProfileSocialButtons, AddFriendForm, FriendRow, settings forms. |
| #58 | MED | 7.7 | decided | Anti-cheat footnote on `/leaderboards`: "scores are user-reported; replay-token verification ships post-launch." Single edit. File: `app/leaderboards/page.tsx`. |
| #56 | LOW | 7.5 | decided | 3rd onboarding step: friend-code share + copy + skip. Edits 2-step machine to 3. File: `app/(authed)/onboarding/OnboardingFlow.tsx`. |
| #54 | MED | 7.5 | decided | Direction badge on each `/today` game card; tap opens directions popup; auto-opens on first play (dismiss persists in `localStorage.mindlap.directions.seen.<game_key>`). |
| #53 | MED | 7.6 | decided | Per-game grid: keep absolute date for `set`. Rename `worst` → `low (week)` (rolling 7-day low). Will be revisited once Phase 9 sparkline + Phase 5.5 graphs land. |
| #52 | MED | 7.5 | decided | Score context line under per-game stats. Format: "↑ above your 7d median" / "↓ below your 7d median" / "= matches your 7d median". Uses already-fetched data. |
| #51 | MED | 7.5 | decided | `<TodayMilestoneBanner>` on /today: "🔥 day N" / "🏆 first PB earned today" / "X / 7 games today". Authed-only. Hides after first week. New component: `components/today/TodayMilestoneBanner.tsx`. |
| #45 | MED | 8 | decided | Themed tooltips for badges + heatmap. Single delegated hover bubble (one mounted `<Tooltip>`, listens to `pointermove` + `data-tip` attributes — avoids 91 mounted instances on the heatmap). `lib/badges/icons.ts` gains `badgeCriteria(key)`. |
| #30 | MED | 9 | open | Pre-submit comparison view on ResultScreen. New action `getPreSubmitContext(game_key, score)` returning current+projected values; renders above submit button with `(+N)` / `(-N)` deltas. |
| #26 | LOW | 13 | open | Profile page does 28 supabase round-trips per render (4 queries × 7 games). Collapse to one `get_public_profile_stats(user_id)` RPC. File: `app/profile/[username]/page.tsx`. |
| #14 | MED | 8 | decided | Digit Span overflow length 10+: step-fn breakpoints. Classes `digit-len-9` (80px) / `-10` (72px) / `-12` (64px) / `-15` (48px) / `-18` (36px). User vetoed chunked spacing. |

## Resolved (2026-04-29 commit 5 avatar polish + .vibe consolidation)
- Avatar centering — emoji + initial both rendered low. Fix: switched `Avatar.tsx` from flex+padding to inline-block + `line-height: <size>px` + `text-align: center`. Reliable centering across both glyph types.
- AvatarEditTrigger hover — square focus-ring + off-center "EDIT" text. Fix: `border-radius: 50%` on the trigger so the outline follows the disc; removed `letter-spacing` from the EDIT overlay; switched to `display: grid; place-items: center` for the overlay.
- AvatarEditor — desktop emoji discovery gap. Fix: curated 50-emoji palette (`lib/auth/avatar-emoji-palette.ts`) rendered as a 10-col grid above the input; click fills the input. Inline shortcut hint for power users (Win + . / Cmd + Ctrl + Space).

## Resolved (2026-04-29 commit 4 avatar identity)
- #48 [MED] Avatar customization rework. Migration 0013 + AvatarEditor modal + setAvatarIdentityAction (atomic color+emoji). All callsites updated. New risk #R18 (CHECK vs validator drift).

## Resolved (2026-04-29 commit 3 Tier 3 polish)
- #61 [LOW] Light-mode heatmap CSS gap.
- #60 [LOW] ResultScreen submit lacked aria-busy + visual dim.
- #57 [LOW] Username 30-day lock not surfaced during onboarding.
- #55 [LOW] DangerZone lacked explicit "permanent" red warning.
- #46 [LOW] Profile header centering off (.subtitle margin).

## Resolved (2026-04-29 commit 2 Phase 7)
- #50 [LOW] Profile header layout broke when social buttons rendered. Moved `.profile-social` to its own row.
- #47 [MED] Social buttons on /profile (state-aware add/cancel/accept+decline/remove/blocked/opt-out).
- #41 [LOW] Today mini-leaderboard converted to friends-only top-5 with overflow self-row.

## Resolved (2026-04-29 commit 1 polish)
- #44 [MED] Theme toggle 500ms latency. Optimistic client write to `<html data-theme>` with rollback.
- #43 [MED] Badges rendered as identical accent dots. `lib/badges/icons.ts` per-key emoji map.
- #42 [MED] 90-day GitHub-style heatmap added to profile.
- #40 [MED] /leaderboards rows had no avatar/link. Extended SELECTs + Avatar + Link.
- #39 [LOW] Core-game `*` indicator had no affordance. New themed `Tooltip`.
- #38 [LOW] Profile per-game card missed total plays.
- #37 [MED] Per-game grid alignment via 6-col CSS grid.
- #36 [LOW] Streak ribbon pulse moved to emoji span only.
- #35 [LOW] Countdown step timing equalized via single `STEP_MS = 600`.
- #34 [LOW] /today header collapsed to single flex row.
- #33 [LOW] DELETE ACCOUNT styled red (.danger-h2 + .btn-danger).
- #19 [LOW] Avatar initial cap-baseline correction.
- #16 [LOW] /favicon 404 — `app/icon.svg` with prefers-color-scheme.
- #15 [MED] /settings missing back affordance.

## Resolved (earlier phases)
Phases 0-6 bug history archived in `decisions.md` Plan Archive.
