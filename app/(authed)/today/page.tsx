import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StreakRibbon } from "@/components/ui/StreakRibbon";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Today - mindlap" };

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Public-read: anonymous visitors see the page (Phase 4 will fill it with the
  // 7-game preview + leaderboard top-5). For now, show a minimal placeholder
  // and signed-in users get a header with their streak/level/avatar.
  let profile: {
    username: string | null;
    display_name: string | null;
    avatar_color: string | null;
    streak_current: number | null;
    level: number | null;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_color, streak_current, level")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 64px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
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
            <Link href="/login">
              <button>sign in</button>
            </Link>
            <Link href="/signup">
              <button>sign up</button>
            </Link>
          </div>
        )}
      </header>

      <hr />
      {profile ? (
        <p style={{ color: "var(--muted)" }}>
          Phase 2 lands the games. Signed in as{" "}
          <b style={{ color: "var(--ink)", fontWeight: 400 }}>{profile.username}</b>.
        </p>
      ) : (
        <>
          <p>
            Seven cognitive games, daily play, leaderboards. Phase 4 fills in this hub.
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            [sign in to play]
          </p>
        </>
      )}
    </main>
  );
}
