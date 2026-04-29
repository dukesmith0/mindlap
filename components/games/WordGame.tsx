"use client";

import { useEffect, useRef, useState } from "react";
import { selectWords, scoreRecall, SHOW_DURATION_MS } from "@/lib/games/word";

type Phase = "show" | "recall" | "done";

export function WordGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [shown] = useState<string[]>(() => selectWords());
  const [phase, setPhase] = useState<Phase>("show");
  const [tenths, setTenths] = useState(SHOW_DURATION_MS / 100);
  const [value, setValue] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (phase !== "show") return;
    const id = setInterval(() => {
      setTenths((t) => {
        const next = t - 1;
        if (next <= 0) {
          clearInterval(id);
          setPhase("recall");
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "recall") {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [phase]);

  function submit() {
    if (finishedRef.current || phase !== "recall") return;
    finishedRef.current = true;
    setPhase("done");
    onComplete(scoreRecall(shown, value));
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  }

  const secs = Math.ceil(Math.max(0, tenths) / 10);

  return (
    <div className="game-stage">
      {phase === "show" && (
        <>
          <div className="game-hud">
            <span className="game-timer">{secs}s</span>
            <span className="game-score">memorise</span>
          </div>
          <div className="word-grid">
            {shown.map((w) => (
              <div key={w} className="word-cell">{w}</div>
            ))}
          </div>
          <p className="game-hint">10 words. recall as many as you can after the timer.</p>
        </>
      )}
      {phase === "recall" && (
        <>
          <div className="game-hud">
            <span className="game-score">recall phase</span>
            <span className="game-score">space or comma between words</span>
          </div>
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            rows={5}
            className="word-input"
            placeholder="type words..."
            aria-label="recalled words"
          />
          <button type="button" onClick={submit}>
            done -&gt; (ctrl+enter)
          </button>
          <p className="game-hint">case-insensitive. duplicates and wrong words don&apos;t count.</p>
        </>
      )}
    </div>
  );
}
