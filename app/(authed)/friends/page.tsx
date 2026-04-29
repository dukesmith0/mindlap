import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { FriendRow, type FriendRowData } from "@/components/friends/FriendRow";

export const metadata = { title: "Friends - mindlap" };

type RawProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_color: string;
  avatar_emoji: string | null;
} | null;

type FriendshipRow = {
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  requester: RawProfile;
  addressee: RawProfile;
};

function rowFromProfile(p: NonNullable<RawProfile>): FriendRowData {
  return {
    user_id: p.id,
    username: p.username,
    display_name: p.display_name,
    avatar_color: p.avatar_color,
    avatar_emoji: p.avatar_emoji,
  };
}

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS already restricts to rows where the user participates; we still
  // partition into incoming/outgoing/active here.
  const { data } = await supabase
    .from("friendships")
    .select(
      `
        requester_id,
        addressee_id,
        status,
        created_at,
        requester:profiles!friendships_requester_id_fkey ( id, username, display_name, avatar_color, avatar_emoji ),
        addressee:profiles!friendships_addressee_id_fkey ( id, username, display_name, avatar_color, avatar_emoji )
      `,
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as FriendshipRow[];

  const incoming: FriendRowData[] = [];
  const outgoing: FriendRowData[] = [];
  const active: FriendRowData[] = [];

  for (const r of rows) {
    if (r.status === "blocked") continue;
    if (r.status === "pending") {
      if (r.addressee_id === user.id && r.requester) incoming.push(rowFromProfile(r.requester));
      else if (r.requester_id === user.id && r.addressee) outgoing.push(rowFromProfile(r.addressee));
    } else if (r.status === "accepted") {
      const other = r.requester_id === user.id ? r.addressee : r.requester;
      if (other) active.push(rowFromProfile(other));
    }
  }

  return (
    <AppShell>
      <h1>Friends</h1>
      <p className="subtitle">Add a friend by their @username or 8-character friend code.</p>

      <AddFriendForm />

      <h2>incoming{incoming.length > 0 ? ` (${incoming.length})` : ""}</h2>
      {incoming.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>[no incoming requests]</p>
      ) : (
        <ul className="friend-list">
          {incoming.map((r) => <FriendRow key={r.user_id} row={r} mode="incoming" />)}
        </ul>
      )}

      <h2 style={{ marginTop: 32 }}>outgoing{outgoing.length > 0 ? ` (${outgoing.length})` : ""}</h2>
      {outgoing.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>[no outgoing requests]</p>
      ) : (
        <ul className="friend-list">
          {outgoing.map((r) => <FriendRow key={r.user_id} row={r} mode="outgoing" />)}
        </ul>
      )}

      <h2 style={{ marginTop: 32 }}>friends{active.length > 0 ? ` (${active.length})` : ""}</h2>
      {active.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>[no friends yet]</p>
      ) : (
        <ul className="friend-list">
          {active.map((r) => <FriendRow key={r.user_id} row={r} mode="active" />)}
        </ul>
      )}
    </AppShell>
  );
}
