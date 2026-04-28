import type { Metadata } from "next";
import localFont from "next/font/local";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={courierPrime.variable}>
      <body>{children}</body>
    </html>
  );
}
