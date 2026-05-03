"use client";

import { useId, useState, useTransition } from "react";
import { FormField } from "@/components/ui/FormField";
import {
  signInAction,
  signInWithGoogleAction,
  requestPasswordResetAction,
} from "@/actions/auth";

export function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const emailId = useId();
  const passwordId = useId();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resetEmail, setResetEmail] = useState("");

  function onSubmit(form: FormData) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const r = await signInAction(form);
      if (!r.ok) setError(r.error);
    });
  }

  function onGoogle(form: FormData) {
    setError(null);
    setInfo(null);
    form.set("next", next);
    startTransition(async () => {
      const r = await signInWithGoogleAction(form);
      if (!r.ok) setError(r.error);
    });
  }

  function onReset(form: FormData) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const r = await requestPasswordResetAction(form);
      if (r.ok) setInfo("Check your email for a reset link.");
      else setError(r.error);
    });
  }

  return (
    <>
      <form action={onSubmit}>
        <input type="hidden" name="next" value={next} />
        <FormField label="email" htmlFor={emailId}>
          <input
            id={emailId}
            type="email"
            name="email"
            required
            autoComplete="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </FormField>
        <FormField label="password" htmlFor={passwordId}>
          <input
            id={passwordId}
            type="password"
            name="password"
            required
            autoComplete="current-password"
            style={{ width: "100%" }}
          />
        </FormField>
        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {pending ? "..." : "sign in ->"}
        </button>
      </form>

      <form action={onGoogle} style={{ marginTop: 12 }}>
        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {"continue with google ->"}
        </button>
      </form>

      <form action={onReset} style={{ marginTop: 24 }}>
        <input type="hidden" name="email" value={resetEmail} />
        <button
          type="submit"
          disabled={pending || !resetEmail}
          style={{ width: "100%", border: "none", color: "var(--muted)", padding: 0, fontSize: 13 }}
        >
          forgot password? send reset email
        </button>
      </form>

      {error && (
        <p className="tag-error" style={{ marginTop: 16 }} role="alert">
          {error}
        </p>
      )}
      {info && (
        <p className="tag" role="status" style={{ marginTop: 16 }}>
          {info}
        </p>
      )}
    </>
  );
}
