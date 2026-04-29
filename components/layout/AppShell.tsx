import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { createClient } from "@/lib/supabase/server";

// Wrap any page inside the zetamac-pure app shell. `noSidebar` drops the
// sidebar (used on /play/[game] so the game stage centers in the viewport).
export async function AppShell({
  children,
  noSidebar = false,
}: {
  children: React.ReactNode;
  noSidebar?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_color, avatar_emoji, streak_current, level, xp")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  if (noSidebar) {
    return (
      <>
        <TopBar profile={profile} />
        <main className="app-main app-main-centered">{children}</main>
      </>
    );
  }

  return (
    <>
      <TopBar profile={profile} />
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">{children}</div>
      </div>
    </>
  );
}
