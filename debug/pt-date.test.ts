import { describe, expect, it } from "vitest";
import { ptDate, ptDateOffset } from "@/lib/pt-date";

describe("ptDate", () => {
  it("returns YYYY-MM-DD format", () => {
    expect(ptDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("respects America/Los_Angeles regardless of UTC offset", () => {
    // 2026-01-01T07:30:00Z = 2025-12-31 23:30 PT.
    const utcMorning = new Date("2026-01-01T07:30:00Z");
    expect(ptDate(utcMorning)).toBe("2025-12-31");
  });

  it("handles DST forward correctly", () => {
    // DST started 2026-03-08 in US. 09:30 UTC = 02:30 PDT (after spring-forward) -> still 03-08.
    const dstMorning = new Date("2026-03-08T11:00:00Z");
    expect(ptDate(dstMorning)).toBe("2026-03-08");
  });
});

describe("ptDateOffset", () => {
  it("daysAgo=0 equals today", () => {
    const now = new Date("2026-04-28T20:00:00Z");
    expect(ptDateOffset(0, now)).toBe(ptDate(now));
  });

  it("daysAgo=6 returns 6 PT days earlier", () => {
    const now = new Date("2026-04-28T20:00:00Z");
    expect(ptDateOffset(6, now)).toBe("2026-04-22");
  });

  it("crosses month boundary correctly", () => {
    const now = new Date("2026-05-02T20:00:00Z");
    expect(ptDateOffset(5, now)).toBe("2026-04-27");
  });

  it("crosses year boundary correctly", () => {
    const now = new Date("2026-01-03T20:00:00Z");
    expect(ptDateOffset(5, now)).toBe("2025-12-29");
  });
});
