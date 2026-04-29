"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { validateUsername } from "@/lib/auth/username";
import type { ThemePref } from "@/lib/theme/cookie";
import { completeOnboardingAction } from "@/actions/profile";

const THEMES: { value: ThemePref; label: string; description: string }[] = [
  { value: "light", label: "light", description: "white background" },
  { value: "dark", label: "dark", description: "near-black background" },
  { value: "system", label: "system", description: "match your device" },
];

export function OnboardingFlow({
  suggestedUsername,
  initialTheme,
  avatarColor,
}: {
  suggestedUsername: string;
  initialTheme: ThemePref;
  avatarColor: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState(suggestedUsername);
  const [theme, setTheme] = useState<ThemePref>(initialTheme);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function next() {
    setError(null);
    const v = validateUsername(username);
    if (!v.ok) {
      setError(v.reason);
      return;
    }
    setUsername(v.value);
    setStep(2);
  }

  function finish() {
    setError(null);
    const form = new FormData();
    form.set("username", username);
    form.set("theme", theme);
    startTransition(async () => {
      const r = await completeOnboardingAction(form);
      if (!r.ok) {
        setError(r.error);
        if (r.error.toLowerCase().includes("username")) setStep(1);
        return;
      }
      // Theme cookie is now set; data-theme on <html> picks up after navigation.
      router.replace("/today");
      router.refresh();
    });
  }

  return (
    <div>
      {step === 1 && (
        <section>
          <h2>step 1 of 2 - username</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 6 }}>
            3-24 chars. Lowercase letters, digits, underscores, hyphens.
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
            Pick carefully - you can change this once per 30 days.
          </p>
          <label style={{ display: "block", marginBottom: 16 }}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              style={{ width: "100%" }}
              maxLength={24}
            />
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Avatar color={avatarColor} name={username} size={36} />
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              your avatar (change anytime in settings)
            </span>
          </div>
          <button type="button" onClick={next}>
            next -&gt;
          </button>
          {error && (
            <p style={{ color: "var(--accent)", marginTop: 12, fontSize: 13 }} role="alert">
              [{error}]
            </p>
          )}
        </section>
      )}

      {step === 2 && (
        <section>
          <h2>step 2 of 2 - theme</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
            Pick a default. You can switch anytime in settings.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {THEMES.map((t) => (
              <label
                key={t.value}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  cursor: "pointer",
                  padding: "8px 0",
                  borderTop: "1px solid var(--line)",
                }}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={() => setTheme(t.value)}
                />
                <span>{t.label}</span>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{t.description}</span>
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => setStep(1)} disabled={pending}>
              &lt;- back
            </button>
            <button type="button" onClick={finish} disabled={pending}>
              {pending ? "..." : "let's play ->"}
            </button>
          </div>
          {error && (
            <p style={{ color: "var(--accent)", marginTop: 12, fontSize: 13 }} role="alert">
              [{error}]
            </p>
          )}
        </section>
      )}
    </div>
  );
}
