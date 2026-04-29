// Per-badge icon map. Per decisions.md (2026-04-28), the "no emoji" rule has
// an exception for the streak ribbon and badges: each badge_key maps to a
// themed emoji so the badge wall has visual identity instead of identical
// accent dots. Add new keys here when new badges ship.

import { GAME_KEYS, type GameKey } from "@/lib/games/registry";

// Per-game first-PB badges use a game-themed emoji each (one emoji per badge,
// not a trophy + theme combo). This keeps the visual rule simple and reads
// well at small sizes.
const PB_ICON: Record<GameKey, string> = {
  math: "🧮",
  digit: "🔢",
  nback: "🧠",
  stroop: "🎨",
  reaction: "⚡",
  mine: "💣",
  word: "📝",
};

const STATIC_ICONS: Record<string, string> = {
  streak_3: "🔥",
  streak_7: "🔥",
  streak_30: "🔥",
  streak_100: "🔥",
  all_seven_today: "🎯",
  // achievement badges (Phase 5.5/6.5) land here too: perfect_nback, sub_300_reaction, etc.
};

export function badgeIcon(key: string): string {
  if (STATIC_ICONS[key]) return STATIC_ICONS[key];
  if (key.startsWith("pb_first_")) {
    const game = key.slice("pb_first_".length) as GameKey;
    if (GAME_KEYS.includes(game)) return PB_ICON[game];
    return "🏆";
  }
  return "•";
}

export function badgeLabel(key: string): string {
  return key.replace(/_/g, " ");
}
