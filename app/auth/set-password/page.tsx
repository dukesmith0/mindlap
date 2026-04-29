import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata = { title: "Set new password - mindlap" };

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "64px 32px" }}>
      <h1>Set a new password</h1>
      <p style={{ color: "var(--muted)", marginBottom: 32 }}>
        You arrived here from a reset link. Pick a new password to finish.
      </p>
      <SetPasswordForm />
    </main>
  );
}
