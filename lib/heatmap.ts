// Profile heatmap helpers: bucket play counts into a 4-step intensity scale
// (0 = empty, 1 = light, 2 = mid, 3 = full accent) and build the 91-day
// (oldest -> newest) cell list. Pure functions so the UI can stay simple.

export type HeatBucket = 0 | 1 | 2 | 3;

export function heatBucket(count: number): HeatBucket {
  if (!Number.isFinite(count) || count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  return 3;
}

export type HeatCell = { date: string; count: number; bucket: HeatBucket };

// Builds a flat array of 91 cells, oldest first. `dateAt(daysAgo)` resolves
// the PT-date string for `daysAgo` days before "today" (caller passes
// ptDateOffset so this stays timezone-aware).
export function buildHeatmap(
  dateAt: (daysAgo: number) => string,
  countByDate: Map<string, number>,
  windowDays = 90,
): HeatCell[] {
  const out: HeatCell[] = [];
  for (let i = windowDays; i >= 0; i--) {
    const date = dateAt(i);
    const count = countByDate.get(date) ?? 0;
    out.push({ date, count, bucket: heatBucket(count) });
  }
  return out;
}
