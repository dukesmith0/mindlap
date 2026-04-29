// Zetamac-pure tooltip: 1px accent border, no shadow, square corners, accent
// text on `--bg`, opacity-only fade on host hover/focus. Non-interactive
// (pointer-events: none on the bubble) so it never steals clicks.
//
// Defaults to decorative use: aria-label carries the text for screen readers,
// no tabIndex so the host doesn't enter the tab order. Pass `focusable` when
// the host should accept keyboard focus (e.g. wraps an interactive child).

import type { ReactNode } from "react";

export function Tooltip({
  text,
  children,
  className = "",
  focusable = false,
}: {
  text: string;
  children: ReactNode;
  className?: string;
  focusable?: boolean;
}) {
  return (
    <span
      className={`tooltip-host ${className}`.trim()}
      aria-label={text}
      {...(focusable ? { tabIndex: 0 } : {})}
    >
      {children}
      <span className="tooltip" role="tooltip" aria-hidden>
        {text}
      </span>
    </span>
  );
}
