"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/core/lib/utils/cn";
import { useHydrated } from "@/core/hooks/useHydrated";
import { useOverlayDialog } from "./useOverlayDialog";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  closeLabel?: string;
  className?: string;
  contentClassName?: string;
};

export function Modal({ open, onClose, title, description, children, footer, size = "md", closeLabel = "Cerrar", className, contentClassName }: ModalProps) {
  const mounted = useHydrated();
  const dialogRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descriptionId = titleId + "-description";
  useOverlayDialog({ open, onClose, containerRef: dialogRef });
  if (!open || !mounted) return null;
  return createPortal(
    <div className="saut-modal-layer" role="presentation">
      <button type="button" className="saut-modal-backdrop" aria-label={closeLabel} onClick={onClose} />
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : "Diálogo"} aria-describedby={description ? descriptionId : undefined} className={cn("saut-modal", "saut-modal--" + size, className)}>
        {(title || description || onClose) ? <header className="saut-modal__header">{<div>{title ? <h2 id={titleId} className="saut-modal__title">{title}</h2> : null}{description ? <p id={descriptionId} className="saut-modal__description">{description}</p> : null}</div>}<button type="button" className="saut-modal__close" onClick={onClose} aria-label={closeLabel}><X size={18} /></button></header> : null}
        <div className={cn("saut-modal__content", contentClassName)}>{children}</div>
        {footer ? <footer className="saut-modal__footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body
  );
}

export const Dialog = Modal;
export type DialogProps = ModalProps;

export function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLElement>) { return <header className={cn("saut-modal__header", className)} {...props} />; }
export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLElement>) { return <footer className={cn("saut-modal__footer", className)} {...props} />; }
