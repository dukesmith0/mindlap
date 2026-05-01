"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { avatarInitial } from "@/lib/auth/avatar-palette";

type AvatarProps = {
  color: string;
  name: string | null | undefined;
  emoji?: string | null;
  size?: number;
};

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Module-level memo of computed centering offsets keyed by (text + fontSize +
// size). The bbox of a given glyph at a given size is invariant; measuring it
// once per unique combination is enough. Without this, /leaderboards renders
// up to 100 avatars and runs getBBox on each mount (~100 layout reads).
type Offset = { dx: number; dy: number };
const offsetCache = new Map<string, Offset>();
function cacheKey(text: string, fontSize: number, size: number) {
  return `${text}|${fontSize}|${size}`;
}

// Avatar disc rendered with the glyph as inline SVG <text>. SVG dominant-
// baseline aligns to font metrics, not visual glyph centers, so we measure
// the actual rendered bounding box once and apply the offset.
export function Avatar({ color, name, emoji, size = 28 }: AvatarProps) {
  const hasEmoji = typeof emoji === "string" && emoji.length > 0;
  const fontSize = Math.round(size * (hasEmoji ? 0.6 : 0.5));
  const text = hasEmoji ? emoji! : avatarInitial(name);
  const key = cacheKey(text, fontSize, size);
  const textRef = useRef<SVGTextElement>(null);
  const [offset, setOffset] = useState<Offset>(
    () => offsetCache.get(key) ?? { dx: 0, dy: 0 },
  );

  useIsoLayoutEffect(() => {
    if (offsetCache.has(key)) {
      setOffset(offsetCache.get(key)!);
      return;
    }
    const node = textRef.current;
    if (!node) return;
    try {
      const bb = node.getBBox();
      const next: Offset = {
        dx: size / 2 - (bb.x + bb.width / 2),
        dy: size / 2 - (bb.y + bb.height / 2),
      };
      offsetCache.set(key, next);
      setOffset(next);
    } catch {
      // getBBox can throw if the SVG isn't laid out yet (very rare).
    }
  }, [key, size]);

  return (
    <span
      className="avatar-disc"
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        userSelect: "none",
        overflow: "hidden",
        verticalAlign: "middle",
        lineHeight: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: "block" }}
      >
        <text
          ref={textRef}
          x={size / 2 + offset.dx}
          y={size / 2 + offset.dy}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight={hasEmoji ? 400 : 700}
          fontFamily={
            hasEmoji
              ? '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'
              : "var(--font-mono)"
          }
          fill="#ffffff"
        >
          {text}
        </text>
      </svg>
    </span>
  );
}
