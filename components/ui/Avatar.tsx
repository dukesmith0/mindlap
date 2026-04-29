import { avatarInitial } from "@/lib/auth/avatar-palette";

type AvatarProps = {
  color: string;
  name: string | null | undefined;
  emoji?: string | null;
  size?: number;
};

export function Avatar({ color, name, emoji, size = 28 }: AvatarProps) {
  const hasEmoji = typeof emoji === "string" && emoji.length > 0;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#ffffff",
        fontSize: Math.round(size * (hasEmoji ? 0.6 : 0.45)),
        lineHeight: 1,
        fontWeight: hasEmoji ? 400 : 700,
        userSelect: "none",
        // Initial rendering uses Courier Prime which sits high; nudge down 1px.
        // Emoji glyphs have their own metrics, no nudge.
        paddingTop: hasEmoji ? 0 : 1,
      }}
    >
      {hasEmoji ? emoji : avatarInitial(name)}
    </span>
  );
}
