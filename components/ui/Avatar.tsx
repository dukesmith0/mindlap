import { avatarInitial } from "@/lib/auth/avatar-palette";

type AvatarProps = {
  color: string;
  name: string | null | undefined;
  size?: number;
};

export function Avatar({ color, name, size = 28 }: AvatarProps) {
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
        fontSize: Math.round(size * 0.45),
        lineHeight: 1,
        fontWeight: 700,
        userSelect: "none",
        // Courier Prime cap-baseline sits high; nudge content down 1px so the
        // initial visually centers in the disc.
        paddingTop: 1,
      }}
    >
      {avatarInitial(name)}
    </span>
  );
}
