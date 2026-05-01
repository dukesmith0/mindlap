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
  // #54 — short paragraph for the direction-badge popup. One sentence per
  // line; surfaced verbatim in the Tooltip-style modal.
  directions: string[];
};

export const GAMES: Record<GameKey, GameMeta> = {
  math: {
    key: "math",
    name: "Speed Math",
    tagline: "60s arithmetic drill.",
    isCore: true,
    direction: "higher",
    sortOrder: 1,
    directions: [
      "You have 60 seconds to solve as many arithmetic problems as you can.",
      "Type the answer and press Enter to advance.",
      "Higher score is better.",
    ],
  },
  digit: {
    key: "digit",
    name: "Digit Span",
    tagline: "memorise the sequence. recall it back.",
    isCore: true,
    direction: "higher",
    sortOrder: 2,
    directions: [
      "A sequence of digits flashes briefly. Type them back in order.",
      "Each correct round adds one digit. Miss one and the round ends.",
      "Score = the longest sequence you successfully recalled. Higher is better.",
    ],
  },
  nback: {
    key: "nback",
    name: "N-Back",
    tagline: "22 letters. flag the ones that match 2 back.",
    isCore: true,
    direction: "higher",
    sortOrder: 3,
    directions: [
      "Letters appear one at a time. Press the match key when the current letter equals the one shown 2 steps earlier.",
      "There are 22 letters per round.",
      "Score = number of correctly flagged matches. Higher is better.",
    ],
  },
  stroop: {
    key: "stroop",
    name: "Stroop",
    tagline: "30 seconds. pick the INK, not the word.",
    isCore: true,
    direction: "higher",
    sortOrder: 4,
    directions: [
      "Words appear in colored ink. Pick the INK color, not what the word reads.",
      "30 seconds per round.",
      "Score = number of correct picks minus mistakes. Higher is better.",
    ],
  },
  reaction: {
    key: "reaction",
    name: "Reaction",
    tagline: "5 trials. red to green. lower is better.",
    isCore: false,
    direction: "lower",
    sortOrder: 5,
    directions: [
      "Wait for the screen to turn green, then click as fast as you can.",
      "Click before it turns green and the trial counts as a miss.",
      "Score = median reaction time across 5 trials, in milliseconds. LOWER is better.",
    ],
  },
  mine: {
    key: "mine",
    name: "Minesweeper",
    tagline: "10x10, 15 mines. clear it fast.",
    isCore: false,
    direction: "lower",
    sortOrder: 6,
    directions: [
      "Clear every safe cell on a 10×10 grid containing 15 mines.",
      "Click to reveal a cell. Right-click (or long-press) to flag a suspected mine.",
      "Score = seconds to clear the board. LOWER is better.",
    ],
  },
  word: {
    key: "word",
    name: "Word Recall",
    tagline: "memorise 10 words in 20s. recall them back.",
    isCore: false,
    direction: "higher",
    sortOrder: 7,
    directions: [
      "Ten words appear for 20 seconds. Memorise them.",
      "After the words disappear, type each one you can recall (in any order).",
      "Score = number of words correctly recalled. Higher is better.",
    ],
  },
};

export function isGameKey(value: unknown): value is GameKey {
  return typeof value === "string" && (GAME_KEYS as readonly string[]).includes(value);
}

export function gameMeta(key: GameKey): GameMeta {
  return GAMES[key];
}
