"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { AVATAR_PALETTE, isValidAvatarColor } from "@/lib/auth/avatar-palette";
import { trimAvatarEmoji, validateAvatarEmoji } from "@/lib/auth/avatar-emoji";
import { AVATAR_EMOJI_PALETTE } from "@/lib/auth/avatar-emoji-palette";
import { setAvatarIdentityAction } from "@/actions/profile";

type Props = {
  open: boolean;
  initialColor: string;
  initialEmoji: string | null;
  displayName: string;
  onClose: () => void;
};

export function AvatarEditor(props: Props) {
  if (!props.open) return null;
  // Body is only mounted when open, so its useState initializers run with
  // the current initial values on each open. No reset-in-effect needed.
  return <AvatarEditorBody {...props} />;
}

function AvatarEditorBody({
  initialColor,
  initialEmoji,
  displayName,
  onClose,
}: Omit<Props, "open">) {
  const [color, setColor] = useState(initialColor);
  const [emoji, setEmoji] = useState(initialEmoji ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const backdropMouseDown = useRef(false);

  useEffect(() => {
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trimmedEmoji = trimAvatarEmoji(emoji);
  const hasPreviewEmoji = trimmedEmoji.length > 0;

  function save() {
    setError(null);
    if (hasPreviewEmoji) {
      const v = validateAvatarEmoji(trimmedEmoji);
      if (!v.ok) {
        setError(v.reason);
        return;
      }
    }
    if (!isValidAvatarColor(color)) {
      setError("Color not in palette.");
      return;
    }
    startTransition(async () => {
      const r = await setAvatarIdentityAction({
        color,
        emoji: hasPreviewEmoji ? trimmedEmoji : null,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        backdropMouseDown.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // Only close if both the press and the release landed on the backdrop —
        // prevents drag-to-select inside the card closing the dialog.
        if (e.target === e.currentTarget && backdropMouseDown.current) {
          onClose();
        }
        backdropMouseDown.current = false;
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-editor-title"
        className="modal-card"
      >
        <h2 id="avatar-editor-title" style={{ marginTop: 0, marginBottom: 16 }}>
          edit avatar
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <Avatar
            color={color}
            name={displayName}
            emoji={hasPreviewEmoji ? trimmedEmoji : null}
            size={64}
          />
          <span style={{ color: "var(--muted)", fontSize: 13 }}>preview</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>color</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AVATAR_PALETTE.map((swatch) => {
              const selected = swatch === color;
              return (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Pick ${swatch}`}
                  aria-pressed={selected}
                  onClick={() => setColor(swatch)}
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
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>emoji</p>
          <div className="avatar-emoji-grid">
            {AVATAR_EMOJI_PALETTE.map((g) => {
              const selected = trimmedEmoji === g;
              return (
                <button
                  key={g}
                  type="button"
                  aria-label={`Pick ${g}`}
                  aria-pressed={selected}
                  onClick={() => setEmoji(g)}
                  disabled={pending}
                  className={selected ? "avatar-emoji-cell is-selected" : "avatar-emoji-cell"}
                >
                  {g}
                </button>
              );
            })}
          </div>
          <label style={{ display: "block", marginTop: 12 }}>
            <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              or type any single emoji or letter (leave blank for initial)
            </span>
            <input
              type="text"
              value={emoji}
              maxLength={32}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="e.g. 🧠 or A"
              style={{ width: "100%" }}
              disabled={pending}
            />
            <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              tip: Win + . on Windows, Cmd + Ctrl + Space on Mac opens the system emoji picker
            </span>
          </label>
        </div>

        {error && (
          <p style={{ color: "var(--accent)", fontSize: 13, marginBottom: 12 }} role="alert">
            [{error}]
          </p>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button ref={closeBtnRef} type="button" onClick={onClose} disabled={pending}>
            cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            aria-busy={pending}
            style={{ opacity: pending ? 0.6 : 1 }}
          >
            {pending ? "..." : "save"}
          </button>
        </div>
      </div>
    </div>
  );
}
