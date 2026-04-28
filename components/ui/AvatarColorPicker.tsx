"use client";

import { useState, useTransition } from "react";
import { AVATAR_PALETTE, isValidAvatarColor } from "@/lib/auth/avatar-palette";

type Props = {
  initialColor: string;
  onSave: (color: string) => Promise<{ ok: boolean; error?: string }>;
};

export function AvatarColorPicker({ initialColor, onSave }: Props) {
  const [color, setColor] = useState(initialColor);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick(next: string) {
    if (!isValidAvatarColor(next) || next === color) return;
    setError(null);
    setColor(next);
    startTransition(async () => {
      const r = await onSave(next);
      if (!r.ok) {
        setError(r.error ?? "Could not save");
        setColor(initialColor);
      }
    });
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {AVATAR_PALETTE.map((swatch) => {
          const selected = swatch === color;
          return (
            <button
              key={swatch}
              type="button"
              aria-label={`Pick ${swatch}`}
              aria-pressed={selected}
              onClick={() => pick(swatch)}
              disabled={pending}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                background: swatch,
                border: selected
                  ? "1px solid var(--ink)"
                  : "1px solid var(--line)",
                borderRadius: 0,
                cursor: pending ? "not-allowed" : "pointer",
                outline: "none",
              }}
            />
          );
        })}
      </div>
      {error && (
        <p style={{ color: "var(--accent)", marginTop: 8, fontSize: 13 }}>{error}</p>
      )}
    </div>
  );
}
