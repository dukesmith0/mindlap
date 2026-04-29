import Link from "next/link";
import { notFound } from "next/navigation";
import { GameShell } from "@/components/games/GameShell";

const SUPPORTED = new Set(["math", "digit", "nback", "stroop"] as const);
type GameKey = "math" | "digit" | "nback" | "stroop";

const TITLES: Record<GameKey, string> = {
  math: "Speed Math",
  digit: "Digit Span",
  nback: "N-Back",
  stroop: "Stroop",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  if (!SUPPORTED.has(game as GameKey)) return { title: "Play - mindlap" };
  return { title: `${TITLES[game as GameKey]} - mindlap` };
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  if (!SUPPORTED.has(game as GameKey)) notFound();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 64px" }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/today" style={{ color: "var(--muted)", fontSize: 13 }}>
          &lt;- today
        </Link>
      </div>
      <GameShell gameKey={game as GameKey} />
    </main>
  );
}
