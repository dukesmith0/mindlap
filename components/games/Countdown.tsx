"use client";

import { useEffect, useState } from "react";

// 3-2-1-Go countdown shown before every game starts.
// onDone fires after "Go" is rendered for ~200ms so the player has visual confirmation.
export function Countdown({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<3 | 2 | 1 | 0>(3);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 800);
    const t2 = setTimeout(() => setStep(1), 1600);
    const t3 = setTimeout(() => setStep(0), 2400);
    const t4 = setTimeout(onDone, 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 240,
        fontSize: 96,
        color: step === 0 ? "var(--accent)" : "var(--ink)",
      }}
      aria-live="polite"
      role="status"
    >
      <span key={step} className="countdown-step">
        {step === 0 ? "go" : step}
      </span>
    </div>
  );
}
