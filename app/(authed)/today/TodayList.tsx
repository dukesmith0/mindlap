"use client";

import { useState } from "react";
import { TodayHeader, gameMatchesQuery } from "./TodayHeader";
import { TodayCard } from "./TodayCard";
import { GAMES, type GameKey } from "@/lib/games/registry";

type TopRow = { user_id: string; score: number; username: string | null; rank: number };

export type TodayCardData = {
  key: GameKey;
  name: string;
  tagline: string;
  isCore: boolean;
  isPinned: boolean;
  isBonus: boolean;
  best: number | undefined;
  preview: TopRow[];
  selfOverflow: TopRow | null;
};

export function TodayList({
  dateLabel,
  cards,
  authed,
  meId,
}: {
  dateLabel: string;
  cards: TodayCardData[];
  authed: boolean;
  meId: string | null;
}) {
  const [query, setQuery] = useState("");

  const visible = cards.filter((c) =>
    gameMatchesQuery(GAMES[c.key].name, c.key, query)
  );

  return (
    <>
      <TodayHeader dateLabel={dateLabel} onQueryChange={setQuery} />
      <div role="list" style={{ marginTop: 32 }}>
        {visible.length === 0 ? (
          <p className="tag" style={{ padding: "24px 0" }}>
            no games match &quot;{query}&quot;
          </p>
        ) : (
          visible.map((c) => (
            <TodayCard
              key={c.key}
              gameKey={c.key}
              name={c.name}
              tagline={c.tagline}
              isCore={c.isCore}
              isPinned={c.isPinned}
              isBonus={c.isBonus}
              best={c.best}
              authed={authed}
              preview={c.preview}
              selfOverflow={c.selfOverflow}
              meId={meId}
            />
          ))
        )}
      </div>
    </>
  );
}
