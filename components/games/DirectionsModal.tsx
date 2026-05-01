"use client";

import { useId } from "react";
import { Modal } from "@/components/ui/Modal";
import { GAMES, type GameKey } from "@/lib/games/registry";

// Single shared directions popup used by /today (DirectionBadge) and
// /play/[game] (GameShell auto-open). Pulls copy from `lib/games/registry`.
export function DirectionsModal({
  gameKey,
  open,
  onClose,
}: {
  gameKey: GameKey;
  open: boolean;
  onClose: () => void;
}) {
  const meta = GAMES[gameKey];
  const titleId = useId();
  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} style={{ marginTop: 0, marginBottom: 12 }}>
        {meta.name} - directions
      </h2>
      <p
        style={{
          color: "var(--muted)",
          fontSize: 12,
          marginBottom: 12,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {meta.direction === "higher" ? "higher score is better" : "lower score is better"}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.6 }}>
        {meta.directions.map((line, i) => (
          <p key={i} style={{ margin: 0 }}>
            {line}
          </p>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <button type="button" onClick={onClose}>
          got it
        </button>
      </div>
    </Modal>
  );
}
