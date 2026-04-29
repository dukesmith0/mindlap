import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ptDate } from "@/lib/pt-date";
import { GAMES, GAME_KEYS, type GameKey } from "@/lib/games/registry";
import { getBonusGames } from "@/lib/daily-bonus";
import { TodayList, type TodayCardData } from "./TodayList";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "Today - mindlap" };

type TopRow = { username: string | null; score: number; user_id: string };

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const todayBests = new Map<GameKey, number>();
  const pinned = new Set<GameKey>();
  const ptToday = ptDate();
  const [bonusA, bonusB] = getBonusGames(ptToday);
  const bonusSet = new Set<GameKey>([bonusA, bonusB]);

  let isAuthed = false;
  if (user) {
    isAuthed = true;
    const { data: aggs } = await supabase
      .from("daily_aggregates")
      .select("game_key, best")
      .eq("user_id", user.id)
      .eq("date", ptToday);
    if (aggs) {
      for (const row of aggs) if (row.best !== null) todayBests.set(row.game_key as GameKey, Number(row.best));
    }

    const { data: pins } = await supabase
      .from("user_game_pins")
      .select("game_key")
      .eq("user_id", user.id);
    if (pins) for (const p of pins) pinned.add(p.game_key as GameKey);
  }

  // Top-3 leaderboard preview per game (today's slice).
  const previews = new Map<GameKey, TopRow[]>();
  for (const key of GAME_KEYS) {
    const direction = GAMES[key].direction;
    const { data } = await supabase
      .from("submissions")
      .select("user_id, score, profiles(username)")
      .eq("game_key", key)
      .eq("played_pt_date", ptToday)
      .order("score", { ascending: direction === "lower" })
      .limit(3);
    const rows: TopRow[] = (data ?? []).map((row) => ({
      user_id: row.user_id as string,
      score: Number(row.score),
      username: ((row as unknown as { profiles?: { username?: string | null } | null }).profiles?.username) ?? null,
    }));
    if (rows.length) previews.set(key, rows);
  }

  // Sort: pinned > 2x > core (★) > rest, all stable by GAME_KEYS sort_order.
  const ordered = [...GAME_KEYS].sort((a, b) => rank(a) - rank(b));
  function rank(k: GameKey): number {
    if (pinned.has(k)) return 0;
    if (bonusSet.has(k)) return 1;
    if (GAMES[k].isCore) return 2;
    return 3;
  }

  const cards: TodayCardData[] = ordered.map((key) => ({
    key,
    name: GAMES[key].name,
    tagline: GAMES[key].tagline,
    isCore: GAMES[key].isCore,
    isPinned: pinned.has(key),
    isBonus: bonusSet.has(key),
    best: todayBests.get(key),
    preview: previews.get(key) ?? [],
  }));

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell>
      <TodayList
        dateLabel={dateLabel}
        cards={cards}
        authed={isAuthed}
        meId={user?.id ?? null}
      />
      <p style={{ marginTop: 32, fontSize: 13 }}>
        <Link href="/leaderboards" className="nav-back">browse all leaderboards -&gt;</Link>
      </p>
    </AppShell>
  );
}
