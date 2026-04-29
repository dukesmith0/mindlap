// Avatar emoji rules (#48). User picks an optional single-grapheme glyph that
// renders inside the avatar disc instead of the display-name initial. We allow
// any unicode grapheme so people can pick letters, kana, or non-emoji symbols
// without us policing taste. The constraint is purely structural: exactly one
// extended grapheme cluster, after trimming.

const MAX_AVATAR_EMOJI_LEN = 32;

export function trimAvatarEmoji(raw: string): string {
  return raw.normalize("NFC").trim();
}

// Counts extended grapheme clusters. Falls back to code-point length when
// Intl.Segmenter is unavailable, which is fine since Node 18+ and all modern
// browsers support it.
function graphemeCount(value: string): number {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let n = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _segment of seg.segment(value)) n++;
    return n;
  }
  return Array.from(value).length;
}

export type AvatarEmojiCheck =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export function validateAvatarEmoji(raw: string): AvatarEmojiCheck {
  const v = trimAvatarEmoji(raw);
  if (v.length === 0) return { ok: false, reason: "Pick an emoji or letter." };
  if (v.length > MAX_AVATAR_EMOJI_LEN) {
    return { ok: false, reason: "Too long." };
  }
  if (graphemeCount(v) !== 1) {
    return { ok: false, reason: "Exactly one character." };
  }
  return { ok: true, value: v };
}
