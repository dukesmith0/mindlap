import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ptDate } from "@/lib/pt-date";
import { GAMES, GAME_KEYS, type GameKey } from "@/lib/games/registry";
import { getBonusGames } from "@/lib/daily-bonus";
import { TodayList, type TodayCardData } from "./TodayList";
import { TodayMilestoneBanner } from "@/components/today/TodayMilestoneBanner";
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
  let streakCurrent = 0;
  let pbSetToday = false;
  let gamesPlayedToday = 0;
  if (user) {
    isAuthed = true;
    // Five independent reads — fire in parallel to drop ~5 sequential RTTs to 1.
    // PB-today detection: query xp_events from the last 24 hours UTC (a strict
    // superset of "today PT" regardless of DST), then filter client-side using
    // the same `at time zone` math the DB applies. Avoids hardcoding `-08:00`
    // (PST) when PDT (`-07:00`) is in effect for ~8 months a year.
    // Server component executes per request; "now" is an intentional input.
    // eslint-disable-next-line react-hooks/purity
    const last24hUtc = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [aggsRes, pinsRes, friendRowsRes, profRes, todayPbRes] = await Promise.all([
      supabase.from("daily_aggregates").select("game_key, best").eq("user_id", user.id).eq("date", ptToday),
      supabase.from("user_game_pins").select("game_key").eq("user_id", user.id),
      supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
      supabase.from("profiles").select("streak_current").eq("id", user.id).single(),
      supabase
        .from("xp_events")
        .select("occurred_at")
        .eq("user_id", user.id)
        .eq("source", "daily_pb")
        .gte("occurred_at", last24hUtc)
        .limit(20),
    ]);

    for (const row of aggsRes.data ?? []) {
      if (row.best !== null) todayBests.set(row.game_key as GameKey, Number(row.best));
    }
    for (const p of pinsRes.data ?? []) pinned.add(p.game_key as GameKey);
    const ids = new Set<string>([user.id]);
    for (const r of friendRowsRes.data ?? []) {
      ids.add(r.requester_id === user.id ? r.addressee_id : r.requester_id);
    }
    friendIds = [...ids];
    streakCurrent = Number(profRes.data?.streak_current ?? 0);
    // Filter the last-24h xp_events down to the ones that landed on today's PT date.
    pbSetToday = (todayPbRes.data ?? []).some((row) => {
      const occurred = new Date(row.occurred_at as string);
      const occurredPt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(occurred);
      return occurredPt === ptToday;
    });
    gamesPlayedToday = todayBests.size;
  }

  // Friends-only top-5 + overflow-self row per game (#41). Reads from
  // daily_aggregates (one row per (user, game, day) — `best` is already each
  // friend's best score today) so the worst-case row count is 7 × N_friends.
  // Avoids the 2000-row truncation risk of querying raw submissions.
  const previews = new Map<GameKey, { top: TopRow[]; selfOverflow: TopRow | null }>();
  if (isAuthed && user && friendIds.length > 0) {
    const { data } = await supabase
      .from("daily_aggregates")
      .select("user_id, game_key, best, profiles(username)")
      .in("game_key", GAME_KEYS as readonly string[])
      .eq("date", ptToday)
      .in("user_id", friendIds);

    type Row = { user_id: string; score: number; username: string | null };
    const byGame = new Map<GameKey, Row[]>();
    for (const row of data ?? []) {
      if (row.best === null || row.best === undefined) continue;
      const key = row.game_key as GameKey;
      const uname =
        ((row as unknown as { profiles?: { username?: string | null } | null }).profiles
          ?.username) ?? null;
      const entry: Row = {
        user_id: row.user_id as string,
        score: Number(row.best),
        username: uname,
      };
      const bucket = byGame.get(key);
      if (bucket) bucket.push(entry);
      else byGame.set(key, [entry]);
    }

    for (const [key, rows] of byGame) {
      const lower = GAMES[key].direction === "lower";
      const sorted: TopRow[] = rows
        .sort((a, b) => (lower ? a.score - b.score : b.score - a.score))
        .map((r, i) => ({ ...r, rank: i + 1 }));
      const top = sorted.slice(0, 5);
      if (top.length === 0) continue;
      const inTop = top.some((r) => r.user_id === user.id);
      const selfOverflow = inTop ? null : (sorted.find((r) => r.user_id === user.id) ?? null);
      previews.set(key, { top, selfOverflow });
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
      {isAuthed && (
        <TodayMilestoneBanner
          streakCurrent={streakCurrent}
          gamesPlayedToday={gamesPlayedToday}
          pbSetToday={pbSetToday}
          totalGames={GAME_KEYS.length}
        />
      )}
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
