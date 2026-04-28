# Decisions

## Technical Decisions
- **Data store: Supabase Postgres** — public anon key (by design) + RLS for write validation. Replaced Google Sheets for stronger data integrity. (2026-04-18)
- **No hardcoded PATs/secrets** — rejected GitHub API direct writes, Cloudflare Worker proxy, and Google Sheets in favor of Supabase's public-key-with-RLS model. (2026-04-18)
- **Supabase over Firebase** — Postgres constraints + RLS give stronger structural validation than Firebase Security Rules DSL. (2026-04-18)
- **Custom auth via RPC** — username/password validated by `authenticate_user()` RPC function (security definer + pgcrypto bcrypt). Not using Supabase Auth — too heavy for 3 friends. Users: JL, DS, DK. (2026-04-18)
- **Session via sessionStorage** — after RPC login success, store username in sessionStorage. No JWTs, no Supabase Auth sessions. Simple and lightweight. (2026-04-18)
- **Core cognitive metrics (starred games): Math, Digit Span, N-Back, Stroop** — these are the low-practice-effect tests best suited for tracking cognitive performance over time. Math included per user preference despite its moderate practice effect. Reaction/Minesweeper/Word Recall remain available but are treated as secondary. (2026-04-19)
- **Dashboard: Top score always visible, all other stats collapsible** — each stat card shows best score up top (direction-aware max/min) and a `<details>` summary for median/mean/last-5-day/plays. Reduces visual noise while keeping full data accessible. (2026-04-19)
- **Score table: date as row divider, most recent first** — replaces the per-row date column to reclaim horizontal space as game count grew to 7. Compact numeric formatter drops unit suffixes in table cells. (2026-04-19)
- **Graphs toggle: All plays vs Daily average** — users can switch between raw per-play points and one-point-per-day averaged view. Mode is in-memory only; resets on page reload. Canvas height reduced to 90px to fit 7 games per column without vertical over-extension. (2026-04-19)
- **N-Back scoring = accuracy % over 20 scorable trials** — (hits + correct_rejections)/20×100. Chosen over d' or hits-minus-FA because it's bounded 0-100, intuitive, and can't go negative (DB rejects score ≤ 0). Pressing nothing = 70%, pressing everything = 30%. (2026-04-19)
- **N-Back timing: 1000ms letter + 1500ms blank; response window open for whole 2500ms trial** — original 500ms letter display was too short to read; response-during-letter was previously blocked which felt unnatural. (2026-04-19)
- **Stroop scoring = correct count in 30s fixed window** — matches Speed Math's feel; wrong answer flashes but does not advance, so the score is pure throughput under constraint. (2026-04-19; reduced from 45s to 30s)
- **Game order consistent everywhere**: starred four first (Math, Digit Span, N-Back, Stroop), then Reaction, Minesweeper, Word Recall. Applied in game selection buttons, dashboard stat cards, score-table columns, and graphs. (2026-04-19)
- **Logo click returns to dashboard** — the `mindgames` word in the header is a click target that navigates home when logged in; cleans up any active game first. (2026-04-19)

## Assumptions
- User will create a Supabase project and provide the project URL + anon key (both public, not secrets)
- RLS policies will be configured to restrict inserts to valid usernames/games/scores

## Learned Lessons

## Plan Archive