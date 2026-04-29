import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ptDate } from "@/lib/pt-date";
import { GAMES, GAME_KEYS, type GameKey } from "@/lib/games/registry";
import { getBonusGames } from "@/lib/daily-bonus";
import { TodayList, type TodayCardData } from "./TodayList";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "Today - mindlap" };

type TopRow = { username: string | null; score: number; user_id: string; rank: number };

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const todayBests = new Map<GameKey, number>();
  const pinned = new Set<GameKey>();
  const ptToday = ptDate();
  const [bonusA, bonusB] = getBonusGames(ptToday);
  const bonusSet = new Set<GameKey>([bonusA, bonusB]);

  let isAuthed = false;
  let friendIds: string[] = [];
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

    // Phase 7: friends-only mini-leaderboard scope. Allow list = me + accepted friends.
    const { data: friendRows } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const ids = new Set<string>([user.id]);
    for (const r of friendRows ?? []) {
      ids.add(r.requester_id === user.id ? r.addressee_id : r.requester_id);
    }
    friendIds = [...ids];
  }

  // Friends-only top-5 + overflow-self row per game (#41). For unauthed users
  // we skip the previews entirely (no comparison group).
  const previews = new Map<GameKey, { top: TopRow[]; selfOverflow: TopRow | null }>();
  if (isAuthed && user && friendIds.length > 0) {
    for (const key of GAME_KEYS) {
      const direction = GAMES[key].direction;
      const lower = direction === "lower";
      const { data } = await supabase
        .from("submissions")
        .select("user_id, score, profiles(username)")
        .eq("game_key", key)
        .eq("played_pt_date", ptToday)
        .in("user_id", friendIds)
        .order("score", { ascending: lower })
        .limit(200);

      const bestByUser = new Map<string, TopRow>();
      for (const row of data ?? []) {
        const uid = row.user_id as string;
        const score = Number(row.score);
        const uname =
          ((row as unknown as { profiles?: { username?: string | null } | null }).profiles
            ?.username) ?? null;
        const existing = bestByUser.get(uid);
        const better = !existing || (lower ? score < existing.score : score > existing.score);
        if (better) bestByUser.set(uid, { user_id: uid, score, username: uname, rank: 0 });
      }
      const sorted = [...bestByUser.values()].sort((a, b) =>
        lower ? a.score - b.score : b.score - a.score,
      );
      sorted.forEach((r, i) => { r.rank = i + 1; });

      const top = sorted.slice(0, 5);
      let selfOverflow: TopRow | null = null;
      if (top.length > 0) {
        const inTop = top.some((r) => r.user_id === user.id);
        if (!inTop) {
          const meRow = sorted.find((r) => r.user_id === user.id);
          if (meRow) selfOverflow = meRow;
        }
      }
      if (top.length > 0) previews.set(key, { top, selfOverflow });
    }
  }

  // Sort: pinned > 2x > core (★) > rest, all stable by GAME_KEYS sort_order.
  const ordered = [...GAME_KEYS].sort((a, b) => rank(a) - rank(b));
  function rank(k: GameKey): number {
    if (pinned.has(k)) return 0;
    if (bonusSet.has(k)) return 1;
    if (GAMES[k].isCore) return 2;
    return 3;
  }

  const cards: TodayCardData[] = ordered.map((key) => {
    const p = previews.get(key);
    return {
      key,
      name: GAMES[key].name,
      tagline: GAMES[key].tagline,
      isCore: GAMES[key].isCore,
      isPinned: pinned.has(key),
      isBonus: bonusSet.has(key),
      best: todayBests.get(key),
      preview: p?.top ?? [],
      selfOverflow: p?.selfOverflow ?? null,
    };
  });

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
