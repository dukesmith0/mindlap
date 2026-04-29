"use client";

import { useState } from "react";
import type { GameKey } from "@/lib/games/registry";

// Header for /today: title + date + search input that filters the visible
// game cards by name. Filtering is client-side (N=7, no need for a debounced
// server query) and surfaces via a `data-search` attribute the parent reads.
export function TodayHeader({
  dateLabel,
  onQueryChange,
}: {
  dateLabel: string;
  onQueryChange: (q: string) => void;
}) {
  const [q, setQ] = useState("");

  function update(next: string) {
    setQ(next);
    onQueryChange(next);
  }

  return (
    <div className="today-header">
      <div>
        <h1>Today&apos;s Games</h1>
        <p className="subtitle">{dateLabel}</p>
      </div>
      <div className="today-search">
        <input
          type="search"
          value={q}
          onChange={(e) => update(e.target.value)}
          placeholder="search games..."
          aria-label="search games"
          className="today-search-input"
        />
        {q && (
          <button
            type="button"
            onClick={() => update("")}
            className="today-search-clear"
            aria-label="clear search"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}

export function gameMatchesQuery(name: string, key: GameKey, q: string): boolean {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  return name.toLowerCase().includes(needle) || key.toLowerCase().includes(needle);
}
