import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StreakRibbon } from "@/components/ui/StreakRibbon";
import { createClient } from "@/lib/supabase/server";
import { ptDate } from "@/lib/pt-date";

export const metadata = { title: "Today - mindlap" };

const CORE_GAMES = [
  { key: "math", name: "Speed Math", tagline: "60s arithmetic drill" },
  { key: "digit", name: "Digit Span", tagline: "recall the sequence" },
  { key: "nback", name: "N-Back", tagline: "match every 2-back letter" },
  { key: "stroop", name: "Stroop", tagline: "ink, not the word. 30s" },
] as const;

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: {
    username: string | null;
    display_name: string | null;
    avatar_color: string | null;
    streak_current: number | null;
    level: number | null;
  } | null = null;

  // Today's best per game (PT day) — only loaded for signed-in users.
  const todayBests = new Map<string, number>();

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_color, streak_current, level")
      .eq("id", user.id)
      .single();
    profile = data;

    const ptToday = ptDate();

    const { data: aggs } = await supabase
      .from("daily_aggregates")
      .select("game_key, best")
      .eq("user_id", user.id)
      .eq("date", ptToday);

    if (aggs) {
      for (const row of aggs) {
        if (row.best !== null) todayBests.set(row.game_key, Number(row.best));
      }
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 64px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 40,
        }}
      >
        <div>
          <h1>Today&apos;s Games</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {profile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <StreakRibbon days={profile.streak_current ?? 0} />
            <span style={{ color: "var(--muted)" }}>Lv {profile.level ?? 1}</span>
            <Link href="/settings">
              <Avatar
                color={profile.avatar_color ?? "#64748b"}
                name={profile.display_name ?? profile.username ?? "?"}
              />
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/login" className="btn-link">sign in</Link>
            <Link href="/signup" className="btn-link">sign up</Link>
          </div>
        )}
      </header>

      <h2>core games</h2>
      <div role="list">
        {CORE_GAMES.map((g) => {
          const best = todayBests.get(g.key);
          return (
            <div key={g.key} className="game-card-row" role="listitem">
              <div>
                <div className="game-card-title">
                  {g.name} <span className="game-card-star">*</span>
                </div>
                <div className="game-card-meta">
                  {g.tagline}
                  {best !== undefined ? (
                    <>
                      {" - best today: "}
                      <b style={{ color: "var(--ink)", fontWeight: 400 }}>{best}</b>
                    </>
                  ) : profile ? (
                    " - not started"
                  ) : null}
                </div>
              </div>
              {profile ? (
                <Link href={`/play/${g.key}`} className="btn-link">play -&gt;</Link>
              ) : (
                <Link href="/login" className="btn-link">sign in -&gt;</Link>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 32 }}>
        [phase 2 ships the 4 core games. phase 3 adds reaction, minesweeper, word recall.]
      </p>
    </main>
  );
}
