"use client";

import { useEffect, useRef, useState } from "react";

// #45 — single mounted tooltip bubble that follows pointer hover/focus on any
// descendant carrying `data-tip="..."`. Avoids 91 mounted Tooltip instances
// on the heatmap and keeps badge tooltips themed identically.
//
// Mount once at any common ancestor (we put it under AppShell). All tooltip
// hosts only need: `data-tip="text to show"`. Optional `tabIndex={0}` if you
// want keyboard focus to surface the tip.

type Pos = { x: number; y: number; text: string } | null;

export function DelegatedTooltips() {
  const [pos, setPos] = useState<Pos>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function findHost(el: EventTarget | null): HTMLElement | null {
      let node = el as HTMLElement | null;
      while (node && node.nodeType === 1) {
        if (node.dataset && typeof node.dataset.tip === "string") return node;
        node = node.parentElement;
      }
      return null;
    }

    function onMove(e: PointerEvent) {
      const host = findHost(e.target);
      if (!host || !host.dataset.tip) {
        setPos(null);
        return;
      }
      const r = host.getBoundingClientRect();
      setPos({
        // Anchor 6px BELOW the host's bottom, left-aligned. Below avoids the
        // need for a transform (Zetamac Pure forbids transforms).
        x: Math.round(r.left),
        y: Math.round(r.bottom + 6),
        text: host.dataset.tip,
      });
    }

    function onLeave() {
      setPos(null);
    }

    function onFocus(e: FocusEvent) {
      const host = findHost(e.target);
      if (!host || !host.dataset.tip) return;
      const r = host.getBoundingClientRect();
      setPos({
        x: Math.round(r.left),
        y: Math.round(r.bottom + 6),
        text: host.dataset.tip,
      });
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onLeave);
    };
  }, []);

  if (!pos) return null;
  return (
    <div
      ref={ref}
      className="delegated-tip"
      role="tooltip"
      style={{ left: pos.x, top: pos.y }}
    >
      {pos.text}
    </div>
  );
}
