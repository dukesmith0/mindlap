"use client";

import { useState, useTransition } from "react";
import { signUpAction, signInWithGoogleAction } from "@/actions/auth";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(form: FormData) {
    setError(null);
    setDone(false);
    const password = form.get("password");
    const confirm = form.get("confirm_password");
    if (typeof password !== "string" || typeof confirm !== "string" || password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    startTransition(async () => {
      const r = await signUpAction(form);
      if (r.ok) setDone(true);
      else setError(r.error);
    });
  }

  function onGoogle(form: FormData) {
    setError(null);
    form.set("next", "/onboarding");
    startTransition(async () => {
      const r = await signInWithGoogleAction(form);
      if (!r.ok) setError(r.error);
    });
  }

  if (done) {
    return (
      <p style={{ color: "var(--muted)" }}>
        [Check your email] We sent a confirmation link. Click it to finish creating your account.
      </p>
    );
  }

  return (
    <>
      <form action={onSubmit}>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            email
          </span>
          <input type="email" name="email" required autoComplete="email" style={{ width: "100%" }} />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            password (10+ chars, 1 number or symbol)
          </span>
          <input type="password" name="password" required minLength={10} autoComplete="new-password" style={{ width: "100%" }} />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            confirm password
          </span>
          <input type="password" name="confirm_password" required minLength={10} autoComplete="new-password" style={{ width: "100%" }} />
        </label>
        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {pending ? "..." : "create account ->"}
        </button>
      </form>

      <form action={onGoogle} style={{ marginTop: 12 }}>
        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {"continue with google ->"}
        </button>
      </form>

      {error && (
        <p style={{ color: "var(--accent)", marginTop: 16, fontSize: 13 }} role="alert">
          [{error}]
        </p>
      )}
    </>
  );
}
