// Bracket pill: muted text wrapped in [brackets]. Replaces UI pills/badges so
// nothing has a fill or border (Zetamac Pure rule).

export function BracketPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: "var(--muted)", fontSize: 12 }}>
      [{children}]
    </span>
  );
}
