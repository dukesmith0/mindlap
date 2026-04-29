"use client";

import { useEffect, useRef, useState } from "react";
import {
  N,
  MINE_COUNT,
  generateMines,
  computeCounts,
  revealFlood,
  isWon,
} from "@/lib/games/mine";

type Cell = { revealed: boolean; flagged: boolean; mine: boolean; count: number };

function emptyBoard(): Cell[][] {
  return Array.from({ length: N }, () =>
    Array.from({ length: N }, () => ({ revealed: false, flagged: false, mine: false, count: 0 }))
  );
}

export function MineGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard);
  const [started, setStarted] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startTimeRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!started || finishedRef.current) return;
    let raf = 0;
    function tick() {
      if (finishedRef.current) return;
      setElapsedMs(performance.now() - startTimeRef.current);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  function reveal(r: number, c: number) {
    if (finishedRef.current) return;
    const cell = board[r]![c]!;
    if (cell.revealed || cell.flagged) return;

    const next = board.map((row) => row.map((c) => ({ ...c })));

    if (!started) {
      const mines = generateMines(N, N, MINE_COUNT, r, c);
      const counts = computeCounts(mines);
      for (let rr = 0; rr < N; rr++) {
        for (let cc = 0; cc < N; cc++) {
          next[rr]![cc]!.mine = mines[rr]![cc]!;
          next[rr]![cc]!.count = counts[rr]![cc]!;
        }
      }
      // Inside the reveal() event handler, not render. Lint can't tell.
      // eslint-disable-next-line react-hooks/purity
      startTimeRef.current = performance.now();
      setStarted(true);
    }

    if (next[r]![c]!.mine) {
      // Boom: flip every mine and end.
      for (let rr = 0; rr < N; rr++) {
        for (let cc = 0; cc < N; cc++) {
          if (next[rr]![cc]!.mine) next[rr]![cc]!.revealed = true;
        }
      }
      next[r]![c]!.revealed = true;
      finishedRef.current = true;
      setBoard(next);
      setExploded(true);
      return;
    }

    const counts = next.map((row) => row.map((c) => c.count));
    const revealed = next.map((row) => row.map((c) => c.revealed));
    const opened = revealFlood(counts, revealed, r, c);
    for (const [rr, cc] of opened) next[rr]![cc]!.revealed = true;

    const minesGrid = next.map((row) => row.map((c) => c.mine));
    if (isWon(minesGrid, revealed)) {
      finishedRef.current = true;
      setBoard(next);
      // Inside the reveal() event handler, not render.
      // eslint-disable-next-line react-hooks/purity
      const seconds = parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(2));
      onComplete(Math.max(1, Math.round(seconds))); // games.min_score=1; round to nearest second.
      return;
    }
    setBoard(next);
  }

  function flag(r: number, c: number, e: React.MouseEvent) {
    e.preventDefault();
    if (finishedRef.current) return;
    const cell = board[r]![c]!;
    if (cell.revealed) return;
    const next = board.map((row) => row.map((c) => ({ ...c })));
    next[r]![c]!.flagged = !next[r]![c]!.flagged;
    setBoard(next);
    setFlagCount((n) => n + (next[r]![c]!.flagged ? 1 : -1));
  }

  function fmtTime(ms: number): string {
    const total = Math.floor(ms / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <div className="game-stage">
      <div className="game-hud">
        <span className="game-timer">{fmtTime(elapsedMs)}</span>
        <span className="game-score">
          {MINE_COUNT - flagCount} mine{MINE_COUNT - flagCount === 1 ? "" : "s"} left
        </span>
      </div>
      <div className="mine-grid" role="grid">
        {board.map((row, r) => (
          <div key={r} className="mine-row" role="row">
            {row.map((cell, c) => (
              <button
                key={c}
                type="button"
                role="gridcell"
                onClick={() => reveal(r, c)}
                onContextMenu={(e) => flag(r, c, e)}
                className={
                  "mine-cell" +
                  (cell.revealed ? " is-revealed" : "") +
                  (cell.flagged ? " is-flagged" : "") +
                  (cell.revealed && cell.mine ? " is-mine" : "")
                }
                data-n={cell.revealed && !cell.mine && cell.count > 0 ? cell.count : ""}
                aria-label={cell.flagged ? "flagged" : cell.revealed ? "revealed" : "hidden"}
              >
                {cell.revealed && cell.mine ? "*" : cell.flagged ? "!" : cell.revealed && cell.count > 0 ? cell.count : ""}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="game-hint">
        click to reveal, right-click to flag. {exploded ? "boom! retry." : "clear all non-mines as fast as you can."}
      </p>
    </div>
  );
}
