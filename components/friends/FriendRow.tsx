"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import {
  acceptFriendAction,
  declineFriendAction,
  cancelFriendRequestAction,
  removeFriendAction,
} from "@/actions/friendships";

type Mode = "incoming" | "outgoing" | "active";

export type FriendRowData = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_color: string;
};

export function FriendRow({ row, mode }: { row: FriendRowData; mode: Mode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function call(action: (fd: FormData) => Promise<{ ok: boolean }>, key: "requester_id" | "friend_id") {
    const form = new FormData();
    form.set(key, row.user_id);
    startTransition(async () => {
      await action(form);
      router.refresh();
    });
  }

  return (
    <li className="friend-row">
      <Link href={`/profile/${row.username}`} className="friend-row-identity">
        <Avatar color={row.avatar_color} name={row.display_name ?? row.username} size={28} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 14 }}>{row.display_name ?? row.username}</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>@{row.username}</span>
        </div>
      </Link>
      <div className="friend-row-actions">
        {mode === "incoming" && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => call(acceptFriendAction, "requester_id")}
            >
              accept
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => call(declineFriendAction, "requester_id")}
              className="btn-danger"
            >
              decline
            </button>
          </>
        )}
        {mode === "outgoing" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => call(cancelFriendRequestAction, "friend_id")}
          >
            cancel
          </button>
        )}
        {mode === "active" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => call(removeFriendAction, "friend_id")}
            className="btn-danger"
          >
            remove
          </button>
        )}
      </div>
    </li>
  );
}
