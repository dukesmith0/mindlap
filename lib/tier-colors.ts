// Single source of truth for streak / level / leaderboard tier colors.
// Anywhere we render a streak number or rank chip should read from here.
// CSS tokens (var(--ink), var(--muted)) used where applicable so dark mode
// flips automatically.

export type Tier = {
  min: number;
  color: string; // CSS color value
  label: string;
};

// Streak ribbon (used by StreakRibbon, future cross-game streak board).
export const STREAK_TIERS: readonly Tier[] = [
  { min: 100, color: "#a855f7", label: "epic" },
  { min: 30, color: "#dc2626", label: "red-hot" },
  { min: 7, color: "#f97316", label: "hot" },
  { min: 3, color: "#f59e0b", label: "warm" },
  { min: 1, color: "var(--ink)", label: "starting" },
];

export function streakColor(days: number): string {
  if (days <= 0) return "var(--muted)";
  for (const t of STREAK_TIERS) if (days >= t.min) return t.color;
  return "var(--muted)";
}

// Leaderboard rank tiers — used by Phase 5.5 / 13 prestige medal chips.
export const RANK_TIERS: readonly Tier[] = [
  { min: 1, color: "#fcd34d", label: "gold" },
  { min: 4, color: "#cbd5e1", label: "silver" },
  { min: 11, color: "#d97706", label: "bronze" },
  { min: 101, color: "var(--muted)", label: "ranked" },
];

export function rankColor(rank: number): string {
  if (rank <= 0) return "var(--muted)";
  // Tiers are listed bottom-up; pick the lowest tier whose min <= rank.
  let chosen = "var(--muted)";
  for (const t of RANK_TIERS) {
    if (rank >= t.min) chosen = t.color;
  }
  return chosen;
}
