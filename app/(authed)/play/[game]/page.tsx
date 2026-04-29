import Link from "next/link";
import { notFound } from "next/navigation";
import { GameShell } from "@/components/games/GameShell";
import { GAMES, isGameKey } from "@/lib/games/registry";
import { AppShell } from "@/components/layout/AppShell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  if (!isGameKey(game)) return { title: "Play - mindlap" };
  return { title: `${GAMES[game].name} - mindlap` };
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  if (!isGameKey(game)) notFound();

  return (
    <AppShell>
      <div style={{ marginBottom: 24 }}>
        <Link href="/today" className="nav-back">&lt;- today</Link>
      </div>
      <GameShell gameKey={game} />
    </AppShell>
  );
}
