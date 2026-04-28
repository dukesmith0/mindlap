// 20-color palette for profile avatars. Stored on profiles.avatar_color.
// Default for new users is the first entry (slate). Users pick from this set
// in /settings; no uploads, no Storage bucket, no per-user assets.

export const AVATAR_PALETTE = [
  "#64748b", // slate
  "#6b7280", // gray
  "#71717a", // zinc
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#ca8a04", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
] as const;

export type AvatarColor = (typeof AVATAR_PALETTE)[number];

export const DEFAULT_AVATAR_COLOR: AvatarColor = AVATAR_PALETTE[0];

export function isValidAvatarColor(value: string): value is AvatarColor {
  return (AVATAR_PALETTE as readonly string[]).includes(value);
}

// First letter of display_name (or username) uppercased; empty -> '?'.
export function avatarInitial(displayNameOrUsername: string | null | undefined): string {
  const source = (displayNameOrUsername ?? "").trim();
  if (!source) return "?";
  return source[0]!.toUpperCase();
}
