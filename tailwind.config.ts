import type { Config } from "tailwindcss";

// Zetamac Pure Tailwind config.
// Most defaults are stripped: shadows, border-radius, blurs, rings, custom font families.
// Only utilities we actually use (spacing, layout, colors-via-vars) remain.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // Empty theme overrides remove the default token sets; extend below adds only what we need.
    boxShadow: { none: "none" },
    borderRadius: { none: "0" },
    fontFamily: {
      mono: ["var(--font-mono)", "ui-monospace", "Courier New", "Courier", "monospace"],
    },
    blur: {},
    ringWidth: { 0: "0" },
    extend: {
      colors: {
        bg: "var(--bg)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
      },
    },
  },
  plugins: [],
};

export default config;
