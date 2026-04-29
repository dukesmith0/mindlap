"use client";

import { useEffect, useRef, useState } from "react";
import { calculateAverage, getRandomDelay, TOTAL_TRIALS } from "@/lib/games/reaction";

type Phase = "ready" | "waiting" | "go" | "early" | "result" | "done";

export function ReactionGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [trial, setTrial] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [times, setTimes] = useState<number[]>([]);

  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interTrialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greenStartRef = useRef(0);
  const finishedRef = useRef(false);

  function clearTimers() {
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    if (interTrialTimerRef.current) clearTimeout(interTrialTimerRef.current);
    delayTimerRef.current = null;
    interTrialTimerRef.current = null;
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  function startTrial() {
    if (finishedRef.current) return;
    setTrial((t) => t + 1);
    setPhase("waiting");
    delayTimerRef.current = setTimeout(() => {
      delayTimerRef.current = null;
      greenStartRef.current = performance.now();
      setPhase("go");
    }, getRandomDelay());
  }

  function press() {
    if (finishedRef.current) return;
    if (phase === "ready") {
      startTrial();
    } else if (phase === "waiting") {
      // Early press: cancel the pending green and roll back the trial counter.
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
      setTrial((t) => Math.max(0, t - 1));
      setPhase("early");
    } else if (phase === "go") {
      const ms = performance.now() - greenStartRef.current;
      const newTimes = [...times, ms];
      setTimes(newTimes);
      setLast(Math.round(ms));
      setPhase("result");
      interTrialTimerRef.current = setTimeout(() => {
        interTrialTimerRef.current = null;
        if (newTimes.length >= TOTAL_TRIALS) {
          finishedRef.current = true;
          setPhase("done");
          onComplete(calculateAverage(newTimes));
        } else {
          startTrial();
        }
      }, 800);
    } else if (phase === "early") {
      startTrial();
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== " ") return;
      e.preventDefault();
      press();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const message =
    phase === "ready"
      ? "press SPACE or tap to begin"
      : phase === "waiting"
      ? "wait for green..."
      : phase === "go"
      ? "GO! press SPACE or tap"
      : phase === "early"
      ? "too early! press SPACE to retry"
      : phase === "result"
      ? `${last}ms`
      : "";

  const bg =
    phase === "go"
      ? "var(--reaction-go, #2e7d32)"
      : phase === "waiting"
      ? "var(--reaction-wait, #c62828)"
      : phase === "early"
      ? "var(--reaction-early, #f57c00)"
      : "transparent";

  return (
    <button
      type="button"
      onClick={press}
      className="game-stage game-tappable reaction-stage"
      aria-label="reaction tap zone"
      style={{ background: bg, color: phase === "ready" || phase === "result" ? "var(--ink)" : "#fff", minHeight: 280 }}
    >
      <div className="game-hud">
        <span className="game-score">trial {Math.min(trial, TOTAL_TRIALS)} / {TOTAL_TRIALS}</span>
        <span className="game-score">
          {times.length > 0 ? `avg ${calculateAverage(times)}ms` : "go fast"}
        </span>
      </div>
      <div className="game-problem game-text-reaction" aria-live="polite">
        {message}
      </div>
      <p className="game-hint">lower is better</p>
    </button>
  );
}
