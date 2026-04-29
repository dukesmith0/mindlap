// Speed Math: 60s zetamac-style arithmetic drill.
// Pure logic only. The React shell drives the timer + DOM.

export const DURATION_MS = 60_000;
export const SKIP_PENALTY_MS = 3_000;

export type Problem = { text: string; answer: number };

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateProblem(): Problem {
  const op = rand(0, 3);
  if (op === 0) {
    const a = rand(2, 100);
    const b = rand(2, 100);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  if (op === 1) {
    const a = rand(2, 100);
    const b = rand(2, 100);
    const sum = a + b;
    return { text: `${sum} - ${a}`, answer: b };
  }
  if (op === 2) {
    const a = rand(2, 12);
    const b = rand(2, 100);
    return { text: `${a} × ${b}`, answer: a * b };
  }
  const a = rand(2, 12);
  const b = rand(2, 100);
  return { text: `${a * b} ÷ ${a}`, answer: b };
}
