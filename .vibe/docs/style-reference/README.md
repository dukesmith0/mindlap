# mindlap style reference

`style-page.html` is the canonical visual reference for the Zetamac Pure system. Open it in a browser to see every token, component, and state side-by-side in light + dark mode.

## Source of truth

`app/globals.css` is authoritative. The HTML reference mirrors it byte-for-byte; when you change a token or component style, update both files.

## Hard rules

- Courier Prime via `next/font/local` is the only typeface.
- 5 base tokens (`--bg`, `--ink`, `--muted`, `--line`, `--accent`) plus `--danger`, `--on-accent`, and 3 reaction-game tokens (`--reaction-go`, `--reaction-wait`, `--reaction-early`). Dark mode is a single `[data-theme="dark"]` override block.
- 1px borders only. Never thicker, never dashed (one exception: `.nav-back` decorative dividers).
- `border-radius: 0` everywhere. Exception: avatars + `.avatar-edit-trigger` use 50%.
- No box-shadow drop shadows. Focus rings via box-shadow are allowed (1px halo).
- No gradients. No colored card fills. No transforms (one exception: the checkmark glyph rotate in `input[type="checkbox"]:checked::after`).
- Animations: opacity + color transitions only, ≤ 320ms ease-out. The streak ribbon flame is the only infinite-loop animation.
- Generous whitespace: main content max-width 720px, sidebar 200px, topbar/sidebar separated by 1px borders.

## Canonical button family

Six variants. Anything else is dead code.

- `<button>` element selector — primary outlined accent.
- `.btn-link` — anchor styled identically to `<button>`.
- `.btn-danger` — outlined danger variant.
- `.btn-sm` — small modifier (chips, search clear).
- `.btn-icon` — borderless single-glyph button (toast dismiss, today pin).
- `.btn-ghost` — full-width ghost button (canonical name; `.game-tappable` kept as a JSX alias for the in-game NBack target).

## Canonical bracketed-status convention

Brackets live in CSS pseudo-elements; do not include them in JSX content.

- `.tag` — neutral status (no streak, saved, unavailable, no badges yet).
- `.tag-accent` — bonus / notable chip (2x xp, new pb).
- `.tag-error` — form errors and inline alerts (`var(--danger)` so they don't read as links).

## Inline-style utilities

- `.text-muted-sm` — `color: var(--muted); font-size: 13px;`
- `.text-muted-xs` — `color: var(--muted); font-size: 12px;`
- `.numeric` — `font-variant-numeric: tabular-nums;`

## Documented hardcoded colors

These intentionally do not theme. See the comment block at the top of `app/globals.css` for the full list (mine cell numbers, Stroop palette, avatar palette, tier colors, avatar SVG glyph fill, reaction-game phase text, favicon).

## Follow-up

`.vibe/future.md` tracks promoting this static file to a live `/style` route inside the Next.js app so it imports `app/globals.css` directly. A standalone HTML file rots; until then, keep both in sync.
