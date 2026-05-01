import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ptDate, ptDateOffset } from "@/lib/pt-date";
import { GAMES, GAME_KEYS, isGameKey, type GameKey } from "@/lib/games/registry";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Leaderboards - mindlap" };

type Tab = "today" | "7d" | "all";
type Scope = "all" | "friends";

const TAB_LABEL: Record<Tab, string> = { today: "today", "7d": "7d", all: "all-time" };
const TAB_ORDER: Tab[] = ["today", "7d", "all"];
const SCOPE_LABEL: Record<Scope, string> = { all: "global", friends: "friends" };
const SCOPE_ORDER: Scope[] = ["all", "friends"];

function isTab(v: unknown): v is Tab {
  return v === "today" || v === "7d" || v === "all";
}
function isScope(v: unknown): v is Scope {
  return v === "all" || v === "friends";
}

type Row = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_color: string | null;
  avatar_emoji: string | null;
  score: number;
};

type ProfileEmbed = {
  username?: string | null;
  display_name?: string | null;
  avatar_color?: string | null;
  avatar_emoji?: string | null;
} | null;

function readProfile(r: unknown): ProfileEmbed {
  return ((r as { profiles?: ProfileEmbed }).profiles) ?? null;
}

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; game?: string; scope?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab = isTab(sp.tab) ? sp.tab : "today";
  const game: GameKey = isGameKey(sp.game) ? sp.game : "math";
  const scope: Scope = isScope(sp.scope) ? sp.scope : "all";
  const meta = GAMES[game];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Friends scope = me + accepted friends. Anon users hitting scope=friends
  // get an empty allow list so the table renders the empty-state CTA.
  let friendsAllowList: string[] | null = null;
  if (scope === "friends") {
    if (!user) {
      friendsAllowList = [];
    } else {
      const { data: friendRows } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const ids = new Set<string>([user.id]);
      for (const r of friendRows ?? []) {
        ids.add(r.requester_id === user.id ? r.addressee_id : r.requester_id);
      }
      friendsAllowList = [...ids];
    }
  }

  const today = ptDate();
  // 7d window: today - 6 inclusive (7 days total).
  const sevenAgo = ptDateOffset(6);

  let rows: Row[] = [];

  if (friendsAllowList && friendsAllowList.length === 0) {
    rows = [];
  } else if (tab === "today" || tab === "7d") {
    // Per-window best per user from submissions, ranked by score direction.
    const lower = meta.direction === "lower";
    const fromDate = tab === "today" ? today : sevenAgo;

    let query = supabase
      .from("submissions")
      .select("user_id, score, profiles(username, display_name, avatar_color, avatar_emoji)")
      .eq("game_key", game)
      .gte("played_pt_date", fromDate);
    if (friendsAllowList) query = query.in("user_id", friendsAllowList);
    const { data } = await query
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
        avatar_emoji: prof?.avatar_emoji ?? null,
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
    let query = supabase
      .from("submissions")
      .select("user_id, score, profiles(username, display_name, avatar_color, avatar_emoji)")
      .eq("game_key", game);
    if (friendsAllowList) query = query.in("user_id", friendsAllowList);
    const { data } = await query
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
        avatar_emoji: prof?.avatar_emoji ?? null,
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

      <nav className="lb-nav lb-nav-games">
        {GAME_KEYS.map((k) => (
          <Link
            key={k}
            href={`/leaderboards?tab=${tab}&game=${k}&scope=${scope}`}
            className={`lb-tab${k === game ? " is-active" : ""}`}
          >
            {GAMES[k].name.toLowerCase()}
          </Link>
        ))}
      </nav>

      <nav className="lb-nav lb-nav-time">
        {TAB_ORDER.map((t) => (
          <Link
            key={t}
            href={`/leaderboards?tab=${t}&game=${game}&scope=${scope}`}
            className={`lb-tab is-uppercase${t === tab ? " is-active" : ""}`}
          >
            {TAB_LABEL[t]}
          </Link>
        ))}
      </nav>

      <nav className="lb-nav lb-nav-scope">
        {SCOPE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/leaderboards?tab=${tab}&game=${game}&scope=${s}`}
            className={`lb-scope${s === scope ? " is-active" : ""}`}
          >
            [{SCOPE_LABEL[s]}]
          </Link>
        ))}
      </nav>

      {top.length === 0 ? (
        scope === "friends" ? (
          <EmptyState
            message={
              !user
                ? "Sign in and add friends to see this view."
                : friendsAllowList && friendsAllowList.length === 1
                  ? "Add friends to compare scores."
                  : "No friend submissions in this window yet."
            }
            cta={
              !user
                ? { href: "/login", label: "sign in" }
                : { href: "/friends", label: "add friends" }
            }
          />
        ) : (
          <EmptyState message="No submissions in this window yet. Be the first." />
        )
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
                        <Avatar
                          color={r.avatar_color ?? "var(--ink)"}
                          name={display}
                          emoji={r.avatar_emoji}
                          size={22}
                        />
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
      <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 24 }}>
        scores are user-reported; replay-token verification ships post-launch.
      </p>
    </AppShell>
  );
}
