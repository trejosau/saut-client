import * as React from "react";

import { cn } from "@/core/lib/utils/cn";
import { EmptyState, Skeleton } from "@/core/design-system/feedback/states";

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;
export function Table({ className, ...props }: TableProps) { return <div className="saut-table-scroll"><table className={cn("saut-table", className)} {...props} /></div>; }
export function TableHeader(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <thead className="saut-table__head" {...props} />; }
export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <tbody className="saut-table__body" {...props} />; }
export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) { return <tr className={cn("saut-table__row", className)} {...props} />; }
export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) { return <th className={cn("saut-table__cell saut-table__cell--head", className)} {...props} />; }
export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) { return <td className={cn("saut-table__cell", className)} {...props} />; }
export function TableEmpty({ colSpan, title = "Sin resultados", description }: { colSpan: number; title?: React.ReactNode; description?: React.ReactNode }) { return <tr><td colSpan={colSpan}><EmptyState title={title} description={description} /></td></tr>; }
export function TableLoading({ rows = 3, columns = 3 }: { rows?: number; columns?: number }) { return <>{Array.from({ length: rows }, (_, row) => <tr key={row}>{Array.from({ length: columns }, (_, column) => <td key={column}><Skeleton className="block h-4 w-full" /></td>)}</tr>)}</>; }
