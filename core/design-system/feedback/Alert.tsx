import * as React from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/core/lib/utils/cn";

export type AlertTone = "success" | "error" | "warning" | "info";

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone;
  title?: React.ReactNode;
  onClose?: () => void;
};

const icons = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
} as const;

export function Alert({ tone = "info", title, onClose, className, children, ...props }: AlertProps) {
  const Icon = icons[tone];
  return (
    <div className={cn("saut-alert", `saut-alert--${tone}`, className)} role={tone === "error" ? "alert" : "status"} {...props}>
      <Icon className="saut-alert__icon" aria-hidden="true" size={18} />
      <div className="saut-alert__body">
        {title ? <p className="saut-alert__title">{title}</p> : null}
        <div className="saut-alert__message">{children}</div>
      </div>
      {onClose ? <button type="button" className="saut-alert__close" onClick={onClose} aria-label="Cerrar aviso"><X size={16} /></button> : null}
    </div>
  );
}
