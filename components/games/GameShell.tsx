"use client";

import { useState } from "react";
import { Countdown } from "./Countdown";
import { MathGame } from "./MathGame";
import { DigitGame } from "./DigitGame";
import { NBackGame } from "./NBackGame";
import { StroopGame } from "./StroopGame";
import { ResultScreen } from "./ResultScreen";

type GameKey = "math" | "digit" | "nback" | "stroop";
type Phase = "ready" | "countdown" | "playing" | "result";
type Direction = "higher" | "lower";

const GAMES: Record<
  GameKey,
  { name: string; tagline: string; direction: Direction }
> = {
  math: { name: "Speed Math", tagline: "60 seconds. arithmetic drill.", direction: "higher" },
  digit: { name: "Digit Span", tagline: "memorise the sequence. recall it back.", direction: "higher" },
  nback: { name: "N-Back", tagline: "22 letters. flag the ones that match 2 back.", direction: "higher" },
  stroop: { name: "Stroop", tagline: "30 seconds. pick the INK, not the word.", direction: "higher" },
};

export function GameShell({ gameKey }: { gameKey: GameKey }) {
  const meta = GAMES[gameKey];
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState<number | null>(null);
  // Bumping this re-mounts game components so retry starts cleanly.
  const [runId, setRunId] = useState(0);

  function start() {
    setScore(null);
    setPhase("countdown");
  }

  function handleComplete(s: number) {
    setScore(s);
    setPhase("result");
  }

  function retry() {
    setRunId((n) => n + 1);
    setScore(null);
    setPhase("countdown");
  }

  if (phase === "ready") {
    return (
      <section className="game-stage">
        <h1>{meta.name}</h1>
        <p style={{ color: "var(--muted)", marginBottom: 32 }}>{meta.tagline}</p>
        <button type="button" onClick={start} style={{ minWidth: 160 }}>
          start -&gt;
        </button>
      </section>
    );
  }

  if (phase === "countdown") {
    return <Countdown onDone={() => setPhase("playing")} />;
  }

  if (phase === "playing") {
    return (
      <div key={runId}>
        {gameKey === "math" && <MathGame onComplete={handleComplete} />}
        {gameKey === "digit" && <DigitGame onComplete={handleComplete} />}
        {gameKey === "nback" && <NBackGame onComplete={handleComplete} />}
        {gameKey === "stroop" && <StroopGame onComplete={handleComplete} />}
      </div>
    );
  }

  return (
    <ResultScreen
      gameKey={gameKey}
      gameName={meta.name}
      score={score ?? 0}
      direction={meta.direction}
      onRetry={retry}
    />
  );
}
