"use client";

import { useState } from "react";
import { Countdown } from "./Countdown";
import { MathGame } from "./MathGame";
import { DigitGame } from "./DigitGame";
import { NBackGame } from "./NBackGame";
import { StroopGame } from "./StroopGame";
import { ReactionGame } from "./ReactionGame";
import { MineGame } from "./MineGame";
import { WordGame } from "./WordGame";
import { ResultScreen } from "./ResultScreen";
import { GAMES, type GameKey } from "@/lib/games/registry";

type Phase = "ready" | "countdown" | "playing" | "result";

export function GameShell({ gameKey }: { gameKey: GameKey }) {
  const meta = GAMES[gameKey];
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState<number | null>(null);
  // runId re-mounts the active game on retry so all refs/state reset.
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
        <button type="button" onClick={start} style={{ minWidth: 160 }} autoFocus>
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
        {gameKey === "reaction" && <ReactionGame onComplete={handleComplete} />}
        {gameKey === "mine" && <MineGame onComplete={handleComplete} />}
        {gameKey === "word" && <WordGame onComplete={handleComplete} />}
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
