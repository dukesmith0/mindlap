// Canonical game metadata. Single source of truth for UI labels, score
// direction, sort order, and seeded `games` table parity. Mirrors the
// rows seeded by supabase/seed.sql.

export const GAME_KEYS = ["math", "digit", "nback", "stroop", "reaction", "mine", "word"] as const;
export type GameKey = (typeof GAME_KEYS)[number];

export type ScoreDirection = "higher" | "lower";

export type GameMeta = {
  key: GameKey;
  name: string;
  tagline: string;
  isCore: boolean;
  direction: ScoreDirection;
  sortOrder: number;
};

export const GAMES: Record<GameKey, GameMeta> = {
  math: {
    key: "math",
    name: "Speed Math",
    tagline: "60s arithmetic drill.",
    isCore: true,
    direction: "higher",
    sortOrder: 1,
  },
  digit: {
    key: "digit",
    name: "Digit Span",
    tagline: "memorise the sequence. recall it back.",
    isCore: true,
    direction: "higher",
    sortOrder: 2,
  },
  nback: {
    key: "nback",
    name: "N-Back",
    tagline: "22 letters. flag the ones that match 2 back.",
    isCore: true,
    direction: "higher",
    sortOrder: 3,
  },
  stroop: {
    key: "stroop",
    name: "Stroop",
    tagline: "30 seconds. pick the INK, not the word.",
    isCore: true,
    direction: "higher",
    sortOrder: 4,
  },
  reaction: {
    key: "reaction",
    name: "Reaction",
    tagline: "5 trials. red to green. lower is better.",
    isCore: false,
    direction: "lower",
    sortOrder: 5,
  },
  mine: {
    key: "mine",
    name: "Minesweeper",
    tagline: "10x10, 15 mines. clear it fast.",
    isCore: false,
    direction: "lower",
    sortOrder: 6,
  },
  word: {
    key: "word",
    name: "Word Recall",
    tagline: "memorise 10 words in 20s. recall them back.",
    isCore: false,
    direction: "higher",
    sortOrder: 7,
  },
};

export function isGameKey(value: unknown): value is GameKey {
  return typeof value === "string" && (GAME_KEYS as readonly string[]).includes(value);
}

export function gameMeta(key: GameKey): GameMeta {
  return GAMES[key];
}
