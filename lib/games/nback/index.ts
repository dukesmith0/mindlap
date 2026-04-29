// 2-back N-Back working memory game.
// Score = accuracy % over the 20 scorable trials (indices 2..21 of a 22-trial stream).

export const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export const TOTAL_TRIALS = 22;
export const LETTER_MS = 1000;
export const BLANK_MS = 1500;
export const TRIAL_MS = LETTER_MS + BLANK_MS;
export const TARGET_PROB = 0.3;

function randomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]!;
}

function randomLetterExcluding(exclude: string): string {
  const pool = LETTERS.filter((l) => l !== exclude);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function generateStream(
  length: number = TOTAL_TRIALS,
  targetProb: number = TARGET_PROB
): { stream: string[]; isTarget: boolean[] } {
  const stream: string[] = new Array(length);
  const isTarget: boolean[] = new Array(length).fill(false);

  // First two letters: random, never targets.
  for (let i = 0; i < Math.min(2, length); i++) {
    stream[i] = randomLetter();
  }

  for (let i = 2; i < length; i++) {
    if (Math.random() < targetProb) {
      stream[i] = stream[i - 2]!;
    } else {
      stream[i] = randomLetterExcluding(stream[i - 2]!);
    }
    isTarget[i] = stream[i] === stream[i - 2];
  }

  return { stream, isTarget };
}

export type TrialScore = {
  hits: number;
  correctRejections: number;
  falseAlarms: number;
  misses: number;
  accuracy: number;
};

export function scoreTrials(isTarget: boolean[], responses: boolean[]): TrialScore {
  let hits = 0;
  let correctRejections = 0;
  let falseAlarms = 0;
  let misses = 0;
  let scorable = 0;

  for (let i = 2; i < isTarget.length; i++) {
    scorable++;
    const target = !!isTarget[i];
    const pressed = !!responses[i];
    if (target && pressed) hits++;
    else if (target && !pressed) misses++;
    else if (!target && pressed) falseAlarms++;
    else correctRejections++;
  }

  const accuracy =
    scorable === 0 ? 0 : Math.round(((hits + correctRejections) / scorable) * 100);

  return { hits, correctRejections, falseAlarms, misses, accuracy };
}
