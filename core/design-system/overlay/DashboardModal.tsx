"use client";

import * as React from "react";

import { Modal } from "./Modal";

export type DashboardModalProps = {
  open: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
};

/** Dashboard adapter that keeps module-specific content composable while sharing modal semantics. */
export function DashboardModal({ open, title, subtitle, onClose, children, wide = false, className }: DashboardModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={subtitle}
      size={wide ? "lg" : "md"}
      className={className}
    >
      {children}
    </Modal>
  );
}
