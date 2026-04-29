// Countdown component is a "use client" React tree, so we can't easily mount
// it from a Node-only vitest run without jsdom. Instead, this test pins the
// timing contract: 4 equal steps of 600ms, total 2400ms before onDone fires.
// The constants must match `components/games/Countdown.tsx`. If the file
// changes, this test will break loudly so the contract is reviewed.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Countdown timing contract (#35)", () => {
  const file = readFileSync(
    resolve(process.cwd(), "components/games/Countdown.tsx"),
    "utf8",
  );

  it("uses a single STEP_MS constant for all four phases", () => {
    expect(file).toMatch(/const STEP_MS = \d+;/);
  });

  it("schedules three `setStep` transitions at STEP_MS multiples", () => {
    expect(file).toMatch(/setTimeout\(\(\) => setStep\(2\), STEP_MS\);/);
    expect(file).toMatch(/setTimeout\(\(\) => setStep\(1\), STEP_MS \* 2\);/);
    expect(file).toMatch(/setTimeout\(\(\) => setStep\(0\), STEP_MS \* 3\);/);
  });

  it("fires onDone at STEP_MS * 4 so 'go' has the same on-screen time as 3/2/1", () => {
    expect(file).toMatch(/setTimeout\(onDone, STEP_MS \* 4\);/);
  });

  it("STEP_MS is 600 (snappy enough not to feel sluggish)", () => {
    const m = file.match(/const STEP_MS = (\d+);/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBe(600);
  });
});
