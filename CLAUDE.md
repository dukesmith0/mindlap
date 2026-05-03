# mindlap

Project-wide instructions for any developer (human or AI) working on this repo.

## `.vibe/` index

The `.vibe/` directory holds all project context. Read in this order on a fresh session: `understanding.md` → `current.md` → `future.md` → `decisions.md` → `risks.md` → `bugs.md`.

| File | Purpose |
|------|---------|
| `understanding.md` | Project overview — stack, architecture, routes, database + migration index, style, patterns, dev workflow. Big architectural things only. The source of truth for "how mindlap works". |
| `current.md` | Active phase plus any stop-the-line items. Flat checkboxes referencing bug / risk IDs. |
| `future.md` | Pre-launch phases (chronological), post-launch backlog by type, inbox, and open questions. Same checkbox shape. |
| `bugs.md` | Open bugs grouped High / Medium / Low priority. One table per priority with columns `ID \| Name \| Note`. Resolved entries at the bottom. |
| `risks.md` | Active risks grouped High / Medium / Low priority. Same row shape. Resolved at the bottom. |
| `decisions.md` | Append-only chronological table of every substantive decision. Columns `Date \| Person \| Notes`. Oldest at top. |
| `docs/` | Reference material (style references, source-repo snapshots). Not part of the active workflow loop. |

## Standing rules
- Keep `.vibe/` concise. No filler.
- No leaked secrets, ever. The repo is a public GitHub repo.
- Dev-only behaviour stays gated behind `process.env.NODE_ENV === "development"`. Production builds keep the strict CSP, no `unsafe-eval`, no localhost connect-src.
- `.env.local` is the only env source the new code reads. `.env` is legacy-only.
- **Ask before guessing on unanswered implementation questions.** If a directive is ambiguous (e.g. "drop X" vs "redesign X around Y"), surface 2-3 options and pick after the user replies. Don't fabricate a decision and ship it.
- **Question questionable implementations.** When the user proposes a path that conflicts with `.vibe/decisions.md`, breaks Zetamac Pure rules, leaks credentials, or undoes a recent commit's intent, push back with the specific conflict and let them confirm before proceeding. Better to pause than to silently regress.

## `.vibe/` document standards

Every `.vibe/*.md` file follows the formats below. Keep entries short, token-efficient, and append-friendly so multi-developer merges stay clean. Lead with the fact, no filler. Reference other docs by ID (`#66`, `R20`, `Phase 13`), not by paraphrase.

### `understanding.md` — project overview only

One-line project summary at the top, then these sections in order:

1. **Stack** — frameworks + versions + purpose, one line each.
2. **Architecture** — 2-3 sentences. Type, structure, key directories.
3. **Routes** — short list or table of every user-facing route.
4. **Database** — 1 paragraph on the writer model + a tabulated migration index (`# | File | Purpose`).
5. **Style** — Zetamac Pure tokens + the locked rules.
6. **Patterns** — RSC-vs-client default, server-actions, Zod, etc. Bullet list.
7. **Dev workflow** — install, env, dev server, migrations, test commands.

Big architectural things only. No commit history, no per-bug detail, no per-component code.

### `bugs.md` and `risks.md`

- Top: `Next ID: <N>`.
- Three sections: `## High Priority`, `## Medium Priority`, `## Low Priority`.
- Each section is one table. Columns: `ID | Name | Note`.

```
| ID  | Name                  | Note |
|-----|-----------------------|------|
| #67 | Plans.md git-state drift  | `.vibe/plans.md` + `.vibe/docs/mindgames/plans.md` tracked in git but disk-deleted. `git rm` + commit. |
```

- `Name` is a 3-6 word handle.
- `Note` is one cell, 1-3 short sentences. Include `file:line` for code-rooted issues, plus the fix direction.
- Optional `## Resolved` section at the bottom with one-liners.
- IDs are monotonically increasing. Never reuse a closed ID.

### `current.md` and `future.md`

- Top-level headers are phases, sorted chronologically (first-to-do at top): `## Stop-the-line`, `## Phase 9 — <one-line overview>`, ..., `## Phase 13 — <overview>`, `## Post-launch — <overview>`.
- Each phase header includes a one-line overview after a dash.
- Items under each phase are flat checkboxes that reference bug / risk IDs in bold up front:

```
- [ ] **#30** Pre-submit comparison view on ResultScreen.
- [ ] **R13** App-level rate limit (Vercel KV / Upstash).
```

- `current.md` holds the active phase plus any stop-the-line items. `future.md` holds everything later.
- After all phase sections, in this order: `## Inbox` (items without a phase yet), then `## Open Questions` (always last).

### `decisions.md` — single chronological table

- One append-only table, oldest at top, newest at bottom.
- Columns: `Date | Person | Notes`.
- `Person` = GitHub username (e.g. `dukesmith0`) for explicit user calls, or `CLAUDE-<github-user>` for AI-driven choices on that developer's behalf.
- `Notes` is one cell, 1-3 short sentences. One decision per row. If a decision needs more context, split into multiple rows on the same date.

```
| Date       | Person            | Notes                                                                    |
|------------|-------------------|--------------------------------------------------------------------------|
| 2026-04-28 | dukesmith0        | Locked v1 reward loop: streak + PB + badges; elo silent until threshold. |
| 2026-05-03 | CLAUDE-dukesmith0 | Deleted plans.md; current = next phase only, future = rest.              |
```

### Concatenability rules (apply to every doc)

- One topic per row, one decision per row, one bug per row. Easier to merge under contention.
- Never insert mid-list when appending is sound. Keep monotonic IDs and append-at-bottom for `decisions.md`.
- No multi-paragraph cells in tables. If something needs more space, give it a new row.
- No em dashes opening digressions. Sentences should be direct.

## Run the dev server

```bash
npm run dev
```

- URL: http://localhost:3000
- Hot reload picks up code changes; `next.config.ts` changes need a manual restart (Ctrl+C, `npm run dev`).
- If port 3000 is busy, find the process: `taskkill /PID <pid> /F` (Windows) or `lsof -ti :3000 | xargs kill` (Unix).

## Create a dev account

```bash
npm run user:create -- <email> <password>
```

- Requires `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
- Creates a pre-confirmed user (skips Resend email), so you can sign in immediately at `/login`.
- The script is gitignored (requires service-role key). Do not commit it.

Sign in at http://localhost:3000/login. First sign-in routes through `/onboarding` (pick username + theme), then lands at `/today`.

## Common loops
- Pure unit tests: `npm test`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Apply a new migration: `npm run db:migrate -- supabase/migrations/<file>.sql`
- Read-only DB health checks: `npm run db:doctor` (flags: `--all`, `--extensions`, `--friend-code`, `--grants <fn,fn>`, `--functions`)
- Seed walkthrough fixtures: `npm run db:seed`

All `db:*` scripts read `SUPABASE_PROJECT_REF` + `SUPABASE_ACCESS_TOKEN` from `.env.local` (see `.env.local.example`). The canonical refresh path is `vercel env pull .env.local --yes` against the linked project; new keys go into Vercel first.

## File hygiene before commits
- No `console.log` in shipped code.
- No service-role key references outside server actions / scripts that are gitignored.
- `git status` should not show `scripts/user-create.mjs` (gitignored — requires service-role key).
