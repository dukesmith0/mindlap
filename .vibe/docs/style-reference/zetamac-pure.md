# Zetamac Pure reference mock

`zetamac-pure.html` is the visual reference mock for the locked Zetamac Pure style. Open it in a browser to see the intended look-and-feel of `/today` (logo strip, sidebar, game card, leaderboard preview, badge footer, pulsing streak ribbon).

## What to lift verbatim

- CSS custom properties block at `:root` (bg/ink/muted/line/accent/mono).
- `@keyframes pulse` and `.streak { animation: pulse 2s ease-in-out infinite }` (the only signature animation).
- Card pattern: top + bottom border only, no bg, no radius, no shadow.
- Button pattern: 1px accent border, accent text, hover = solid fill + white text, instant (no transition).
- Topbar layout (logo left; streak + level + avatar right) and 200px sidebar with `>` accent prefix on the active link.
- Footer pattern: locked badges = `--line` fill + 0.5 opacity.

## What to swap when porting to mindlap

- Font: this mock uses `"Courier New", Courier, monospace` for portability. The actual app uses **Courier Prime via `next/font/local`** loaded in `app/layout.tsx`. Keep the same family declaration shape; only the resolved name changes.
- Tier colors: this mock has decent placeholders. Real mindlap tiers come from `decisions.md` (top 1% diamond, 5% platinum, 15% gold, 35% silver, rest bronze). Bind to CSS vars per tier later.
- Dark mode tokens: this mock is light-only. Real app sets `data-theme="dark"` on `<html>` and swaps the same five tokens (see `app/globals.css`).
- SVG icons: kept inline for self-contained reference, but the production app should use a shared icon component (or skip icons in the spirit of "no icons in buttons"; sidebar nav icons are the only icons we keep).
- Page layout `48px 64px` padding and `max-width: 720px` are the locked main-column dimensions for desktop.

## Hard rules this mock follows

No shadows. No border-radius (avatar and tier dots are circles via `border-radius: 50%`, but no rounded rectangles). No gradients. No emoji. One font family. Button borders are accent. 1px borders only.
