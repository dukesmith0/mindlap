"use client";

import { useEffect, useState } from "react";
import { Countdown } from "./Countdown";
import { DirectionsModal } from "./DirectionsModal";
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

const DIRECTIONS_STORAGE = "mindlap.directions.seen.";

export function GameShell({ gameKey }: { gameKey: GameKey }) {
  const meta = GAMES[gameKey];
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState<number | null>(null);
  // runId re-mounts the active game on retry so all refs/state reset.
  const [runId, setRunId] = useState(0);
  const [directionsOpen, setDirectionsOpen] = useState(false);

  // #54 — auto-open the directions modal the first time the user lands on a
  // game's ready screen. localStorage isn't readable during SSR, so we sync
  // post-mount.
  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(DIRECTIONS_STORAGE + gameKey);
      if (!seen) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDirectionsOpen(true);
      }
    } catch {
      // localStorage may be disabled.
    }
  }, [gameKey]);

  function closeDirections() {
    setDirectionsOpen(false);
    try {
      window.localStorage.setItem(DIRECTIONS_STORAGE + gameKey, "1");
    } catch {
      // ignore
    }
  }

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
        <p style={{ color: "var(--muted)", marginBottom: 16 }}>{meta.tagline}</p>
        <p style={{ marginBottom: 32 }}>
          <button
            type="button"
            className="direction-badge"
            onClick={() => setDirectionsOpen(true)}
          >
            directions ({meta.direction})
          </button>
        </p>
        <button type="button" onClick={start} style={{ minWidth: 160 }} autoFocus>
          start -&gt;
        </button>
        <DirectionsModal gameKey={gameKey} open={directionsOpen} onClose={closeDirections} />
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
