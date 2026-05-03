"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
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
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  if (rel.kind === "self") return null;

  function call(
    action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
    field: "requester_id" | "friend_id" | "username",
    value: string,
    successMsg: string,
  ) {
    const form = new FormData();
    form.set(field, value);
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

  if (rel.kind === "anon") return null;

  if (rel.kind === "blocked") {
    return <p className="tag">unavailable</p>;
  }

  if (rel.kind === "accepted") {
    return (
      <button
        type="button"
        className="btn-danger"
        disabled={pending}
        onClick={() => call(removeFriendAction, "friend_id", targetUserId, `Removed ${targetUsername}.`)}
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
        onClick={() => call(cancelFriendRequestAction, "friend_id", targetUserId, "Request cancelled.")}
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
          onClick={() => call(acceptFriendAction, "requester_id", targetUserId, `${targetUsername} is now your friend.`)}
        >
          accept
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={pending}
          onClick={() => call(declineFriendAction, "requester_id", targetUserId, "Request declined.")}
        >
          decline
        </button>
      </span>
    );
  }

  // rel.kind === "none"
  if (!acceptsRequests) {
    return (
      <p className="tag" style={{ margin: 0 }}>
        {targetUsername} is not accepting requests
      </p>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => call(addFriendAction, "username", targetUsername, "Friend request sent.")}
    >
      add friend
    </button>
  );
}
