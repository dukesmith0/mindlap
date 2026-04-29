"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePinAction } from "@/actions/submission";
import { Tooltip } from "@/components/ui/Tooltip";
import type { GameKey } from "@/lib/games/registry";

type Preview = { user_id: string; score: number; username: string | null };

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
        </div>
        <div className="game-card-meta">
          {tagline}
          {best !== undefined ? (
            <>
              {" - best today: "}
              <b style={{ color: "var(--ink)", fontWeight: 400 }}>{best}</b>
            </>
          ) : authed ? (
            " - not played today"
          ) : null}
        </div>
        {preview.length > 0 && (
          <div className="lb-preview" aria-label="today's top scores">
            {preview.map((row, i) => (
              <div
                key={`${row.user_id}-${i}`}
                className={`lb-preview-row${row.user_id === meId ? " is-you" : ""}`}
              >
                <span>{i + 1}</span>
                <span>{row.username ?? "anon"}</span>
                <span>{row.score}</span>
              </div>
            ))}
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
