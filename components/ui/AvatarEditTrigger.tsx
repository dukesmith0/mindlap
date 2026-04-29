"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarEditor } from "@/components/ui/AvatarEditor";

type Props = {
  color: string;
  emoji: string | null;
  displayName: string;
  size?: number;
  ariaLabel?: string;
};

export function AvatarEditTrigger({
  color,
  emoji,
  displayName,
  size = 28,
  ariaLabel = "edit avatar",
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="avatar-edit-trigger"
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        <Avatar color={color} name={displayName} emoji={emoji} size={size} />
      </button>
      <AvatarEditor
        open={open}
        initialColor={color}
        initialEmoji={emoji}
        displayName={displayName}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
