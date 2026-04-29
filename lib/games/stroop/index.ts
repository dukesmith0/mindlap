// Stroop: 30s color-word interference. Score = correct count.

export const COLORS = ["red", "blue", "green", "yellow"] as const;
export type StroopColor = (typeof COLORS)[number];

export const COLOR_HEX: Record<StroopColor, string> = {
  red: "#e53935",
  blue: "#1e88e5",
  green: "#43a047",
  yellow: "#fdd835",
};

export const DURATION_MS = 30_000;
export const INCONGRUENT_PROB = 0.7;

export type StroopTrial = { word: string; ink: StroopColor; congruent: boolean };

// Avoids producing the same (word, ink) pair back-to-back. Same word with a
// different ink, or same ink with a different word, is fine.
export function generateTrial(
  incongruentProb: number = INCONGRUENT_PROB,
  prev: StroopTrial | null = null
): StroopTrial {
  for (let attempt = 0; attempt < 10; attempt++) {
    const ink = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    const incongruent = Math.random() < incongruentProb;

    let wordColor: StroopColor;
    if (incongruent) {
      const others = COLORS.filter((c) => c !== ink);
      wordColor = others[Math.floor(Math.random() * others.length)]!;
    } else {
      wordColor = ink;
    }

    const trial: StroopTrial = {
      word: wordColor.toUpperCase(),
      ink,
      congruent: wordColor === ink,
    };

    if (!prev || trial.word !== prev.word || trial.ink !== prev.ink) {
      return trial;
    }
  }
  // Force-swap ink as a guaranteed non-duplicate.
  const fallbackInk = (COLORS.find((c) => c !== prev!.ink) ?? COLORS[0]) as StroopColor;
  return {
    word: prev!.word,
    ink: fallbackInk,
    congruent: prev!.word.toLowerCase() === fallbackInk,
  };
}

export function isCorrect(trial: StroopTrial, selectedInk: StroopColor): boolean {
  return selectedInk === trial.ink;
}
