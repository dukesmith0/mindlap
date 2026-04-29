// Reaction: 5 trials of red->green, score = average reaction ms (lower better).

export const TOTAL_TRIALS = 5;
export const MIN_DELAY_MS = 2000;
export const MAX_DELAY_MS = 5000;

export function calculateAverage(times: number[]): number {
  if (times.length === 0) return 0;
  const sum = times.reduce((a, b) => a + b, 0);
  return Math.round(sum / times.length);
}

export function getRandomDelay(): number {
  // Inclusive [MIN, MAX].
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}
