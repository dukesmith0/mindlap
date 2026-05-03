"use client";

import { useId, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  // Server actions return `{ ok, error }`; we forward success up so the caller
  // can surface a toast if it cares. Async to support pending state.
  onConfirm: () => Promise<{ ok: true } | { ok: false; error: string }>;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: Props) {
  const titleId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const r = await onConfirm();
      if (!r.ok) setError(r.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className={danger ? "danger-h2" : undefined} style={{ marginTop: 0 }}>
        {title}
      </h2>
      <p className="text-muted-sm" style={{ marginBottom: 24 }}>{message}</p>
      {error && (
        <p className="tag-error" style={{ marginBottom: 12 }} role="alert">
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} disabled={pending}>
          cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          aria-busy={pending}
          className={danger ? "btn-danger" : undefined}
          style={{ opacity: pending ? 0.6 : 1 }}
        >
          {pending ? "..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
