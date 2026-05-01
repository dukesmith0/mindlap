import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarEditTrigger } from "@/components/ui/AvatarEditTrigger";
import { StreakRibbon } from "@/components/ui/StreakRibbon";
import { Tooltip } from "@/components/ui/Tooltip";
import { XpBar, levelFromXp } from "@/components/ui/XpBar";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { GAMES, GAME_KEYS, type GameKey } from "@/lib/games/registry";
import { ptDate, ptDateOffset } from "@/lib/pt-date";
import { badgeCriteria, badgeIcon, badgeLabel } from "@/lib/badges/icons";
import { buildHeatmap } from "@/lib/heatmap";
import {
  ProfileSocialButtons,
  type RelationshipState,
} from "@/components/friends/ProfileSocialButtons";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_color: string;
  avatar_emoji: string | null;
  streak_current: number | null;
  streak_longest: number | null;
  level: number | null;
  xp: number | null;
  total_plays: number | null;
  total_submitted: number | null;
  is_public: boolean;
  accepts_friend_requests: boolean | null;
};

type GameStat = {
  key: GameKey;
  pb: number | null;
  pbDate: string | null;
  lowWeek: number | null;
  median7: number | null;
  median7N: number;
  plays30: number;
  totalPlays: number;
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
      "id, username, display_name, bio, avatar_color, avatar_emoji, streak_current, streak_longest, level, xp, total_plays, total_submitted, is_public, accepts_friend_requests"
    )
    .eq("username", username)
    .single();

  if (!profile) notFound();
  const p = profile as ProfileRow;

  // Resolve viewer + relationship for the social buttons (#47).
  const { data: { user: viewer } } = await supabase.auth.getUser();
  let rel: RelationshipState = { kind: "anon" };
  if (viewer) {
    if (viewer.id === p.id) {
      rel = { kind: "self" };
    } else {
      const { data: fRow } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id, status")
        .or(
          `and(requester_id.eq.${viewer.id},addressee_id.eq.${p.id}),and(requester_id.eq.${p.id},addressee_id.eq.${viewer.id})`,
        )
        .maybeSingle();
      if (!fRow) {
        rel = { kind: "none" };
      } else if (fRow.status === "blocked") {
        rel = { kind: "blocked" };
      } else if (fRow.status === "accepted") {
        rel = { kind: "accepted" };
      } else if (fRow.requester_id === viewer.id) {
        rel = { kind: "outgoing_pending" };
      } else {
        rel = { kind: "incoming_pending" };
      }
    }
  }

  // Sparse render for private profiles. (Friends would see the full view in Phase 7.)
  if (!p.is_public) {
    return (
      <AppShell>
        <header className="profile-header">
          <Avatar
            color={p.avatar_color}
            name={p.display_name ?? p.username}
            emoji={p.avatar_emoji}
            size={48}
          />
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

      // 7-day low (#53): the rolling-week extreme on the wrong side of
      // direction. For higher=better this is min(best); for lower=better this
      // is max(best). Bounded to last 7 days so it doesn't show a forgettable
      // bad day from months ago.
      const { data: lowWeekRow } = await supabase
        .from("daily_aggregates")
        .select("best")
        .eq("user_id", p.id)
        .eq("game_key", key)
        .gte("date", sevenAgo)
        .lte("date", today)
        .order("best", { ascending: !lower })
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

      // Lifetime plays_submitted sum (#38).
      const { data: totalPlaysRows } = await supabase
        .from("daily_aggregates")
        .select("plays_submitted")
        .eq("user_id", p.id)
        .eq("game_key", key);
      const totalPlays = (totalPlaysRows ?? []).reduce(
        (s, r) => s + Number(r.plays_submitted ?? 0),
        0
      );

      return {
        key,
        pb: pbRow ? Number(pbRow.best) : null,
        pbDate: pbRow?.date ?? null,
        lowWeek: lowWeekRow ? Number(lowWeekRow.best) : null,
        median7,
        median7N: medians.length,
        plays30,
        totalPlays,
      };
    })
  );

  // 90-day heatmap data (#42): one read against daily_aggregates aggregated by
  // date across every game. Cell intensity is bucketed by play count.
  const ninetyAgo = ptDateOffset(90);
  const { data: heatmapRows } = await supabase
    .from("daily_aggregates")
    .select("date, plays_submitted")
    .eq("user_id", p.id)
    .gte("date", ninetyAgo)
    .lte("date", today);
  const heatmapByDate = new Map<string, number>();
  for (const row of heatmapRows ?? []) {
    const date = String(row.date);
    heatmapByDate.set(date, (heatmapByDate.get(date) ?? 0) + Number(row.plays_submitted ?? 0));
  }
  const heatCells = buildHeatmap((daysAgo) => ptDateOffset(daysAgo), heatmapByDate);

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
        {rel.kind === "self" ? (
          <AvatarEditTrigger
            color={p.avatar_color}
            emoji={p.avatar_emoji}
            displayName={p.display_name ?? p.username}
            size={48}
            ariaLabel="edit avatar"
          />
        ) : (
          <Avatar
            color={p.avatar_color}
            name={p.display_name ?? p.username}
            emoji={p.avatar_emoji}
            size={48}
          />
        )}
        <div>
          <h1>{p.display_name ?? p.username}</h1>
          <p className="subtitle">@{p.username}</p>
        </div>
        <div className="profile-header-meta">
          <StreakRibbon days={p.streak_current ?? 0} />
          <XpBar xp={xp} level={level} />
        </div>
      </header>

      {rel.kind !== "self" && rel.kind !== "anon" && (
        <div className="profile-social">
          <ProfileSocialButtons
            targetUserId={p.id}
            targetUsername={p.username}
            acceptsRequests={p.accepts_friend_requests !== false}
            rel={rel}
          />
        </div>
      )}

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

      <h2>badges</h2>
      {(badges ?? []).length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>[no badges yet]</p>
      ) : (
        <ul className="badge-wall">
          {(badges ?? []).map((b) => (
            <li
              key={b.badge_key}
              className="badge"
              data-tip={badgeCriteria(b.badge_key)}
              tabIndex={0}
            >
              <span className="badge-icon" aria-hidden>{badgeIcon(b.badge_key)}</span>
              <span>{badgeLabel(b.badge_key)}</span>
            </li>
          ))}
        </ul>
      )}

      <h2>last 90 days</h2>
      <span className="heatmap-legend">
        <span>less</span>
        <span className="heatmap-cell" />
        <span className="heatmap-cell" data-i="1" />
        <span className="heatmap-cell" data-i="2" />
        <span className="heatmap-cell" data-i="3" />
        <span>more</span>
      </span>
      <div
        className="heatmap"
        role="img"
        aria-label={`${heatCells.reduce((s, c) => s + c.count, 0)} plays over the last 90 days`}
      >
        {heatCells.map((c) => (
          <span
            key={c.date}
            className="heatmap-cell"
            data-i={c.bucket || undefined}
            data-tip={`${c.date}: ${c.count} play${c.count === 1 ? "" : "s"}`}
          />
        ))}
      </div>

      <h2>per-game</h2>
      <div className="profile-game-grid">
        {stats.map((s) => (
          <div key={s.key} className="profile-game-card">
            <div className="profile-game-title">
              {GAMES[s.key].name}
              {GAMES[s.key].isCore && (
                <Tooltip text="cognitively core game">
                  <span className="game-card-star">*</span>
                </Tooltip>
              )}
            </div>
            <dl className="profile-game-stats">
              <div>
                <dt>PB</dt>
                <dd>
                  {s.pb !== null ? s.pb : <span style={{ color: "var(--muted)" }}>-</span>}
                  {(() => {
                    // #52 score context: numeric delta vs 7d median, direction-aware.
                    // Persona feedback: "+12 vs 7d median" reads as data; copy like
                    // "better than" reads as encouragement. Arrow carries direction
                    // semantically (↑=better regardless of higher/lower), the signed
                    // delta carries magnitude.
                    if (s.pb === null || s.median7 === null) return null;
                    const diff = s.pb - s.median7;
                    if (Math.abs(diff) < 0.001) return null;
                    const isUp = direction(s.key) === "lower" ? diff < 0 : diff > 0;
                    const abs = Math.abs(diff);
                    const absStr = Number.isInteger(abs) ? abs.toString() : abs.toFixed(1);
                    const signed = `${diff > 0 ? "+" : "-"}${absStr}`;
                    return (
                      <span
                        className={`profile-stat-context ${isUp ? "is-up" : "is-down"}`}
                      >
                        {isUp ? "↑" : "↓"} {signed} vs 7d median
                      </span>
                    );
                  })()}
                </dd>
              </div>
              <div>
                <dt>set</dt>
                <dd>{s.pbDate ?? <span style={{ color: "var(--muted)" }}>-</span>}</dd>
              </div>
              <div>
                <dt>low (week)</dt>
                <dd>{s.lowWeek !== null ? s.lowWeek : <span style={{ color: "var(--muted)" }}>-</span>}</dd>
              </div>
              <div>
                <dt>7d median</dt>
                <dd>
                  {s.median7 !== null ? s.median7 : <span style={{ color: "var(--muted)" }}>-</span>}
                  {s.median7 !== null && (
                    <span className="profile-stat-context">n={s.median7N} day{s.median7N === 1 ? "" : "s"}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>30d plays</dt>
                <dd>{s.plays30}</dd>
              </div>
              <div>
                <dt>total plays</dt>
                <dd>{s.totalPlays}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
