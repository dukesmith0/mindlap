"use client";

import { useEffect, useRef, useState } from "react";
import {
  COLORS,
  COLOR_HEX,
  DURATION_MS,
  generateTrial,
  isCorrect,
  type StroopColor,
  type StroopTrial,
} from "@/lib/games/stroop";

export function StroopGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [trial, setTrial] = useState<StroopTrial>(() => generateTrial());
  const [score, setScore] = useState(0);
  const [tenths, setTenths] = useState(DURATION_MS / 100);
  const [wrong, setWrong] = useState(false);

  const tenthsRef = useRef(DURATION_MS / 100);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const id = setInterval(() => {
      tenthsRef.current -= 1;
      setTenths(tenthsRef.current);
      if (tenthsRef.current <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        clearInterval(id);
        onComplete(scoreRef.current);
      }
    }, 100);
    return () => {
      clearInterval(id);
      // Flash timer is set lazily by respond(); read the latest pending id.
      const wrongTimer = wrongTimerRef.current;
      if (wrongTimer) clearTimeout(wrongTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx === -1) return;
      e.preventDefault();
      respond(COLORS[idx]!);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial]);

  function respond(selectedInk: StroopColor) {
    if (finishedRef.current) return;
    if (isCorrect(trial, selectedInk)) {
      setScore((s) => s + 1);
      setTrial((prev) => generateTrial(0.7, prev));
      setWrong(false);
    } else {
      setWrong(true);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrong(false), 150);
    }
  }

  const secs = Math.floor(Math.max(0, tenths) / 10);
  const tenthDigit = Math.max(0, tenths) % 10;
  const inkColor = wrong ? COLOR_HEX.red : COLOR_HEX[trial.ink];

  return (
    <div className="game-stage">
      <div className="game-hud">
        <span className="game-timer">{secs}.{tenthDigit}</span>
        <span className="game-score">score {score}</span>
      </div>
      <div
        className={`game-problem game-text-stroop${wrong ? " is-wrong" : ""}`}
        style={{ color: inkColor }}
        aria-live="polite"
      >
        {trial.word}
      </div>
      <div className="stroop-buttons">
        {COLORS.map((c, i) => (
          <button
            key={c}
            type="button"
            onClick={() => respond(c)}
            className="stroop-btn"
            style={{ borderColor: COLOR_HEX[c], color: COLOR_HEX[c] }}
          >
            {i + 1} {c}
          </button>
        ))}
      </div>
      <p className="game-hint">press 1/2/3/4 (or click) for the INK color, not the word.</p>
    </div>
  );
}
