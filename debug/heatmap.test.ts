import { describe, expect, it } from "vitest";
import { buildHeatmap, heatBucket } from "@/lib/heatmap";

describe("heatBucket", () => {
  it("buckets 0 plays as empty", () => {
    expect(heatBucket(0)).toBe(0);
  });

  it("buckets 1-2 plays as light (1)", () => {
    expect(heatBucket(1)).toBe(1);
    expect(heatBucket(2)).toBe(1);
  });

  it("buckets 3-5 plays as mid (2)", () => {
    expect(heatBucket(3)).toBe(2);
    expect(heatBucket(4)).toBe(2);
    expect(heatBucket(5)).toBe(2);
  });

  it("buckets 6+ plays as full (3)", () => {
    expect(heatBucket(6)).toBe(3);
    expect(heatBucket(20)).toBe(3);
    expect(heatBucket(1000)).toBe(3);
  });

  it("clamps non-finite or negative counts to empty (defensive on bad input)", () => {
    expect(heatBucket(-1)).toBe(0);
    expect(heatBucket(-100)).toBe(0);
    expect(heatBucket(NaN)).toBe(0);
    expect(heatBucket(Infinity)).toBe(0);
  });

  it("treats fractional counts conservatively", () => {
    expect(heatBucket(0.5)).toBe(1);
    expect(heatBucket(2.5)).toBe(2);
    expect(heatBucket(5.5)).toBe(3);
  });
});

describe("buildHeatmap", () => {
  // synthetic dateAt: returns "D{daysAgo}".
  const dateAt = (n: number) => `D${n}`;

  it("emits 91 cells (90-day window inclusive)", () => {
    const cells = buildHeatmap(dateAt, new Map());
    expect(cells.length).toBe(91);
  });

  it("orders oldest-first", () => {
    const cells = buildHeatmap(dateAt, new Map());
    expect(cells[0].date).toBe("D90");
    expect(cells[90].date).toBe("D0");
  });

  it("populates counts and buckets from the map", () => {
    const counts = new Map<string, number>([
      ["D90", 0],
      ["D45", 4],
      ["D0", 12],
    ]);
    const cells = buildHeatmap(dateAt, counts);
    expect(cells[0].count).toBe(0);
    expect(cells[0].bucket).toBe(0);
    const mid = cells.find((c) => c.date === "D45")!;
    expect(mid.count).toBe(4);
    expect(mid.bucket).toBe(2);
    const today = cells[cells.length - 1];
    expect(today.count).toBe(12);
    expect(today.bucket).toBe(3);
  });

  it("treats missing dates as 0 plays", () => {
    const cells = buildHeatmap(dateAt, new Map());
    for (const c of cells) {
      expect(c.count).toBe(0);
      expect(c.bucket).toBe(0);
    }
  });

  it("respects custom window sizes", () => {
    const cells = buildHeatmap(dateAt, new Map(), 6);
    expect(cells.length).toBe(7);
    expect(cells[0].date).toBe("D6");
    expect(cells[6].date).toBe("D0");
  });
});
