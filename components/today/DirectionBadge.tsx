"use client";

import { useState } from "react";
import { DirectionsModal } from "@/components/games/DirectionsModal";
import { GAMES, type GameKey } from "@/lib/games/registry";

// #54 — small `lower` / `higher` chip on each /today card. Tap shows the
// directions popup. Auto-opening on first play happens on /play/[game]
// (see GameShell), not here.
export function DirectionBadge({ gameKey }: { gameKey: GameKey }) {
  const meta = GAMES[gameKey];
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="direction-badge"
        onClick={() => setOpen(true)}
        aria-label={`${meta.name} directions`}
        aria-expanded={open}
      >
        {meta.direction}
      </button>
      <DirectionsModal gameKey={gameKey} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
