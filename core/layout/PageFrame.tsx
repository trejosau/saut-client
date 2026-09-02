import * as React from "react";

import { cn } from "@/core/lib/utils/cn";

export type PageFrameProps = React.HTMLAttributes<HTMLElement> & {
  as?: "main" | "div";
};

/** Shared route frame for pages that use the standard responsive content rhythm. */
export function PageFrame({ as: Component = "main", className, ...props }: PageFrameProps) {
  return <Component className={cn("w-full px-4 py-8 sm:px-8 lg:px-14", className)} {...props} />;
}
