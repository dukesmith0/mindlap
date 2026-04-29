import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "Settings - mindlap" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, username_changed_at, display_name, bio, avatar_color, theme_pref, is_public, skip_tutorials"
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // friend_code now lives on profile_secrets (owner-only SELECT). One extra read.
  const { data: secret } = await supabase
    .from("profile_secrets")
    .select("friend_code")
    .eq("user_id", user.id)
    .single();

  return (
    <AppShell>
      <p style={{ marginBottom: 12 }}>
        <Link href="/today" className="nav-back">&lt;- today</Link>
      </p>
      <h1>Settings</h1>
      <SettingsClient
        email={user.email ?? ""}
        username={profile.username}
        usernameChangedAt={profile.username_changed_at}
        displayName={profile.display_name ?? ""}
        bio={profile.bio ?? ""}
        avatarColor={profile.avatar_color}
        themePref={profile.theme_pref as "light" | "dark" | "system"}
        isPublic={profile.is_public}
        skipTutorials={profile.skip_tutorials}
        friendCode={secret?.friend_code ?? ""}
      />
    </AppShell>
  );
}
