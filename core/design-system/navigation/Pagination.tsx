"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/core/design-system/primitives/button/Button";
import { cn } from "@/core/lib/utils/cn";

export type PaginationProps = { page: number; pageSize: number; total: number; onPageChange: (page: number) => void; className?: string; label?: string };

export function Pagination({ page, pageSize, total, onPageChange, className, label = "Paginación" }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const current = Math.min(Math.max(1, page), pages);
  const visible = Array.from(new Set([1, current - 1, current, current + 1, pages].filter((item) => item >= 1 && item <= pages)));
  const summary = total === 0 ? "0 resultados" : String((current - 1) * pageSize + 1) + "–" + String(Math.min(current * pageSize, total)) + " de " + String(total);
  return <nav aria-label={label} className={cn("saut-pagination", className)}><Button variant="ghost" size="icon" aria-label="Página anterior" onClick={() => onPageChange(current - 1)} disabled={current <= 1}><ChevronLeft size={17} /></Button><div className="saut-pagination__pages">{visible.map((item) => <button key={item} type="button" aria-current={item === current ? "page" : undefined} className={cn("saut-pagination__page", item === current && "saut-pagination__page--active")} onClick={() => onPageChange(item)}>{item}</button>)}</div><Button variant="ghost" size="icon" aria-label="Página siguiente" onClick={() => onPageChange(current + 1)} disabled={current >= pages}><ChevronRight size={17} /></Button><span className="saut-pagination__summary">{summary}</span></nav>;
}

