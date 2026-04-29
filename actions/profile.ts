"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isValidAvatarColor } from "@/lib/auth/avatar-palette";
import { validateAvatarEmoji } from "@/lib/auth/avatar-emoji";
import { validateUsername } from "@/lib/auth/username";
import { THEME_COOKIE, isThemePref } from "@/lib/theme/cookie";
import { FRIEND_CODE_COOKIE, isValidFriendCode } from "@/lib/auth/friend-code-cookie";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  return user.id;
}

// ----------------------------------------------------------------------------
// Theme: persists to cookie immediately (anonymous-safe + fast first paint),
// and to profiles.theme_pref when the user is signed in.
// ----------------------------------------------------------------------------
export async function setThemeAction(formData: FormData): Promise<ActionResult> {
  const raw = formData.get("theme");
  const theme = typeof raw === "string" ? raw : "";
  if (!isThemePref(theme)) return { ok: false, error: "Invalid theme value" };

  await setThemeCookie(theme);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ theme_pref: theme }).eq("id", user.id);
    revalidatePath("/", "layout");
  }
  return { ok: true };
}

async function setThemeCookie(theme: "light" | "dark" | "system") {
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Server-side rendering reads this cookie via cookies(); no client JS needs it.
    httpOnly: true,
  });
}

// ----------------------------------------------------------------------------
// Avatar identity (#48): color + optional single-grapheme emoji glyph.
// Single action so a save commits both fields atomically and the modal
// preview matches what gets persisted.
// ----------------------------------------------------------------------------
export async function setAvatarIdentityAction(input: {
  color: string;
  emoji: string | null;
}): Promise<ActionResult> {
  if (!isValidAvatarColor(input.color)) {
    return { ok: false, error: "Color not in palette" };
  }
  let emojiValue: string | null = null;
  if (input.emoji !== null && input.emoji !== "") {
    const v = validateAvatarEmoji(input.emoji);
    if (!v.ok) return { ok: false, error: v.reason };
    emojiValue = v.value;
  }
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_color: input.color, avatar_emoji: emojiValue })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Username (rate-limited 1 change per 30 days, enforced server-side)
// ----------------------------------------------------------------------------
const ChangeUsernameSchema = z.object({ username: z.string() });

export async function changeUsernameAction(formData: FormData): Promise<ActionResult> {
  const parse = ChangeUsernameSchema.safeParse({ username: formData.get("username") });
  if (!parse.success) return { ok: false, error: "Invalid input" };

  const v = validateUsername(parse.data.username);
  if (!v.ok) return { ok: false, error: v.reason };

  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, username_changed_at")
    .eq("id", userId)
    .single();

  if (profile && profile.username_changed_at) {
    const last = new Date(profile.username_changed_at).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - last < thirtyDays) {
      const days = Math.ceil((thirtyDays - (Date.now() - last)) / (24 * 60 * 60 * 1000));
      return { ok: false, error: `You can change your username again in ${days} day(s).` };
    }
  }

  if (profile && profile.username === v.value) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: v.value, username_changed_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Username is taken." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Display name + bio
// ----------------------------------------------------------------------------
const DisplayNameSchema = z.object({
  display_name: z.string().trim().max(40).optional().or(z.literal("")),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
});

export async function updateProfileBasicsAction(formData: FormData): Promise<ActionResult> {
  const parse = DisplayNameSchema.safeParse({
    display_name: formData.get("display_name") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parse.success) return { ok: false, error: "Display name max 40, bio max 280." };

  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parse.data.display_name || null,
      bio: parse.data.bio || null,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Privacy toggle
// ----------------------------------------------------------------------------
export async function setProfilePrivacyAction(isPublic: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_public: isPublic }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Friend-request opt-out (Phase 7)
// ----------------------------------------------------------------------------
export async function setAcceptsFriendRequestsAction(accepts: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ accepts_friend_requests: accepts })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Skip-tutorials master toggle
// ----------------------------------------------------------------------------
export async function setSkipTutorialsAction(skip: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ skip_tutorials: skip })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Onboarding completion
// ----------------------------------------------------------------------------
export async function completeOnboardingAction(formData: FormData): Promise<ActionResult> {
  const usernameRaw = formData.get("username");
  const themeRaw = formData.get("theme");
  if (
    typeof usernameRaw !== "string" ||
    typeof themeRaw !== "string" ||
    !isThemePref(themeRaw)
  ) {
    return { ok: false, error: "Invalid input" };
  }
  const v = validateUsername(usernameRaw);
  if (!v.ok) return { ok: false, error: v.reason };

  const userId = await requireUserId();
  const supabase = await createClient();

  // If the user already finished onboarding, force them through the rate-limited
  // changeUsernameAction instead of letting this action overwrite freely.
  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", userId)
    .single();
  if (existing && existing.onboarded_at !== null) {
    return { ok: false, error: "Onboarding already complete." };
  }

  // Persist theme cookie too so the next paint matches.
  await setThemeCookie(themeRaw);

  const { error } = await supabase
    .from("profiles")
    .update({
      username: v.value,
      theme_pref: themeRaw,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Username is taken. Pick another." };
    return { ok: false, error: error.message };
  }

  // Phase 7: if the user landed on /f/<code> before signing up, the deep-link
  // page stashed a friend code cookie. Consume it here (one-shot) and create
  // a pending friendship to the link's owner. Failures are silent — we don't
  // want a stash bug to block onboarding.
  const cookieStore = await cookies();
  const stashedCode = cookieStore.get(FRIEND_CODE_COOKIE)?.value;
  if (stashedCode && isValidFriendCode(stashedCode)) {
    const { data: targetId } = await supabase.rpc("find_user_by_friend_code", {
      p_code: stashedCode,
    });
    if (targetId && targetId !== userId) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("accepts_friend_requests")
        .eq("id", targetId)
        .single();
      if (targetProfile?.accepts_friend_requests !== false) {
        await supabase.from("friendships").upsert(
          {
            requester_id: userId,
            addressee_id: targetId,
            status: "pending",
          },
          { onConflict: "requester_id,addressee_id" },
        );
      }
    }
    cookieStore.delete(FRIEND_CODE_COOKIE);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Hard delete account: cascades through every FK that references profiles(id).
// We delete the auth.users row via the admin API; the FK cascade in 0001_init
// handles the rest of the schema. Avatar storage isn't used (color-only avatars).
// ----------------------------------------------------------------------------
export async function deleteAccountAction(formData: FormData): Promise<ActionResult> {
  const confirm = formData.get("confirm_username");
  if (typeof confirm !== "string") return { ok: false, error: "Confirmation required" };

  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  if (!profile || profile.username.toLowerCase() !== confirm.trim().toLowerCase()) {
    return { ok: false, error: "Username did not match." };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return { ok: false, error: "Server is missing the service role key." };
  }

  // Direct admin API call with the service role key. Removes auth.users row;
  // FK cascade handles profiles + everything else.
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    }
  );
  if (!response.ok) {
    return { ok: false, error: `Could not delete account (${response.status})` };
  }

  await supabase.auth.signOut();
  redirect("/");
}
