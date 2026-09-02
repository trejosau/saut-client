"use client";

import * as React from "react";

import { Button } from "@/core/design-system/primitives/button/Button";
import { Modal } from "./Modal";

export type ConfirmDialogProps = Omit<React.ComponentProps<typeof Modal>, "footer" | "children"> & {
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({ message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", tone = "danger", onConfirm, onClose, ...props }: ConfirmDialogProps) {
  const [busy, setBusy] = React.useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    try { await onConfirm(); onClose(); } finally { setBusy(false); }
  };
  return <Modal {...props} onClose={busy ? () => undefined : onClose} footer={<><Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>{cancelLabel}</Button><Button variant={tone} size="sm" isLoading={busy} onClick={() => void handleConfirm()}>{confirmLabel}</Button></>}>{message}</Modal>;
}
