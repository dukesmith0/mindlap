// Minesweeper: 10x10 grid, 15 mines, first-click-safe. Score = seconds to clear (lower better).

export const N = 10;
export const MINE_COUNT = 15;

// Places mines on rows×cols, excluding the 3×3 neighborhood centered on
// (excludeR, excludeC). The first click is always safe and typically opens a
// zero-cell flood.
export function generateMines(
  rows: number,
  cols: number,
  mineCount: number,
  excludeR: number,
  excludeC: number
): boolean[][] {
  const mines: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const positions: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.abs(r - excludeR) <= 1 && Math.abs(c - excludeC) <= 1) continue;
      positions.push([r, c]);
    }
  }
  const pickCount = Math.min(mineCount, positions.length);
  for (let i = 0; i < pickCount; i++) {
    const j = i + Math.floor(Math.random() * (positions.length - i));
    [positions[i], positions[j]] = [positions[j]!, positions[i]!];
    const [r, c] = positions[i]!;
    mines[r]![c] = true;
  }
  return mines;
}

// Counts adjacent mines per cell. Mine cells get -1.
export function computeCounts(mines: boolean[][]): number[][] {
  const rows = mines.length;
  const cols = mines[0]!.length;
  const counts: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mines[r]![c]) {
        counts[r]![c] = -1;
        continue;
      }
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          if (mines[rr]![cc]) n++;
        }
      }
      counts[r]![c] = n;
    }
  }
  return counts;
}

// Iterative flood-fill reveal. Mutates `revealed`. Never flips mines.
export function revealFlood(
  counts: number[][],
  revealed: boolean[][],
  r: number,
  c: number
): [number, number][] {
  const rows = counts.length;
  const cols = counts[0]!.length;
  const stack: [number, number][] = [[r, c]];
  const opened: [number, number][] = [];
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue;
    if (revealed[cr]![cc]) continue;
    if (counts[cr]![cc] === -1) continue;
    revealed[cr]![cc] = true;
    opened.push([cr, cc]);
    if (counts[cr]![cc] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([cr + dr, cc + dc]);
        }
      }
    }
  }
  return opened;
}

export function isWon(mines: boolean[][], revealed: boolean[][]): boolean {
  const rows = mines.length;
  const cols = mines[0]!.length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!mines[r]![c] && !revealed[r]![c]) return false;
    }
  }
  return true;
}
