import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/today");

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 64px" }}>
      <h1>mindlap</h1>
      <p style={{ color: "var(--muted)" }}>
        Track your cognitive performance over time.
      </p>
      <hr />
      <p>
        Seven cognitive games. Daily play. Personal trends. Global leaderboards.
      </p>
      <p>
        Sign up takes about a minute. Pick a username, pick a theme, you&apos;re in.
      </p>
      <hr />
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/signup">
          <button>sign up -&gt;</button>
        </Link>
        <Link href="/login">
          <button>sign in -&gt;</button>
        </Link>
        <Link href="/leaderboards">
          <button>see leaderboards -&gt;</button>
        </Link>
      </div>
    </main>
  );
}
