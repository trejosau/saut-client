"use client";

import * as React from "react";

import { cn } from "@/core/lib/utils/cn";

export type DropdownProps = React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onOpenChange?: (open: boolean) => void; trigger: React.ReactNode; content: React.ReactNode; align?: "start" | "end" };

export function Dropdown({ open: openProp, onOpenChange, trigger, content, align = "end", className, ...props }: DropdownProps) {
  const [internal, setInternal] = React.useState(false);
  const open = openProp ?? internal;
  const setOpen = (next: boolean) => { if (openProp === undefined) setInternal(next); onOpenChange?.(next); };
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const close = (event: PointerEvent) => { if (open && ref.current && event.target instanceof Node && !ref.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  });
  return <div ref={ref} className={cn("saut-dropdown", className)} {...props}><button type="button" aria-haspopup="menu" aria-expanded={open} className="saut-dropdown__trigger" onClick={() => setOpen(!open)}>{trigger}</button>{open ? <div role="menu" className={cn("saut-dropdown__content", align === "start" ? "left-0" : "right-0")}>{content}</div> : null}</div>;
}

