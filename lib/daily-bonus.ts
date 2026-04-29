// Deterministic daily double-XP rotation: pick 2 of the 7 game keys per PT date.
// Uses an FNV-1a hash of the date string (YYYY-MM-DD) so every server, every
// caller, and every cache layer agrees on the same rotation without a DB
// round-trip. No persistence required: determinism alone closes risk R3
// (cron-skip leaves a date without a seeded rotation).

import { GAME_KEYS, type GameKey } from "@/lib/games/registry";

// FNV-1a 32-bit. Stable, no deps, deterministic across runtimes.
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Returns the two game keys that get the [2x] pill on the given PT date.
// Always returns two distinct keys, ordered by sort order in GAME_KEYS.
export function getBonusGames(ptDate: string): [GameKey, GameKey] {
  const h = fnv1a(ptDate);
  const total = GAME_KEYS.length; // 7
  const a = h % total;
  // Pick the second by skipping a-prime offset so adjacent dates rotate apart.
  const offset = 1 + ((h >>> 8) % (total - 1));
  const b = (a + offset) % total;
  const pair = [GAME_KEYS[a]!, GAME_KEYS[b]!] as const;
  // Stabilise order so caller comparisons (set, equality) are predictable.
  const ordered = [...pair].sort(
    (x, y) => GAME_KEYS.indexOf(x) - GAME_KEYS.indexOf(y)
  );
  return [ordered[0] as GameKey, ordered[1] as GameKey];
}

export function isBonusGame(ptDate: string, key: GameKey): boolean {
  const [a, b] = getBonusGames(ptDate);
  return key === a || key === b;
}
