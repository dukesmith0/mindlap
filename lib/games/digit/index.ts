// Digit Span: short-term memory game.
// Score = last successfully recalled length (3..15). No overall time cap.

export const START_LENGTH = 3;
export const MAX_LENGTH = 15;

export function generateSequence(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

export function isMatch(expected: string, actual: string): boolean {
  return String(expected).trim() === String(actual).trim();
}

// 2000ms at length 3, +500ms per extra digit.
export function getDisplayTime(length: number): number {
  return 2000 + (length - 3) * 500;
}
