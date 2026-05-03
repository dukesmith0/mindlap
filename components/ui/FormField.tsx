import type React from "react";

// Lightweight wrapper for label + hint + error. Children render the actual
// input. Hint uses .text-muted-xs; errors use .tag-error (var(--danger)) so
// they don't read as clickable links.
export function FormField({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div style={{ display: "block", marginBottom: 12 }}>
      <label
        htmlFor={htmlFor}
        className="text-muted-xs"
        style={{ display: "block", marginBottom: 4 }}
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-muted-xs" style={{ marginTop: 4 }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="tag-error" style={{ fontSize: 12, marginTop: 4 }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
