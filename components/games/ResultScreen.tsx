"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitScoreAction } from "@/actions/submission";
import { GAME_KEYS, type GameKey } from "@/lib/games/registry";

type Direction = "higher" | "lower";

// Wraps around so the last game points back to the first (daily-user loop).
function nextGame(key: GameKey): GameKey | null {
  const i = GAME_KEYS.indexOf(key);
  if (i === -1) return null;
  return GAME_KEYS[(i + 1) % GAME_KEYS.length] ?? null;
}

export function ResultScreen({
  gameKey,
  gameName,
  score,
  direction,
  onRetry,
}: {
  gameKey: GameKey;
  gameName: string;
  score: number;
  direction: Direction;
  onRetry: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number>(0);
  const [isNewPb, setIsNewPb] = useState<boolean>(false);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const next = nextGame(gameKey);

  useEffect(() => {
    submitBtnRef.current?.focus();
  }, []);

  function submit() {
    if (pending || submitted) return;
    setError(null);
    const form = new FormData();
    form.set("game_key", gameKey);
    form.set("score", String(score));
    startTransition(async () => {
      const r = await submitScoreAction(form);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setXpAwarded(r.data.xpAwarded);
      setIsNewPb(r.data.isNewPb);
      setSubmitted(true);
      router.refresh();
    });
  }

  // Power-user shortcuts: Enter submits, R retries, N goes to next game.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!submitted && e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        onRetry();
      } else if (e.key.toLowerCase() === "n" && submitted && next) {
        e.preventDefault();
        router.push(`/play/${next}`);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, next, score]);

  return (
    <section className="game-stage">
      <h2>{gameName} - result</h2>
      <div className="game-problem game-text-result" aria-live="polite">
        {score}
      </div>
      <p className="game-hint">
        {direction === "higher" ? "higher is better" : "lower is better"}
        {" - "}
        {submitted ? "saved" : "submit to save"}
      </p>
      {submitted ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {next && (
            <button
              type="button"
              autoFocus
              onClick={() => router.push(`/play/${next}`)}
            >
              next: {next} -&gt; (n)
            </button>
          )}
          <button type="button" onClick={onRetry}>retry (r)</button>
          <button type="button" onClick={() => router.push("/today")}>back to today</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button ref={submitBtnRef} type="button" onClick={submit} disabled={pending}>
            {pending ? "..." : "submit -> (enter)"}
          </button>
          <button type="button" onClick={onRetry} disabled={pending}>
            retry (r)
          </button>
        </div>
      )}
      {error && (
        <p style={{ color: "var(--accent)", marginTop: 12, fontSize: 13 }} role="alert">
          [{error}]
        </p>
      )}
      {submitted && !error && (
        <div className="result-saved" role="status">
          {isNewPb && <span className="result-pb">[new PB]</span>}
          {xpAwarded > 0 && (
            <span className="result-xp">+{xpAwarded} xp</span>
          )}
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            [saved. streak ticked, leaderboard updated.]
          </span>
        </div>
      )}
    </section>
  );
}
