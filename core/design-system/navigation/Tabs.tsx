"use client";

import * as React from "react";

import { cn } from "@/core/lib/utils/cn";

export type TabItem = { value: string; label: React.ReactNode; disabled?: boolean; content?: React.ReactNode };
export type TabsProps = { items: TabItem[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; children?: React.ReactNode; className?: string; listClassName?: string };

export function Tabs({ items, value, defaultValue, onValueChange, children, className, listClassName }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value ?? "");
  const current = value ?? internal;
  const select = (next: string) => { if (value === undefined) setInternal(next); onValueChange?.(next); };
  const active = items.find((item) => item.value === current);
  return <div className={cn("saut-tabs", className)}><div role="tablist" className={cn("saut-tabs__list", listClassName)}>{items.map((item) => <button key={item.value} type="button" role="tab" aria-selected={item.value === current} disabled={item.disabled} className={cn("saut-tabs__trigger", item.value === current && "saut-tabs__trigger--active")} onClick={() => select(item.value)}>{item.label}</button>)}</div><div role="tabpanel" className="saut-tabs__panel">{children ?? active?.content}</div></div>;
}

