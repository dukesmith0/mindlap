// Theme persistence: profiles.theme_pref is the source of truth for authed
// users; for anonymous visitors and pre-hydration paint, a `mlap-theme` cookie
// holds 'light' | 'dark' | 'system'. The root layout reads it on the server so
// SSR ships the right `data-theme` attribute and there is no flash.

export type ThemePref = "light" | "dark" | "system";

export const THEME_COOKIE = "mlap-theme";

export function isThemePref(value: string | undefined | null): value is ThemePref {
  return value === "light" || value === "dark" || value === "system";
}

// Resolve the effective `data-theme` attribute given the user pref and a
// hint about the system preference. Server-rendered version; the client may
// later upgrade based on `prefers-color-scheme`.
export function resolveTheme(pref: ThemePref, systemPrefersDark = false): "light" | "dark" {
  if (pref === "system") return systemPrefersDark ? "dark" : "light";
  return pref;
}
