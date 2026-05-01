import type React from "react";

// Lightweight wrapper for label + hint + error. Children render the actual
// input. Keeps Zetamac Pure: muted hint + accent error, 1px input borders
// inherited from globals.css.
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
        style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }} role="alert">
          [{error}]
        </p>
      )}
    </div>
  );
}
