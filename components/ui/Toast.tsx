"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastKind = "info" | "error";

type ToastEntry = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  show: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_TTL_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setToasts((cur) => [...cur, { id, kind, message }]);
  }, []);

  // Single timeout per toast — rolled into the entry component to keep this
  // provider stateless beyond the queue itself.
  const dismiss = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="region" aria-label="notifications">
        {toasts.map((t) => (
          <ToastItem key={t.id} entry={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ entry, onDismiss }: { entry: ToastEntry; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(entry.id), TOAST_TTL_MS);
    return () => window.clearTimeout(t);
  }, [entry.id, onDismiss]);
  return (
    <div
      className={`toast toast-${entry.kind}`}
      role={entry.kind === "error" ? "alert" : "status"}
    >
      <span>{entry.message}</span>
      <button
        type="button"
        aria-label="dismiss"
        onClick={() => onDismiss(entry.id)}
        className="btn-icon"
        style={{ marginLeft: "auto" }}
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Outside a provider — fall back to a no-op so a server import or test
    // mount doesn't crash. Real usage is always inside the AppShell tree.
    return { show: () => {} };
  }
  return ctx;
}
