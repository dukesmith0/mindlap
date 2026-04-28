import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata = { title: "Welcome - mindlap" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, theme_pref, avatar_color, onboarded_at")
    .eq("id", user.id)
    .single();

  // The proxy normally redirects already-onboarded users away, but keep a
  // server-side guard for direct hits (defense in depth).
  if (profile?.onboarded_at) redirect("/today");

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "64px 32px" }}>
      <h1>Welcome to mindlap</h1>
      <p style={{ color: "var(--muted)", marginBottom: 32 }}>
        Two quick steps and you&apos;re playing.
      </p>
      <OnboardingFlow
        suggestedUsername={profile?.username ?? ""}
        initialTheme={(profile?.theme_pref as "light" | "dark" | "system") ?? "system"}
        avatarColor={profile?.avatar_color ?? "#64748b"}
      />
    </main>
  );
}
