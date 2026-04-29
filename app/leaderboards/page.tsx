import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ptDate, ptDateOffset } from "@/lib/pt-date";
import { GAMES, GAME_KEYS, isGameKey, type GameKey } from "@/lib/games/registry";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Leaderboards - mindlap" };

type Tab = "today" | "7d" | "all";

const TAB_LABEL: Record<Tab, string> = { today: "today", "7d": "7d", all: "all-time" };
const TAB_ORDER: Tab[] = ["today", "7d", "all"];

function isTab(v: unknown): v is Tab {
  return v === "today" || v === "7d" || v === "all";
}

type Row = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_color: string | null;
  score: number;
};

type ProfileEmbed = {
  username?: string | null;
  display_name?: string | null;
  avatar_color?: string | null;
} | null;

function readProfile(r: unknown): ProfileEmbed {
  return ((r as { profiles?: ProfileEmbed }).profiles) ?? null;
}

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; game?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab = isTab(sp.tab) ? sp.tab : "today";
  const game: GameKey = isGameKey(sp.game) ? sp.game : "math";
  const meta = GAMES[game];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = ptDate();
  // 7d window: today - 6 inclusive (7 days total).
  const sevenAgo = ptDateOffset(6);

  let rows: Row[] = [];

  if (tab === "today" || tab === "7d") {
    // Per-window best per user from submissions, ranked by score direction.
    const lower = meta.direction === "lower";
    const fromDate = tab === "today" ? today : sevenAgo;

    const { data } = await supabase
      .from("submissions")
      .select("user_id, score, profiles(username, display_name, avatar_color)")
      .eq("game_key", game)
      .gte("played_pt_date", fromDate)
      .order("score", { ascending: lower })
      .limit(500);

    // Reduce to one row per user (their best within window).
    const bestByUser = new Map<string, Row>();
    for (const r of data ?? []) {
      const score = Number(r.score);
      const uid = r.user_id as string;
      const prof = readProfile(r);
      const next: Row = {
        user_id: uid,
        username: prof?.username ?? null,
        display_name: prof?.display_name ?? null,
        avatar_color: prof?.avatar_color ?? null,
        score,
      };
      const existing = bestByUser.get(uid);
      if (!existing) {
        bestByUser.set(uid, next);
      } else {
        const better = lower ? score < existing.score : score > existing.score;
        if (better) bestByUser.set(uid, next);
      }
    }
    rows = [...bestByUser.values()].sort((a, b) =>
      lower ? a.score - b.score : b.score - a.score
    );
  } else {
    // All-time: best across all submissions, ranked.
    const lower = meta.direction === "lower";
    const { data } = await supabase
      .from("submissions")
      .select("user_id, score, profiles(username, display_name, avatar_color)")
      .eq("game_key", game)
      .order("score", { ascending: lower })
      .limit(2000);

    const bestByUser = new Map<string, Row>();
    for (const r of data ?? []) {
      const score = Number(r.score);
      const uid = r.user_id as string;
      const prof = readProfile(r);
      const next: Row = {
        user_id: uid,
        username: prof?.username ?? null,
        display_name: prof?.display_name ?? null,
        avatar_color: prof?.avatar_color ?? null,
        score,
      };
      const existing = bestByUser.get(uid);
      if (!existing) {
        bestByUser.set(uid, next);
      } else {
        const better = lower ? score < existing.score : score > existing.score;
        if (better) bestByUser.set(uid, next);
      }
    }
    rows = [...bestByUser.values()].sort((a, b) =>
      lower ? a.score - b.score : b.score - a.score
    );
  }

  const top = rows.slice(0, 100);

  return (
    <AppShell>
      <h1>Leaderboards</h1>
      <p className="subtitle">
        {meta.name} - {meta.direction === "higher" ? "higher is better" : "lower is better"}
      </p>

      <nav style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {GAME_KEYS.map((k) => (
          <Link
            key={k}
            href={`/leaderboards?tab=${tab}&game=${k}`}
            style={{
              color: k === game ? "var(--ink)" : "var(--muted)",
              borderBottom: k === game ? "1px solid var(--accent)" : "1px solid transparent",
              paddingBottom: 4,
              fontSize: 13,
            }}
          >
            {GAMES[k].name.toLowerCase()}
          </Link>
        ))}
      </nav>

      <nav style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {TAB_ORDER.map((t) => (
          <Link
            key={t}
            href={`/leaderboards?tab=${t}&game=${game}`}
            style={{
              color: t === tab ? "var(--ink)" : "var(--muted)",
              borderBottom: t === tab ? "1px solid var(--accent)" : "1px solid transparent",
              paddingBottom: 4,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {TAB_LABEL[t]}
          </Link>
        ))}
      </nav>

      {top.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          [no submissions in this window yet. be the first.]
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th>player</th>
              <th style={{ textAlign: "right" }}>score</th>
            </tr>
          </thead>
          <tbody>
            {top.map((r, i) => {
              const me = user?.id === r.user_id;
              const handle = r.username ?? "anon";
              const display = r.display_name ?? handle;
              return (
                <tr
                  key={r.user_id}
                  style={{
                    color: me ? "var(--accent)" : "var(--ink)",
                    fontWeight: me ? 700 : 400,
                  }}
                >
                  <td>{i + 1}</td>
                  <td style={{ maxWidth: 320 }}>
                    {r.username ? (
                      <Link
                        href={`/profile/${r.username}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          color: "inherit",
                          maxWidth: "100%",
                        }}
                      >
                        <Avatar color={r.avatar_color ?? "var(--ink)"} name={display} size={22} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {handle}
                        </span>
                      </Link>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Avatar color="var(--muted)" name="?" size={22} />
                        <span>anon</span>
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>{r.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
