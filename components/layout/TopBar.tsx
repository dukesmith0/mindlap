import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StreakRibbon } from "@/components/ui/StreakRibbon";
import { XpBar, levelFromXp } from "@/components/ui/XpBar";

type ProfileSummary = {
  username: string | null;
  display_name: string | null;
  avatar_color: string | null;
  streak_current: number | null;
  level: number | null;
  xp: number | null;
};

export function TopBar({ profile }: { profile: ProfileSummary | null }) {
  return (
    <header className="app-topbar">
      <div className="app-logo">
        <Link href="/today">mindlap</Link>
      </div>
      <div className="app-topbar-right">
        {profile ? (
          <>
            <StreakRibbon days={profile.streak_current ?? 0} />
            <XpBar
              xp={Number(profile.xp ?? 0)}
              level={profile.level ?? levelFromXp(Number(profile.xp ?? 0))}
            />
            <Link href="/settings" aria-label="settings">
              <Avatar
                color={profile.avatar_color ?? "#64748b"}
                name={profile.display_name ?? profile.username ?? "?"}
              />
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-link">sign in</Link>
            <Link href="/signup" className="btn-link">sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
