import * as React from "react";

import { cn } from "@/core/lib/utils/cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
};

export function Badge({ tone = "neutral", size = "sm", className, ...props }: BadgeProps) {
  return <span className={cn("saut-badge", `saut-badge--${tone}`, `saut-badge--${size}`, className)} {...props} />;
}

