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

type Step = 1 | 2 | 3;

export function OnboardingFlow({
  suggestedUsername,
  initialTheme,
  avatarColor,
  friendCode,
}: {
  suggestedUsername: string;
  initialTheme: ThemePref;
  avatarColor: string;
  friendCode: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState(suggestedUsername);
  const [theme, setTheme] = useState<ThemePref>(initialTheme);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function next1to2() {
    setError(null);
    const v = validateUsername(username);
    if (!v.ok) {
      setError(v.reason);
      return;
    }
    setUsername(v.value);
    setStep(2);
  }

  function next2to3() {
    setError(null);
    setStep(3);
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

  function copyCode() {
    if (typeof navigator === "undefined" || !navigator.clipboard || !friendCode) return;
    navigator.clipboard
      .writeText(friendCode)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div>
      {step === 1 && (
        <section>
          <h2>step 1 of 3 - username</h2>
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
          <button type="button" onClick={next1to2}>
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
          <h2>step 2 of 3 - theme</h2>
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
            <button type="button" onClick={next2to3} disabled={pending}>
              next -&gt;
            </button>
          </div>
          {error && (
            <p style={{ color: "var(--accent)", marginTop: 12, fontSize: 13 }} role="alert">
              [{error}]
            </p>
          )}
        </section>
      )}

      {step === 3 && (
        <section>
          <h2>step 3 of 3 - bring a friend</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
            Mindlap is more fun with someone to chase. Share your friend code so a friend can add you.
          </p>
          {friendCode ? (
            <>
              <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 4 }}>
                your friend code
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  border: "1px solid var(--line)",
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    color: "var(--accent)",
                    letterSpacing: 4,
                    flexGrow: 1,
                  }}
                >
                  {friendCode}
                </span>
                <button type="button" onClick={copyCode}>
                  {copied ? "copied!" : "copy"}
                </button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 24 }}>
                Friends can also add you by username. You can find more friends from the Friends tab anytime.
              </p>
            </>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
              You can find your friend code on /settings later.
            </p>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => setStep(2)} disabled={pending}>
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
