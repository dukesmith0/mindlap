"use client";

import { useId, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
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
  // Body is mounted only when open so its useState initializers re-run on
  // each open with the current initial values. No reset-in-effect needed.
  return <AvatarEditorBody {...props} />;
}

function AvatarEditorBody({
  open,
  initialColor,
  initialEmoji,
  displayName,
  onClose,
}: Props) {
  const titleId = useId();
  const emojiInputId = useId();
  const toast = useToast();
  const [color, setColor] = useState(initialColor);
  const [emoji, setEmoji] = useState(initialEmoji ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        toast.show(r.error, "error");
        return;
      }
      toast.show("Avatar updated.");
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} style={{ marginTop: 0, marginBottom: 16 }}>
        edit avatar
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Avatar
          color={color}
          name={displayName}
          emoji={hasPreviewEmoji ? trimmedEmoji : null}
          size={64}
        />
        <span className="text-muted-sm">preview</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p className="text-muted-xs" style={{ marginBottom: 8 }}>color</p>
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
        <p className="text-muted-xs" style={{ marginBottom: 8 }}>emoji</p>
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
        <div style={{ marginTop: 12 }}>
          <FormField
            label="or type any single emoji or letter (leave blank for initial)"
            htmlFor={emojiInputId}
            hint="tip: Win + . on Windows, Cmd + Ctrl + Space on Mac opens the system emoji picker"
          >
            <input
              id={emojiInputId}
              type="text"
              value={emoji}
              maxLength={32}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="e.g. 🧠 or A"
              style={{ width: "100%" }}
              disabled={pending}
            />
          </FormField>
        </div>
      </div>

      {error && (
        <p className="tag-error" style={{ marginBottom: 12 }} role="alert">
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} disabled={pending}>
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
    </Modal>
  );
}
