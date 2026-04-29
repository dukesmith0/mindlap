// Formats a Date as YYYY-MM-DD in America/Los_Angeles. Server-locale
// independent, unlike `toLocaleString -> new Date -> toISOString` chains.
const FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function ptDate(now: Date = new Date()): string {
  return FORMATTER.format(now);
}
