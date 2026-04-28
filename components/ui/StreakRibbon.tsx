// Streak ribbon: the only animated element in the app. Pulses opacity 1 -> 0.55 -> 1 every 2s.
// Renders as plain text (no icon, no emoji) per Zetamac Pure rules.

export function StreakRibbon({ days }: { days: number }) {
  if (days <= 0) return null;
  return (
    <span
      style={{
        color: "var(--accent)",
        animation: "streak-pulse 2s ease-in-out infinite",
      }}
    >
      {days} day streak
    </span>
  );
}
