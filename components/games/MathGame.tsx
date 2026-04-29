"use client";

import { useEffect, useRef, useState } from "react";
import { generateProblem, DURATION_MS, SKIP_PENALTY_MS, type Problem } from "@/lib/games/math";

export function MathGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState<Problem>(() => generateProblem());
  const [value, setValue] = useState("");
  const [tenths, setTenths] = useState(DURATION_MS / 100);
  const [flash, setFlash] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const tenthsRef = useRef(DURATION_MS / 100);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirror score so the timer's onComplete reads the latest value at expiry.
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    inputRef.current?.focus();
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
      const flashTimer = flashTimerRef.current;
      if (flashTimer) clearTimeout(flashTimer);
    };
  }, [onComplete]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setValue(raw);
    const n = Number.parseInt(raw, 10);
    if (!Number.isNaN(n) && n === problem.answer) {
      setScore((s) => s + 1);
      setProblem(generateProblem());
      setValue("");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    tenthsRef.current = Math.max(0, tenthsRef.current - SKIP_PENALTY_MS / 100);
    setTenths(tenthsRef.current);
    setProblem(generateProblem());
    setValue("");
    setFlash(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(false), 250);
  }

  const secs = Math.floor(Math.max(0, tenths) / 10);
  const tenthDigit = Math.max(0, tenths) % 10;

  return (
    <div className="game-stage">
      <div className="game-hud">
        <span className={`game-timer${flash ? " is-penalty" : ""}`}>
          {secs}.{tenthDigit}
        </span>
        <span className="game-score">score {score}</span>
      </div>
      <div className="game-problem game-text-math" aria-live="polite">
        {problem.text}
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label="answer"
        className="game-input"
      />
      <p className="game-hint">type the answer. press enter to skip (-3s).</p>
    </div>
  );
}
