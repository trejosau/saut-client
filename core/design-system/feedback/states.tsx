import * as React from "react";
import { CircleAlert, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@/core/design-system/primitives/button/Button";
import { Spinner } from "@/core/design-system/primitives/spinner/Spinner";
import { cn } from "@/core/lib/utils/cn";

export type StateProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export function EmptyState({ title = "Sin resultados", description, action, className, ...props }: StateProps) {
  return <div className={cn("saut-state", "saut-state--empty", className)} {...props}><Inbox aria-hidden="true" size={30} /><h2>{title}</h2>{description ? <p>{description}</p> : null}{action}</div>;
}

export function ErrorState({ title = "No se pudo cargar la información", description, action, onRetry, className, ...props }: StateProps & { onRetry?: () => void }) {
  return <div className={cn("saut-state", "saut-state--error", className)} {...props}><CircleAlert aria-hidden="true" size={30} /><h2>{title}</h2>{description ? <p>{description}</p> : null}{action ?? (onRetry ? <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} />} onClick={onRetry}>Reintentar</Button> : null)}</div>;
}

export function LoadingState({ title = "Cargando…", description, className, ...props }: StateProps) {
  return <div className={cn("saut-state", "saut-state--loading", className)} aria-busy="true" {...props}><Spinner size="lg" label={String(title)} /><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>;
}

export type SkeletonProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: "text" | "circle" | "rect" };

export function Skeleton({ variant = "text", className, ...props }: SkeletonProps) {
  return <span aria-hidden="true" className={cn("saut-skeleton", `saut-skeleton--${variant}`, className)} {...props} />;
}

export { EmptyState as Empty, ErrorState as Error, LoadingState as Loading };
