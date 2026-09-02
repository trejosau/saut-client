"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { useCart } from "@/core/cart/context";
import { Button, Drawer, IconButton, NumberStepper } from "@/core/design-system";

function formatMXN(amount: number) {
    try {
        return amount.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    } catch {
        return String(amount);
    }
}

function normalizeQty(value: number) {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.floor(value));
}

function areaToStyle(area?: { xPct: number; yPct: number; wPct: number; hPct: number }): React.CSSProperties {
    if (!area) return { display: "none" };
    return {
        left: `${area.xPct}%`,
        top: `${area.yPct}%`,
        width: `${area.wPct}%`,
        height: `${area.hPct}%`,
    };
}

export function CartDrawer() {
    const router = useRouter();
    const {
        items,
        itemCount,
        subtotal,
        isOpen,
        closeCart,
        removeItem,
        setItemQuantity,
        clear,
    } = useCart();

    const handleCheckout = React.useCallback(() => {
        if (items.length === 0) return;
        closeCart();
        router.push("/checkout");
    }, [closeCart, items.length, router]);

    return (
        <Drawer
            open={isOpen}
            onClose={closeCart}
            title="Carrito"
            closeLabel="Cerrar carrito"
            size="md"
            header={null}
            contentClassName="p-0"
            className="border-l border-hairline bg-[linear-gradient(180deg,rgba(233,226,196,.98)_0%,rgba(233,226,196,.96)_100%)] backdrop-blur-[12px] shadow-[-24px_0_46px_rgba(8,10,13,.18)]"
        >
                <header className="border-b border-hairline bg-[rgba(255,255,255,.34)] px-4 py-4 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[14px] font-black tracking-[0.16em] uppercase text-ink">
                                Carrito
                            </div>
                            <p className="mt-1 text-[12px] text-mute">
                                {itemCount} {itemCount === 1 ? "producto" : "productos"}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {items.length > 0 ? (
                                <Button type="button" variant="outline" size="sm" className="h-11 rounded-[7px] bg-white px-3 text-[10px]" onClick={clear}>
                                    Vaciar
                                </Button>
                            ) : null}
                            <IconButton icon={<X size={18} />} label="Cerrar carrito" onClick={closeCart} variant="outline" className="h-11 w-11 rounded-[7px] bg-white" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto px-4 py-4 sm:px-5">
                    {items.length === 0 ? (
                        <div className="rounded-[8px] border border-hairline bg-white p-6 text-center shadow-[0_14px_30px_rgba(8,10,13,.08)]">
                            <p className="text-[13px] font-black tracking-[0.12em] uppercase text-ink">
                                Tu carrito estÃ¡ vacÃ­o
                            </p>
                            <p className="mt-2 text-[12px] text-mute">
                                Agrega productos desde el catÃ¡logo o desde el detalle del producto.
                            </p>
                            <Button type="button" variant="primary" size="sm" onClick={closeCart} className="mt-4 h-11 rounded-[7px] px-4 text-[11px]">
                                Seguir comprando
                            </Button>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {items.map((item) => {
                                const lineTotal = item.unitPrice * item.quantity;
                                return (
                                    <li
                                        key={item.lineId}
                                        className="group rounded-[8px] border border-hairline bg-white p-3 shadow-[0_12px_24px_rgba(8,10,13,.06)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_30px_rgba(8,10,13,.1)]"
                                    >
                                        <div className="flex gap-3">
                                            <div className="h-[90px] w-[74px] shrink-0 overflow-hidden rounded-xl border border-[rgba(8,10,13,.08)] bg-[rgba(5,122,168,.06)]">
                                                <div className="relative h-full w-full">
                                                    <div className="absolute inset-0 transition-opacity duration-200 group-hover:opacity-0">
                                                        <img
                                                            src={item.imageFrontSrc ?? item.imageSrc}
                                                            alt={item.name}
                                                            className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.03]"
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                        {item.imageFrontOverlaySrc ? (
                                                            <div className="absolute" style={areaToStyle(item.frontPrintArea)}>
                                                                <img
                                                                    src={item.imageFrontOverlaySrc}
                                                                    alt={`${item.name} frontal`}
                                                                    className="h-full w-full object-contain"
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                        <img
                                                            src={item.imageBackSrc ?? item.imageFrontSrc ?? item.imageSrc}
                                                            alt={`${item.name} trasera`}
                                                            className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.03]"
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                        {item.imageBackOverlaySrc ? (
                                                            <div className="absolute" style={areaToStyle(item.backPrintArea)}>
                                                                <img
                                                                    src={item.imageBackOverlaySrc}
                                                                    alt={`${item.name} trasera`}
                                                                    className="h-full w-full object-contain"
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[12px] font-black tracking-[0.12em] uppercase text-ink">
                                                    {item.name}
                                                </p>

                                                {item.selections.length > 0 ? (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {item.selections.map((selection) => (
                                                            <span
                                                                key={`${item.lineId}-${selection.label}`}
                                                                className="inline-flex rounded-full border border-hairline bg-[rgba(255,217,66,.3)] px-2 py-0.5 text-[10px] font-black tracking-[0.08em] uppercase text-charcoal"
                                                            >
                                                                {selection.label}: {selection.value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : null}

                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-black tracking-[0.12em] uppercase text-mute">
                                                        Unitario
                                                    </span>
                                                    <span className="text-[12px] font-black tracking-[0.1em] uppercase text-charcoal">
                                                        ${formatMXN(item.unitPrice)}
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-black tracking-[0.12em] uppercase text-mute">
                                                        Total item
                                                    </span>
                                                    <span className="text-[13px] font-black tracking-[0.1em] uppercase text-charcoal">
                                                        ${formatMXN(lineTotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            <NumberStepper value={item.quantity} min={1} size="md" onValueChange={(value) => setItemQuantity(item.lineId, normalizeQty(value))} aria-label={`cantidad de ${item.name}`} />
                                            <Button type="button" variant="danger" size="sm" onClick={() => removeItem(item.lineId)} className="min-h-11 rounded-full bg-[rgba(219,38,75,.12)] px-4 text-xs text-[rgba(8,10,13,.78)]">
                                                Eliminar
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <footer className="border-t border-hairline bg-[rgba(255,255,255,.34)] px-4 py-4 sm:px-5">
                    <div className="rounded-xl border border-hairline bg-[rgba(255,255,255,.55)] p-3">
                        <div className="flex items-center justify-between text-[11px] font-black tracking-[0.14em] uppercase">
                            <span className="text-mute">Productos</span>
                            <span className="text-ink">{itemCount}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[12px] font-black tracking-[0.14em] uppercase">
                            <span className="text-mute">Subtotal</span>
                            <span className="text-charcoal">${formatMXN(subtotal)}</span>
                        </div>
                    </div>

                    <Button type="button" variant="primary" size="sm" fullWidth disabled={items.length === 0} onClick={handleCheckout} className="mt-3 h-11 rounded-[999px] text-[12px]">
                        Continuar al pago
                    </Button>
                </footer>
        </Drawer>
    );
}
