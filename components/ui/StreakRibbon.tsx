// Streak ribbon: the only animated element in the app. Pulses opacity 1 -> 0.55 -> 1 every 2s.
// Tier-coloured with the fire emoji once the user has any streak.

const TIERS: { min: number; color: string }[] = [
  { min: 100, color: "#a855f7" }, // 100+ epic
  { min: 30, color: "#dc2626" },  // 30+ red
  { min: 7, color: "#f97316" },   // 7+ orange
  { min: 3, color: "#f59e0b" },   // 3+ amber
  { min: 1, color: "var(--ink)" }, // 1-2 muted-strong
];

function tierColor(days: number): string {
  for (const t of TIERS) if (days >= t.min) return t.color;
  return "var(--muted)";
}

export function StreakRibbon({ days }: { days: number }) {
  if (days <= 0) {
    return (
      <span style={{ color: "var(--muted)", fontSize: 13 }} title="no streak yet">
        no streak
      </span>
    );
  }
  const color = tierColor(days);
  return (
    <span
      className="streak-ribbon"
      style={{
        color,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
      aria-label={`${days} day streak`}
    >
      {/* Pulse only on the emoji (#36); number + units stay steady. */}
      <span
        aria-hidden
        style={{
          fontSize: 16,
          lineHeight: 1,
          animation: "streak-pulse 2s ease-in-out infinite",
        }}
      >
        🔥
      </span>
      <span>{days}</span>
      <span style={{ color: "var(--muted)", fontSize: 12 }}>day{days === 1 ? "" : "s"}</span>
    </span>
  );
}
