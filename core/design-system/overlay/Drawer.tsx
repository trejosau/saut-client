"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/core/lib/utils/cn";
import { useHydrated } from "@/core/hooks/useHydrated";
import type { ModalProps } from "./Modal";
import { useOverlayDialog } from "./useOverlayDialog";

export type DrawerProps = Omit<ModalProps, "size"> & { side?: "left" | "right" | "bottom"; size?: "sm" | "md" | "lg" | "full"; header?: React.ReactNode };

export function Drawer({ open, onClose, title, description, children, footer, side = "right", size = "md", closeLabel = "Cerrar", className, contentClassName, header }: DrawerProps) {
  const mounted = useHydrated();
  const drawerRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const hasCustomHeader = header !== undefined;
  useOverlayDialog({ open, onClose, containerRef: drawerRef });
  if (!open || !mounted) return null;
  return createPortal(
    <div className="saut-drawer-layer">
      <button type="button" className="saut-drawer-backdrop" aria-label={closeLabel} onClick={onClose} />
      <aside ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={!hasCustomHeader && title ? titleId : undefined} aria-label={hasCustomHeader ? (typeof title === "string" ? title : "Panel") : title ? undefined : "Panel"} className={cn("saut-drawer", "saut-drawer--" + side, "saut-drawer--" + size, className)}>
        {header !== undefined ? header : <header className="saut-drawer__header"><div>{title ? <h2 id={titleId} className="saut-drawer__title">{title}</h2> : null}{description ? <p className="saut-drawer__description">{description}</p> : null}</div><button type="button" className="saut-drawer__close" onClick={onClose} aria-label={closeLabel}><X size={18} /></button></header>}
        <div className={cn("saut-drawer__content", contentClassName)}>{children}</div>
        {footer ? <footer className="saut-drawer__footer">{footer}</footer> : null}
      </aside>
    </div>,
    document.body
  );
}
