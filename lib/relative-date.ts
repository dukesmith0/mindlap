// "47 days ago" / "today" / "yesterday" / "in 3 days". UTC-tolerant: callers
// pass either a Date or an ISO/timestamp string. Returns a stable string with
// no localization (mindlap is en-only at v1).

const DAY_MS = 24 * 60 * 60 * 1000;

export function relativeDate(input: string | Date, now: Date = new Date()): string {
  const then = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(then.getTime())) return "unknown";
  const diffMs = stripTime(now).getTime() - stripTime(then).getTime();
  const days = Math.round(diffMs / DAY_MS);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  if (days > 1) return `${days} days ago`;
  return `in ${-days} days`;
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
