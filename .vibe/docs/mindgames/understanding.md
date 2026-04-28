# mindgames
Last: 2026-04-19 | 15 JS files | HTML/CSS/Vanilla JS

## Stack
- HTML5/CSS3/Vanilla JS — static site, no build step
- GitHub Pages — hosting and deployment
- Supabase (Postgres) — persistent data store (free tier, public anon key + RLS)
- No frameworks, no runtime deps

## Architecture
Single `index.html` with show/hide screen routing. Vanilla JS ES modules loaded via `<script type="module">`. Supabase-js from CDN. CSS variables for light/dark theming. Custom auth via Supabase RPC with bcrypt. Score data in Postgres with RLS constraints.

## Components
- **Auth**: Username/password via Supabase RPC (bcrypt hashed, security definer). Users: JL, DS, DK
- **Dashboard** (`js/dashboard.js`): 3-column per-user layout with 90-day heatmap + 7 collapsible stat cards per user; per-user score tables below with date-row-dividers
- **Graphs page** (`js/graphs.js`): canvas line charts, 3 user columns × 7 games each; All-plays / Daily-average toggle
- **Speed Math** (`js/math.js`): 60s zetamac-style drill (+, −, ×, ÷); Enter skips current problem (−3s penalty)
- **Digit Span** (`js/digit.js`): sequence memory; display time 2000+(length−3)×500 ms; unlimited answer time; score = last correct length; no global cap
- **N-Back (2-back)** (`js/nback.js`): 22 trials (2 warmup + 20 scorable, ~30% targets); press SPACE on matches; score = accuracy % (0–100)
- **Stroop** (`js/stroop.js`): 30s timed; color-word interference; 1/2/3/4 keys or click buttons; never repeats exact (word, ink) pair back-to-back; score = correct count
- **Reaction Time** (`js/reaction.js`): 5-trial red→green; SPACE or tap; score = average ms
- **Minesweeper** (`js/minesweeper.js`): 10×10, 15 mines, first-click-safe; score = time to win; loss shows Retry overlay
- **Word Recall** (`js/word.js`): 20s memorize 10 of 115 words, recall; score = correct count (0–10, case-insensitive, deduped)
- **Sudoku** (`js/sudoku.js`): hidden from UI, code retained
- **Score submission**: Retry or submit flow, multiple submissions per day allowed

## User Flow
1. Login (username + password validated via Supabase RPC)
2. Dashboard ↔ Graphs tabs at top; "Start Today's Game" button
3. Game selection screen lists 7 games; top 4 (Math, Digit, N-Back, Stroop) are starred as core cognitive metrics
4. Play game → see score → retry or submit
5. Scores visible to all users; dashboard and graphs refresh on return

## Scoring (direction: ↑ higher is better, ↓ lower is better)
- Math: ↑ problems completed
- Digit Span: ↑ last correct length
- N-Back: ↑ accuracy % (0–100)
- Stroop: ↑ correct responses
- Reaction: ↓ average ms
- Minesweeper: ↓ seconds to clear
- Word Recall: ↑ correct recalls (0–10)

## Patterns
- No build tools — raw HTML/CSS/JS
- Supabase Postgres for all persistence
- Mobile-friendly, lightweight
- Light/dark mode toggle (per-user preference in localStorage)
- Minimal/functional aesthetic; Georgia serif for headings, system-ui for body, monospace for timers/scores

## Data Persistence
- `users` table: id, username, password_hash. RLS blocks all direct access. Auth via `authenticate_user()` RPC (security definer, pgcrypto bcrypt).
- `scores` table: id, username, game, score, played_at. RLS allows anon SELECT + INSERT with CHECK.
- Allowed game keys: `math`, `sudoku`, `reaction`, `memory_digit`, `memory_word`, `minesweeper`, `nback`, `stroop`.
- Check constraints: username IN ('JL','DS','DK'), score > 0.
- Reads/writes via supabase-js from CDN with public anon key (no secrets in repo).

## Dashboard details
- Each user column shows: heatmap (activity from 2026-04-18 minimum, extending today+90 days), 7 stat cards (one per game).
- Each stat card: Top score (always visible, accent-colored) + collapsible `<details>` with median/mean/last-5-day/plays.
- Score table per user: date as row divider, most recent first. 7 game columns (Math, Dig, NB, Str, Rxn, Mine, Wrd). Compact numeric format.

## Tests
Framework: vitest | Pattern: debug/*.test.js | Run: `npm test`
Coverage: 129 tests across 10 files. Pure logic (problem/puzzle generators, scoring, bounds, aggregation) is fully unit-tested. DOM controllers are manual-test only.

## Docs Index
(none)

## Starred games (core cognitive metrics)
Math, Digit Span, N-Back, Stroop are marked with ★ in the game selection screen. They are the low-practice-effect tests most suitable for tracking cognitive performance over time. The others (Reaction, Minesweeper, Word Recall) are secondary — useful for variety and motivation but higher practice effect.
