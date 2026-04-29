"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptFriendAction,
  cancelFriendRequestAction,
  declineFriendAction,
  removeFriendAction,
  addFriendAction,
} from "@/actions/friendships";

// Relationship between the viewer and the profile owner. Computed server-side
// from the friendships row (if any).
export type RelationshipState =
  | { kind: "self" } // viewer === target
  | { kind: "anon" } // viewer not authed
  | { kind: "none" }
  | { kind: "outgoing_pending" } // I sent the request
  | { kind: "incoming_pending" } // they sent me one
  | { kind: "accepted" }
  | { kind: "blocked" };

export function ProfileSocialButtons({
  targetUserId,
  targetUsername,
  acceptsRequests,
  rel,
}: {
  targetUserId: string;
  targetUsername: string;
  acceptsRequests: boolean;
  rel: RelationshipState;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (rel.kind === "self") return null;

  function call(
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    field: "requester_id" | "friend_id" | "username",
    value: string,
  ) {
    const form = new FormData();
    form.set(field, value);
    startTransition(async () => {
      await action(form);
      router.refresh();
    });
  }

  if (rel.kind === "anon") return null;

  if (rel.kind === "blocked") {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>[unavailable]</p>;
  }

  if (rel.kind === "accepted") {
    return (
      <button
        type="button"
        className="btn-danger"
        disabled={pending}
        onClick={() => call(removeFriendAction, "friend_id", targetUserId)}
      >
        remove friend
      </button>
    );
  }

  if (rel.kind === "outgoing_pending") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => call(cancelFriendRequestAction, "friend_id", targetUserId)}
      >
        cancel request
      </button>
    );
  }

  if (rel.kind === "incoming_pending") {
    return (
      <span style={{ display: "inline-flex", gap: 8 }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => call(acceptFriendAction, "requester_id", targetUserId)}
        >
          accept
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={pending}
          onClick={() => call(declineFriendAction, "requester_id", targetUserId)}
        >
          decline
        </button>
      </span>
    );
  }

  // rel.kind === "none"
  if (!acceptsRequests) {
    return (
      <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
        [{targetUsername} is not accepting requests]
      </p>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => call(addFriendAction, "username", targetUsername)}
    >
      add friend
    </button>
  );
}
