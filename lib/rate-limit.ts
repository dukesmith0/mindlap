// Lightweight per-user-per-hour rate limit for friend requests. Counts the
// outgoing rows the requester created in the last hour directly off
// `friendships`. Best-effort: a fast actor on multiple connections could
// squeeze past the cap by a small margin, which is acceptable for v1 closed
// beta. Phase 11 (R13) replaces this with a KV/Upstash IP+user bucket; keep
// the API stable so the swap is one file.

import type { SupabaseClient } from "@supabase/supabase-js";

export const FRIEND_REQUEST_LIMIT_PER_HOUR = 30;

export async function checkFriendRequestRateLimit(
  userId: string,
  supabase: SupabaseClient,
): Promise<{ allowed: boolean; remaining: number }> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("friendships")
    .select("requester_id", { count: "exact", head: true })
    .eq("requester_id", userId)
    .gte("created_at", since);

  const used = count ?? 0;
  return {
    allowed: used < FRIEND_REQUEST_LIMIT_PER_HOUR,
    remaining: Math.max(0, FRIEND_REQUEST_LIMIT_PER_HOUR - used),
  };
}
