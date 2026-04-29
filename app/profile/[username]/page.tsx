import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { StreakRibbon } from "@/components/ui/StreakRibbon";
import { XpBar, levelFromXp } from "@/components/ui/XpBar";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { GAMES, GAME_KEYS, type GameKey } from "@/lib/games/registry";
import { ptDate, ptDateOffset } from "@/lib/pt-date";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_color: string;
  streak_current: number | null;
  streak_longest: number | null;
  level: number | null;
  xp: number | null;
  total_plays: number | null;
  total_submitted: number | null;
  is_public: boolean;
};

type GameStat = {
  key: GameKey;
  pb: number | null;
  pbDate: string | null;
  worst: number | null;
  median7: number | null;
  plays30: number;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `${username} - mindlap` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_color, streak_current, streak_longest, level, xp, total_plays, total_submitted, is_public"
    )
    .eq("username", username)
    .single();

  if (!profile) notFound();
  const p = profile as ProfileRow;

  // Sparse render for private profiles. (Friends would see the full view in Phase 7.)
  if (!p.is_public) {
    return (
      <AppShell>
        <header className="profile-header">
          <Avatar color={p.avatar_color} name={p.display_name ?? p.username} size={48} />
          <div>
            <h1>{p.username}</h1>
            <p className="subtitle">[private profile]</p>
          </div>
        </header>
      </AppShell>
    );
  }

  const direction = (key: GameKey) => GAMES[key].direction;
  const today = ptDate();
  const sevenAgo = ptDateOffset(6);
  const thirtyAgo = ptDateOffset(29);

  const stats: GameStat[] = await Promise.all(
    GAME_KEYS.map(async (key): Promise<GameStat> => {
      const lower = direction(key) === "lower";

      // All-time PB: extreme aggregate.best across all daily_aggregates rows.
      const { data: pbRow } = await supabase
        .from("daily_aggregates")
        .select("best, date")
        .eq("user_id", p.id)
        .eq("game_key", key)
        .order("best", { ascending: lower })
        .limit(1)
        .maybeSingle();

      // Lifetime worst.
      const { data: worstRow } = await supabase
        .from("daily_aggregates")
        .select("worst")
        .eq("user_id", p.id)
        .eq("game_key", key)
        .order("worst", { ascending: !lower })
        .limit(1)
        .maybeSingle();

      // 7-day medians: take the per-day medians and median them client-side
      // (small N, simple math).
      const { data: medianRows } = await supabase
        .from("daily_aggregates")
        .select("median")
        .eq("user_id", p.id)
        .eq("game_key", key)
        .gte("date", sevenAgo)
        .lte("date", today);
      const medians = (medianRows ?? [])
        .map((r) => Number(r.median))
        .filter((n) => Number.isFinite(n));
      let median7: number | null = null;
      if (medians.length > 0) {
        const sorted = medians.slice().sort((a, b) => a - b);
        median7 = sorted[Math.floor(sorted.length / 2)] ?? null;
      }

      // 30-day plays_submitted sum.
      const { data: plays30Rows } = await supabase
        .from("daily_aggregates")
        .select("plays_submitted")
        .eq("user_id", p.id)
        .eq("game_key", key)
        .gte("date", thirtyAgo)
        .lte("date", today);
      const plays30 = (plays30Rows ?? []).reduce(
        (s, r) => s + Number(r.plays_submitted ?? 0),
        0
      );

      return {
        key,
        pb: pbRow ? Number(pbRow.best) : null,
        pbDate: pbRow?.date ?? null,
        worst: worstRow ? Number(worstRow.worst) : null,
        median7,
        plays30,
      };
    })
  );

  // Badge wall (just keys; full badge metadata could embed name/category in
  // a follow-up, but keys read fine on a public profile).
  const { data: badges } = await supabase
    .from("user_badges")
    .select("badge_key, earned_at")
    .eq("user_id", p.id)
    .order("earned_at", { ascending: false })
    .limit(50);

  const allTimePbCount = stats.filter((s) => s.pb !== null).length;
  const xp = Number(p.xp ?? 0);
  const level = p.level ?? levelFromXp(xp);

  return (
    <AppShell>
      <header className="profile-header">
        <Avatar color={p.avatar_color} name={p.display_name ?? p.username} size={48} />
        <div>
          <h1>{p.display_name ?? p.username}</h1>
          <p className="subtitle">@{p.username}</p>
        </div>
        <div className="profile-header-meta">
          <StreakRibbon days={p.streak_current ?? 0} />
          <XpBar xp={xp} level={level} />
        </div>
      </header>

      {p.bio && <p className="profile-bio">{p.bio}</p>}

      <section className="profile-summary">
        <div>
          <span className="profile-stat-label">all-time PBs</span>
          <span className="profile-stat-value">{allTimePbCount} / {GAME_KEYS.length}</span>
        </div>
        <div>
          <span className="profile-stat-label">total plays</span>
          <span className="profile-stat-value">{p.total_submitted ?? 0}</span>
        </div>
        <div>
          <span className="profile-stat-label">longest streak</span>
          <span className="profile-stat-value">{p.streak_longest ?? 0}</span>
        </div>
      </section>

      <h2>per-game</h2>
      <div className="profile-game-grid">
        {stats.map((s) => (
          <div key={s.key} className="profile-game-card">
            <div className="profile-game-title">
              {GAMES[s.key].name}
              {GAMES[s.key].isCore && <span className="game-card-star">*</span>}
            </div>
            <dl className="profile-game-stats">
              <div>
                <dt>PB</dt>
                <dd>{s.pb !== null ? s.pb : <span style={{ color: "var(--muted)" }}>-</span>}</dd>
              </div>
              {s.pbDate && (
                <div>
                  <dt>set</dt>
                  <dd>{s.pbDate}</dd>
                </div>
              )}
              <div>
                <dt>worst</dt>
                <dd>{s.worst !== null ? s.worst : <span style={{ color: "var(--muted)" }}>-</span>}</dd>
              </div>
              <div>
                <dt>7d median</dt>
                <dd>{s.median7 !== null ? s.median7 : <span style={{ color: "var(--muted)" }}>-</span>}</dd>
              </div>
              <div>
                <dt>30d plays</dt>
                <dd>{s.plays30}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <h2>badges</h2>
      {(badges ?? []).length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>[no badges yet]</p>
      ) : (
        <ul className="badge-wall">
          {(badges ?? []).map((b) => (
            <li key={b.badge_key} className="badge">
              <span className="badge-dot" />
              <span>{b.badge_key.replace(/_/g, " ")}</span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
