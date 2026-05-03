"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { addFriendAction } from "@/actions/friendships";
import { useToast } from "@/components/ui/Toast";

// Two inputs (username + friend code) on one form. Submit picks whichever
// field is non-empty; if both, server rejects (Zod refine). Optimistic state
// is just clearing the form on success.
export function AddFriendForm() {
  const router = useRouter();
  const toast = useToast();
  const usernameId = useId();
  const codeId = useId();
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
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
        toast.show("Friend request sent.");
        setUsername("");
        setCode("");
        router.refresh();
      } else {
        toast.show(r.error, "error");
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="@username" htmlFor={usernameId}>
          <input
            id={usernameId}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={pending}
            maxLength={24}
            placeholder="username"
            style={{ width: "100%" }}
            autoComplete="off"
          />
        </FormField>
        <FormField label="friend code" htmlFor={codeId}>
          <input
            id={codeId}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={pending}
            maxLength={8}
            placeholder="ABCD2345"
            style={{ width: "100%", letterSpacing: 1 }}
            autoComplete="off"
          />
        </FormField>
      </div>
      <div>
        <button type="submit" disabled={pending}>
          {pending ? "..." : "send request"}
        </button>
      </div>
      {error && <p className="tag-error" style={{ margin: 0 }} role="alert">{error}</p>}
    </form>
  );
}
