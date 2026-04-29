import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  FRIEND_CODE_COOKIE,
  FRIEND_CODE_COOKIE_TTL_S,
  isValidFriendCode,
} from "@/lib/auth/friend-code-cookie";
import { addFriendAction } from "@/actions/friendships";

export const metadata = { title: "Friend invite - mindlap" };

// Public deep-link landing for `/f/<friend_code>`. Two paths:
//   - Anon: stash the code in a 30-day signed-ish cookie and redirect to
//     /signup. completeOnboardingAction consumes the cookie post-onboarding
//     and creates the pending friendship automatically.
//   - Authed: send a friend request via the standard server action and
//     redirect to /friends.
// Anon-readable per `isPublicPath()` in proxy.ts.
export default async function FriendInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = (code ?? "").toUpperCase();

  if (!isValidFriendCode(normalized)) {
    return (
      <main className="app-main app-main-centered">
        <h1>Invalid invite link</h1>
        <p className="subtitle">That friend code doesn&apos;t look right.</p>
        <p style={{ marginTop: 16 }}>
          <Link href="/" className="btn-link">go home -&gt;</Link>
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Look up the inviter's profile (read-only; RLS allows public SELECT).
  const { data: targetId } = await supabase.rpc("find_user_by_friend_code", {
    p_code: normalized,
  });

  let inviter: { username: string; display_name: string | null } | null = null;
  if (targetId) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", targetId)
      .single();
    if (data) inviter = data;
  }

  if (!user) {
    // Stash + redirect.
    const cookieStore = await cookies();
    cookieStore.set(FRIEND_CODE_COOKIE, normalized, {
      path: "/",
      maxAge: FRIEND_CODE_COOKIE_TTL_S,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return (
      <main className="app-main app-main-centered">
        <h1>You&apos;ve been invited</h1>
        <p className="subtitle">
          {inviter ? `@${inviter.username} wants to add you as a friend on mindlap.` : "Sign up to accept this friend request."}
        </p>
        <p style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/signup" className="btn-link">sign up -&gt;</Link>
          <Link href="/login" className="btn-link">sign in -&gt;</Link>
        </p>
      </main>
    );
  }

  // Authed: try to send the request immediately. Fall through to /friends
  // even if the action errors (the page surfaces state).
  const form = new FormData();
  form.set("code", normalized);
  await addFriendAction(form);
  redirect("/friends");
}
