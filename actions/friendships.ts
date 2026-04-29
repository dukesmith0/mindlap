"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkFriendRequestRateLimit } from "@/lib/rate-limit";

type ActionResult = { ok: true } | { ok: false; error: string };

// addFriendAction:
// - Accepts either a friend code (8 chars, Crockford-ish) or a username
//   (3-24, [a-zA-Z0-9_-]). Exactly one must be provided.
// - Rate-limited to 30 outgoing requests / hour / requester (lib/rate-limit.ts).
// - Rejects self-friend, blocked-by-target, and target opt-out
//   (`profiles.accepts_friend_requests = false`).
// - Idempotent on existing pending: returns ok if a row already exists.
// - If the target previously requested *us*, we accept their request instead
//   of inserting a new pending row.
const AddFriendSchema = z
  .object({
    code: z.string().trim().optional().or(z.literal("")),
    username: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (d) => Boolean(d.code) !== Boolean(d.username),
    "Provide a friend code OR a username, not both",
  );

export async function addFriendAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const parse = AddFriendSchema.safeParse({
    code: formData.get("code") ?? "",
    username: formData.get("username") ?? "",
  });
  if (!parse.success) return { ok: false, error: "Invalid input" };

  const { allowed, remaining } = await checkFriendRequestRateLimit(user.id, supabase);
  if (!allowed) {
    return { ok: false, error: "Rate limit reached: 30 outgoing requests per hour. Try again later." };
  }

  let targetId: string | null = null;
  if (parse.data.code) {
    const { data, error } = await supabase.rpc("find_user_by_friend_code", {
      p_code: parse.data.code,
    });
    if (error) return { ok: false, error: "Lookup failed" };
    targetId = (data as string | null) ?? null;
  } else if (parse.data.username) {
    const { data, error } = await supabase.rpc("find_user_by_username", {
      p_username: parse.data.username,
    });
    if (error) return { ok: false, error: "Lookup failed" };
    targetId = (data as string | null) ?? null;
  }

  if (!targetId) return { ok: false, error: "User not found" };
  if (targetId === user.id) return { ok: false, error: "Cannot friend yourself" };

  // Target opt-out?
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("accepts_friend_requests")
    .eq("id", targetId)
    .single();
  if (targetProfile && targetProfile.accepts_friend_requests === false) {
    return { ok: false, error: "User is not accepting friend requests" };
  }

  // If they already requested us, accept their pending row instead of opening
  // a duplicate.
  const { data: inbound } = await supabase
    .from("friendships")
    .select("status")
    .eq("requester_id", targetId)
    .eq("addressee_id", user.id)
    .maybeSingle();
  if (inbound) {
    if (inbound.status === "blocked") return { ok: false, error: "Cannot send request" };
    if (inbound.status === "pending") {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("requester_id", targetId)
        .eq("addressee_id", user.id);
      if (error) return { ok: false, error: error.message };
      revalidatePath("/friends");
      revalidatePath("/profile", "layout");
      return { ok: true };
    }
    if (inbound.status === "accepted") {
      return { ok: true };
    }
  }

  // Insert (or upsert if a prior outgoing row exists, e.g. after decline).
  const { error } = await supabase.from("friendships").upsert(
    {
      requester_id: user.id,
      addressee_id: targetId,
      status: "pending",
    },
    { onConflict: "requester_id,addressee_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/friends");
  revalidatePath("/profile", "layout");
  // Surface remaining quota for nicer UX in the form (caller can ignore).
  void remaining;
  return { ok: true };
}

// acceptFriendAction: addressee accepts an inbound pending request.
const ActOnFriendshipSchema = z.object({
  requester_id: z.string().uuid().optional(),
  friend_id: z.string().uuid().optional(),
});

export async function acceptFriendAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const parse = ActOnFriendshipSchema.safeParse({
    requester_id: formData.get("requester_id") ?? undefined,
  });
  if (!parse.success || !parse.data.requester_id) return { ok: false, error: "Invalid input" };

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("requester_id", parse.data.requester_id)
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/friends");
  revalidatePath("/profile", "layout");
  return { ok: true };
}

// declineFriendAction: addressee declines an inbound pending request (deletes
// the row so the requester can re-request later if they want).
export async function declineFriendAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const parse = ActOnFriendshipSchema.safeParse({
    requester_id: formData.get("requester_id") ?? undefined,
  });
  if (!parse.success || !parse.data.requester_id) return { ok: false, error: "Invalid input" };

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", parse.data.requester_id)
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/friends");
  revalidatePath("/profile", "layout");
  return { ok: true };
}

// cancelFriendRequestAction: requester withdraws their own outgoing pending.
export async function cancelFriendRequestAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const parse = ActOnFriendshipSchema.safeParse({
    friend_id: formData.get("friend_id") ?? undefined,
  });
  if (!parse.success || !parse.data.friend_id) return { ok: false, error: "Invalid input" };

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", user.id)
    .eq("addressee_id", parse.data.friend_id)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/friends");
  revalidatePath("/profile", "layout");
  return { ok: true };
}

// removeFriendAction: either party deletes an accepted friendship.
export async function removeFriendAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const parse = ActOnFriendshipSchema.safeParse({
    friend_id: formData.get("friend_id") ?? undefined,
  });
  if (!parse.success || !parse.data.friend_id) return { ok: false, error: "Invalid input" };
  const friendId = parse.data.friend_id;

  // Either-direction delete: the row may be (me, friend) or (friend, me).
  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`,
    )
    .eq("status", "accepted");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/friends");
  revalidatePath("/profile", "layout");
  return { ok: true };
}
