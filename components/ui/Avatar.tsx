import { avatarInitial } from "@/lib/auth/avatar-palette";

type AvatarProps = {
  color: string;
  name: string | null | undefined;
  emoji?: string | null;
  size?: number;
};

export function Avatar({ color, name, emoji, size = 28 }: AvatarProps) {
  const hasEmoji = typeof emoji === "string" && emoji.length > 0;
  const fontSize = Math.round(size * (hasEmoji ? 0.6 : 0.5));
  return (
    <span
      className="avatar-disc"
      aria-hidden
      style={{
        // inline-block + line-height = full disc height is the most reliable
        // way to vertically center a single text node inside a fixed-size box.
        // Avoids flex baseline drift seen with monospace cap-baseline + emoji
        // metric mismatch.
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#ffffff",
        fontSize,
        lineHeight: `${size}px`,
        fontWeight: hasEmoji ? 400 : 700,
        textAlign: "center",
        verticalAlign: "middle",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {hasEmoji ? emoji : avatarInitial(name)}
    </span>
  );
}
