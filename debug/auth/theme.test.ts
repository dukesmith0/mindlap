import { describe, expect, it } from "vitest";
import { isThemePref, resolveTheme } from "@/lib/theme/cookie";

describe("theme", () => {
  it("isThemePref recognizes the three values", () => {
    expect(isThemePref("light")).toBe(true);
    expect(isThemePref("dark")).toBe(true);
    expect(isThemePref("system")).toBe(true);
  });

  it("isThemePref rejects others", () => {
    expect(isThemePref("auto")).toBe(false);
    expect(isThemePref("")).toBe(false);
    expect(isThemePref(undefined)).toBe(false);
    expect(isThemePref(null)).toBe(false);
  });

  it("resolveTheme respects explicit prefs", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("resolveTheme follows system hint when pref is 'system'", () => {
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
  });
});
