import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { THEME_COOKIE, isThemePref, resolveTheme } from "@/lib/theme/cookie";
import "./globals.css";

const courierPrime = localFont({
  src: [
    { path: "./fonts/CourierPrime-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/CourierPrime-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/CourierPrime-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/CourierPrime-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mindlap",
  description: "Track your cognitive performance over time. 7 games, daily play, leaderboards.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themePref = cookieStore.get(THEME_COOKIE)?.value;
  const pref = isThemePref(themePref) ? themePref : "system";
  // No reliable server-side prefers-color-scheme signal; default 'system' to
  // light on first paint. The client can upgrade later if we add a script.
  const dataTheme = resolveTheme(pref, false);

  return (
    <html lang="en" className={courierPrime.variable} data-theme={dataTheme}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
