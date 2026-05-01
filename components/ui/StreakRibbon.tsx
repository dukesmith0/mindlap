// Streak ribbon: the only animated element in the app. Pulses opacity
// 1 -> 0.55 -> 1 every 2s. Tier color comes from `lib/tier-colors.ts`.

import { streakColor } from "@/lib/tier-colors";

export function StreakRibbon({ days }: { days: number }) {
  if (days <= 0) {
    return (
      <span style={{ color: "var(--muted)", fontSize: 13 }} title="no streak yet">
        no streak
      </span>
    );
  }
  const color = streakColor(days);
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
