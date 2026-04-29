"use client";

import { useEffect, useRef, useState } from "react";
import {
  generateStream,
  LETTER_MS,
  scoreTrials,
  TOTAL_TRIALS,
  TRIAL_MS,
} from "@/lib/games/nback";

export function NBackGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [trial, setTrial] = useState(0);
  const [letter, setLetter] = useState("");
  const [pressed, setPressed] = useState(false);

  const streamRef = useRef(generateStream(TOTAL_TRIALS));
  const responsesRef = useRef<boolean[]>(new Array(TOTAL_TRIALS).fill(false));
  const finishedRef = useRef(false);
  const trialRef = useRef(0);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let cancelled = false;

    function runTrial(i: number) {
      if (cancelled || finishedRef.current) return;
      trialRef.current = i;
      setTrial(i);
      setPressed(false);
      setLetter(streamRef.current.stream[i]!);

      const hideId = setTimeout(() => {
        if (cancelled) return;
        setLetter("");
      }, LETTER_MS);
      timers.add(hideId);

      const advanceId = setTimeout(() => {
        if (cancelled) return;
        if (i + 1 >= TOTAL_TRIALS) {
          finishedRef.current = true;
          const result = scoreTrials(streamRef.current.isTarget, responsesRef.current);
          onComplete(result.accuracy);
        } else {
          runTrial(i + 1);
        }
      }, TRIAL_MS);
      timers.add(advanceId);
    }

    runTrial(0);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [onComplete]);

  useEffect(() => {
    function press() {
      if (finishedRef.current) return;
      const idx = trialRef.current;
      if (responsesRef.current[idx]) return;
      responsesRef.current[idx] = true;
      setPressed(true);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== " ") return;
      e.preventDefault();
      press();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function onTap() {
    if (finishedRef.current) return;
    const idx = trialRef.current;
    if (responsesRef.current[idx]) return;
    responsesRef.current[idx] = true;
    setPressed(true);
  }

  const dots = Array.from({ length: TOTAL_TRIALS }, (_, i) => {
    if (i < trial) return "●";
    if (i === trial) return "◉";
    return "○";
  }).join("");

  return (
    <button
      type="button"
      onClick={onTap}
      className="game-stage game-tappable"
      aria-label="tap on match"
    >
      <div className="game-hud">
        <span className="game-score">trial {Math.min(trial + 1, TOTAL_TRIALS)} / {TOTAL_TRIALS}</span>
        <span className="game-score">{pressed ? "match!" : "watch"}</span>
      </div>
      <div className="game-problem game-text-nback" aria-live="polite">
        {letter || " "}
      </div>
      <div className="game-dots" aria-hidden="true">{dots}</div>
      <p className="game-hint">press SPACE (or tap) when the letter matches the one 2 back.</p>
    </button>
  );
}
