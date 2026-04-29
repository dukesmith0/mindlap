// Compact XP bar for the topbar. Level = floor(sqrt(xp/100)) per decisions.md.
// Width fills proportional to xp inside the current level band.

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

export function xpForLevel(level: number): number {
  // Inverse of `level = floor(sqrt(xp/100)) + 1` → xp at start of level N is 100*(N-1)^2.
  return 100 * Math.pow(Math.max(1, level) - 1, 2);
}

export function XpBar({ xp, level }: { xp: number; level: number }) {
  const lo = xpForLevel(level);
  const hi = xpForLevel(level + 1);
  const span = Math.max(1, hi - lo);
  const into = Math.min(span, Math.max(0, xp - lo));
  const pct = (into / span) * 100;
  const remaining = Math.max(0, hi - xp);

  return (
    <div
      className="xp-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={span}
      aria-valuenow={into}
      title={`Lv ${level}: ${into} / ${span} xp - ${remaining} to next`}
    >
      <span className="xp-bar-label">Lv {level}</span>
      <span className="xp-bar-track">
        <span className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="xp-bar-num">{into}/{span}</span>
    </div>
  );
}
