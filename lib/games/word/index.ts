// Word Recall: memorize 10 of 115 words for 20s, recall as many as possible.
// Score = correct count 0-10. Case-insensitive, deduped, no penalty for wrong.

import { WORDLIST } from "./words";

export { WORDLIST };
export const SHOW_DURATION_MS = 20_000;
export const WORDS_PER_ROUND = 10;

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function selectWords(count: number = WORDS_PER_ROUND, pool: readonly string[] = WORDLIST): string[] {
  const arr = pool.slice();
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i++) {
    const j = rand(i, arr.length - 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr.slice(0, n);
}

// Dedupe + case-insensitive + non-letter splitting.
export function scoreRecall(shownWords: readonly string[], userInput: string): number {
  if (typeof userInput !== "string" || userInput.length === 0) return 0;
  const shown = new Set(shownWords.map((w) => w.toLowerCase()));
  const tokens = userInput
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length > 0);
  const guessed = new Set(tokens);
  let count = 0;
  for (const w of guessed) if (shown.has(w)) count++;
  return count;
}
