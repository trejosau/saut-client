"use client";

import * as React from "react";

import { Button } from "@/core/design-system/primitives/button/Button";
import { errorMessage } from "@/core/lib/api/errors";
import { Modal } from "./Modal";
import { notify } from "../feedback/ToastHost";

export type ConfirmDialogProps = Omit<React.ComponentProps<typeof Modal>, "footer" | "children"> & {
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  /** Overrides tone for callers that want an explicit destructive decision. */
  destructive?: boolean;
  /** Locks the dialog while work is already pending outside this component. */
  loading?: boolean;
  /** Optional consumer-specific error handling; otherwise the global toast is used. */
  onError?: (error: unknown) => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({ message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", tone = "danger", destructive, loading = false, onError, onConfirm, onClose, ...props }: ConfirmDialogProps) {
  const [pending, setPending] = React.useState(false);
  const pendingRef = React.useRef(false);
  const locked = loading || pending;
  const confirmVariant = destructive === undefined ? tone : destructive ? "danger" : "primary";

  const handleConfirm = async () => {
    if (loading || pendingRef.current) return;

    pendingRef.current = true;
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      if (onError) onError(error);
      else notify.error(errorMessage(error, "No se pudo completar la acción."));
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <Modal
      {...props}
      onClose={locked ? () => undefined : onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={locked}>{cancelLabel}</Button>
          <Button variant={confirmVariant} size="sm" isLoading={locked} onClick={() => void handleConfirm()}>{confirmLabel}</Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
