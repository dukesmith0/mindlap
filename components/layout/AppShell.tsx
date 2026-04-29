import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { createClient } from "@/lib/supabase/server";

// Wrap any anonymous-or-authed page inside the zetamac-pure app shell:
// topbar (logo + streak/xp/avatar OR sign-in/up) + 200px sidebar nav + main.
export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_color, streak_current, level, xp")
      .eq("id", user.id)
      .single();
    profile = data;
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
