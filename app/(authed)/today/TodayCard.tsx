"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePinAction } from "@/actions/submission";
import { Tooltip } from "@/components/ui/Tooltip";
import { DirectionBadge } from "@/components/today/DirectionBadge";
import type { GameKey } from "@/lib/games/registry";

type Preview = { user_id: string; score: number; username: string | null; rank: number };

export function TodayCard({
  gameKey,
  name,
  tagline,
  isCore,
  isPinned: initialPinned,
  isBonus,
  best,
  authed,
  preview,
  selfOverflow,
  meId,
}: {
  gameKey: GameKey;
  name: string;
  tagline: string;
  isCore: boolean;
  isPinned: boolean;
  isBonus: boolean;
  best: number | undefined;
  authed: boolean;
  preview: Preview[];
  selfOverflow: Preview | null;
  meId: string | null;
}) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [pending, startTransition] = useTransition();

  function togglePin() {
    if (!authed) return;
    const next = !isPinned;
    setIsPinned(next); // optimistic
    const form = new FormData();
    form.set("game_key", gameKey);
    form.set("pinned", next ? "1" : "");
    startTransition(async () => {
      const r = await togglePinAction(form);
      if (!r.ok) {
        setIsPinned(!next); // rollback
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="game-card-row" role="listitem">
      <div>
        <div className="game-card-title">
          {authed && (
            <button
              type="button"
              className={`game-card-pin${isPinned ? " is-pinned" : ""}`}
              onClick={togglePin}
              disabled={pending}
              aria-label={isPinned ? "unpin" : "pin"}
              title={isPinned ? "unpin" : "pin to top"}
            >
              {isPinned ? ">" : "*"}
            </button>
          )}
          <span>{name}</span>
          {isCore && (
            <Tooltip text="cognitively core game">
              <span className="game-card-star">*</span>
            </Tooltip>
          )}
          {isBonus && <span className="game-card-pill">[2x xp]</span>}
          <DirectionBadge gameKey={gameKey} />
        </div>
        <div className="game-card-meta">
          {tagline}
          {best !== undefined && (
            <>
              {" - best today: "}
              <b style={{ color: "var(--ink)", fontWeight: 400 }}>{best}</b>
            </>
          )}
        </div>
        {authed && best === undefined && preview.length === 0 && (
          <div className="lb-not-played" aria-label="not yet played today">
            NOT YET PLAYED
          </div>
        )}
        {preview.length > 0 && (
          <div className="lb-preview" aria-label="today's friend leaderboard">
            {preview.map((row) => (
              <div
                key={row.user_id}
                className={`lb-preview-row${row.user_id === meId ? " is-you" : ""}`}
              >
                <span>{row.rank}</span>
                <span>{row.username ?? "anon"}</span>
                <span>{row.score}</span>
              </div>
            ))}
            {selfOverflow && (
              <>
                <div className="lb-preview-row lb-preview-ellipsis" aria-hidden>
                  <span>...</span>
                  <span />
                  <span />
                </div>
                <div
                  key={selfOverflow.user_id}
                  className="lb-preview-row is-you"
                >
                  <span>{selfOverflow.rank}</span>
                  <span>{selfOverflow.username ?? "you"}</span>
                  <span>{selfOverflow.score}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {authed ? (
        <Link href={`/play/${gameKey}`} className="btn-link">play -&gt;</Link>
      ) : (
        <Link href="/login" className="btn-link">sign in -&gt;</Link>
      )}
    </div>
  );
}
