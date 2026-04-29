import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Redirects /profile/me to the canonical /profile/<username> for the current
// user. /profile/me/* sub-pages (history, graphs) live under (authed) so the
// proxy gates them; the public version is /profile/<username>.
export default async function ProfileMePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");
  redirect(`/profile/${profile.username}`);
}
