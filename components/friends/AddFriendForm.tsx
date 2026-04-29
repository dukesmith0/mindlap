"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFriendAction } from "@/actions/friendships";

// Two inputs (username + friend code) on one form. Submit picks whichever
// field is non-empty; if both, server rejects (Zod refine). Optimistic state
// is just clearing the form on success.
export function AddFriendForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setInfo(null);
    setError(null);
    if (!username.trim() && !code.trim()) {
      setError("Enter a username or a friend code");
      return;
    }
    if (username.trim() && code.trim()) {
      setError("Enter username OR friend code, not both");
      return;
    }
    const form = new FormData();
    if (username.trim()) form.set("username", username.trim());
    if (code.trim()) form.set("code", code.trim().toUpperCase());
    startTransition(async () => {
      const r = await addFriendAction(form);
      if (r.ok) {
        setInfo("Request sent.");
        setUsername("");
        setCode("");
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            @username
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={pending}
            maxLength={24}
            placeholder="username"
            style={{ width: "100%" }}
            autoComplete="off"
          />
        </label>
        <label>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            friend code
          </span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={pending}
            maxLength={8}
            placeholder="ABCD2345"
            style={{ width: "100%", letterSpacing: 1 }}
            autoComplete="off"
          />
        </label>
      </div>
      <div>
        <button type="submit" disabled={pending}>
          {pending ? "..." : "send request"}
        </button>
      </div>
      {info && <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>[{info}]</p>}
      {error && <p style={{ color: "var(--accent)", fontSize: 13, margin: 0 }}>[{error}]</p>}
    </form>
  );
}
