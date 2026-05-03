"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { setNewPasswordAction } from "@/actions/auth";

export function SetPasswordForm() {
  const router = useRouter();
  const passwordId = useId();
  const confirmId = useId();
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
      <FormField label="new password (10+ chars, 1 number or symbol)" htmlFor={passwordId}>
        <input
          id={passwordId}
          type="password"
          name="password"
          required
          minLength={10}
          autoComplete="new-password"
          autoFocus
          style={{ width: "100%" }}
        />
      </FormField>
      <FormField label="confirm new password" htmlFor={confirmId}>
        <input
          id={confirmId}
          type="password"
          name="confirm_password"
          required
          minLength={10}
          autoComplete="new-password"
          style={{ width: "100%" }}
        />
      </FormField>
      <button type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "..." : "save password ->"}
      </button>
      {error && (
        <p className="tag-error" style={{ marginTop: 16 }} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
