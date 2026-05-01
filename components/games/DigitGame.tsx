"use client";

import { useEffect, useRef, useState } from "react";
import {
  generateSequence,
  getDisplayTime,
  isMatch,
  MAX_LENGTH,
  START_LENGTH,
} from "@/lib/games/digit";

type Phase = "show" | "answer" | "done";

// #14 step-fn breakpoints. Default `.game-text-digit` is 80px; override per
// length so 10+ digits don't overflow the 592px content column.
function digitLenClass(length: number): string {
  if (length >= 18) return "digit-len-18";
  if (length >= 15) return "digit-len-15";
  if (length >= 12) return "digit-len-12";
  if (length >= 10) return "digit-len-10";
  return "";
}

export function DigitGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [length, setLength] = useState(START_LENGTH);
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState(() => generateSequence(START_LENGTH));
  const [phase, setPhase] = useState<Phase>("show");
  const [value, setValue] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("memorise");

  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (phase !== "show") return;
    const id = setTimeout(() => {
      setPhase("answer");
      setMessage("type the sequence and press enter");
    }, getDisplayTime(length));
    return () => clearTimeout(id);
  }, [phase, length]);

  useEffect(() => {
    if (phase === "answer") {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [phase]);

  function submit() {
    if (phase !== "answer" || finishedRef.current) return;
    if (!isMatch(sequence, value)) {
      finishedRef.current = true;
      setPhase("done");
      onComplete(score);
      return;
    }
    const completed = length;
    const nextLength = length + 1;
    setScore(completed);
    if (nextLength > MAX_LENGTH) {
      finishedRef.current = true;
      setPhase("done");
      onComplete(completed);
      return;
    }
    setRound((r) => r + 1);
    setLength(nextLength);
    setSequence(generateSequence(nextLength));
    setValue("");
    setPhase("show");
    setMessage("memorise");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="game-stage">
      <div className="game-hud">
        <span className="game-score">round {round} / length {length}</span>
        <span className="game-score">best {score}</span>
      </div>
      <div
        className={`game-problem game-text-digit ${digitLenClass(length)}`}
        aria-live="polite"
      >
        {phase === "show" ? sequence : ""}
      </div>
      <p className="game-hint">{message}</p>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label="recall"
        className="game-input"
        disabled={phase !== "answer"}
        style={{ visibility: phase === "answer" ? "visible" : "hidden" }}
      />
    </div>
  );
}
