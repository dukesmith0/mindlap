"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
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
  avatar_emoji: string | null;
};

export function FriendRow({ row, mode }: { row: FriendRowData; mode: Mode }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function call(
    action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
    key: "requester_id" | "friend_id",
    successMsg: string,
  ) {
    const form = new FormData();
    form.set(key, row.user_id);
    startTransition(async () => {
      const r = await action(form);
      if (!r.ok) {
        toast.show(r.error, "error");
      } else {
        toast.show(successMsg);
      }
      router.refresh();
    });
  }

  return (
    <li className="friend-row">
      <Link href={`/profile/${row.username}`} className="friend-row-identity">
        <Avatar
          color={row.avatar_color}
          name={row.display_name ?? row.username}
          emoji={row.avatar_emoji}
          size={28}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 14 }}>{row.display_name ?? row.username}</span>
          <span className="text-muted-xs">@{row.username}</span>
        </div>
      </Link>
      <div className="friend-row-actions">
        {mode === "incoming" && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => call(acceptFriendAction, "requester_id", `${row.username} is now your friend.`)}
            >
              accept
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => call(declineFriendAction, "requester_id", "Request declined.")}
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
            onClick={() => call(cancelFriendRequestAction, "friend_id", "Request cancelled.")}
          >
            cancel
          </button>
        )}
        {mode === "active" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => call(removeFriendAction, "friend_id", `Removed ${row.username}.`)}
            className="btn-danger"
          >
            remove
          </button>
        )}
      </div>
    </li>
  );
}
