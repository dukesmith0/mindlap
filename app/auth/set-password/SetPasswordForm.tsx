"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setNewPasswordAction } from "@/actions/auth";

export function SetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(form: FormData) {
    setError(null);
    const password = form.get("password");
    const confirm = form.get("confirm_password");
    if (typeof password !== "string" || typeof confirm !== "string" || password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    startTransition(async () => {
      const r = await setNewPasswordAction(form);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.replace("/today");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit}>
      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          new password (10+ chars, 1 number or symbol)
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={10}
          autoComplete="new-password"
          autoFocus
          style={{ width: "100%" }}
        />
      </label>
      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          confirm new password
        </span>
        <input
          type="password"
          name="confirm_password"
          required
          minLength={10}
          autoComplete="new-password"
          style={{ width: "100%" }}
        />
      </label>
      <button type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "..." : "save password ->"}
      </button>
      {error && (
        <p style={{ color: "var(--accent)", marginTop: 16, fontSize: 13 }} role="alert">
          [{error}]
        </p>
      )}
    </form>
  );
}
