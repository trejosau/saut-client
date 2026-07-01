"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/core/cart/context";
import { formatCurrencyMXN, normalizeCartQuantity } from "@/core/cart/cart-utils";

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

    React.useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeCart();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [closeCart, isOpen]);

    const handleCheckout = React.useCallback(() => {
        if (items.length === 0) return;
        closeCart();
        router.push("/checkout");
    }, [closeCart, items.length, router]);

    return (
        <div
            className={[
                "fixed inset-0 z-[120] transition",
                isOpen ? "pointer-events-auto" : "pointer-events-none",
            ].join(" ")}
            aria-hidden={!isOpen}
        >
            <button
                type="button"
                onClick={closeCart}
                className={[
                    "absolute inset-0 bg-[rgba(8,10,13,.38)] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0",
                ].join(" ")}
                aria-label="Cerrar carrito"
            />

            <aside
                role="dialog"
                aria-label="Carrito"
                aria-modal="true"
                className={[
                    "absolute right-0 top-0 h-full w-full max-w-[440px]",
                    "border-l border-(--border)",
                    "bg-[linear-gradient(180deg,rgba(233,226,196,.98)_0%,rgba(233,226,196,.96)_100%)] backdrop-blur-[12px]",
                    "shadow-[-24px_0_46px_rgba(8,10,13,.18)]",
                    "transition-transform duration-300 ease-out",
                    "flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full",
                ].join(" ")}
            >
                <header className="border-b border-(--border) bg-[rgba(255,255,255,.34)] px-4 py-4 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[14px] font-black tracking-[0.16em] uppercase text-(--text)">
                                Carrito
                            </div>
                            <p className="mt-1 text-[12px] text-(--muted)">
                                {itemCount} {itemCount === 1 ? "producto" : "productos"}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {items.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={clear}
                                    className="h-11 rounded-[7px] border border-(--border) bg-white px-3 text-[10px] font-black uppercase text-(--text) transition hover:bg-(--saut-yellow)"
                                >
                                    Vaciar
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={closeCart}
                                className="grid h-11 w-11 place-items-center rounded-[7px] border border-(--border) bg-white transition hover:bg-(--saut-yellow)"
                                aria-label="Cerrar carrito"
                            >
                                <span className="text-[18px] font-black leading-none">x</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto px-4 py-4 sm:px-5">
                    {items.length === 0 ? (
                        <div className="rounded-[8px] border border-(--border) bg-white p-6 text-center shadow-[0_14px_30px_rgba(8,10,13,.08)]">
                            <p className="text-[13px] font-black tracking-[0.12em] uppercase text-(--text)">
                                Tu carrito está vacío
                            </p>
                            <p className="mt-2 text-[12px] text-(--muted)">
                                Agrega productos desde el catálogo o desde el detalle del producto.
                            </p>
                            <button
                                type="button"
                                onClick={closeCart}
                                className="mt-4 h-11 rounded-[7px] border border-(--saut-black) bg-(--saut-yellow) px-4 text-[11px] font-black uppercase text-(--text) transition hover:bg-(--saut-blue) hover:text-white"
                            >
                                Seguir comprando
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {items.map((item) => {
                                const lineTotal = item.unitPrice * item.quantity;
                                const canDecrease = item.quantity > 1;

                                return (
                                    <li
                                        key={item.lineId}
                                        className="group rounded-[8px] border border-(--border) bg-white p-3 shadow-[0_12px_24px_rgba(8,10,13,.06)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_30px_rgba(8,10,13,.1)]"
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
                                                <p className="truncate text-[12px] font-black tracking-[0.12em] uppercase text-(--text)">
                                                    {item.name}
                                                </p>

                                                {item.selections.length > 0 ? (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {item.selections.map((selection) => (
                                                            <span
                                                                key={`${item.lineId}-${selection.label}`}
                                                                className="inline-flex rounded-full border border-(--border) bg-[rgba(255,217,66,.3)] px-2 py-0.5 text-[10px] font-black tracking-[0.08em] uppercase text-(--saut-navy)"
                                                            >
                                                                {selection.label}: {selection.value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : null}

                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-black tracking-[0.12em] uppercase text-(--muted)">
                                                        Unitario
                                                    </span>
                                                    <span className="text-[12px] font-black tracking-[0.1em] uppercase text-(--saut-navy)">
                                                        ${formatCurrencyMXN(item.unitPrice)}
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-black tracking-[0.12em] uppercase text-(--muted)">
                                                        Total item
                                                    </span>
                                                    <span className="text-[13px] font-black tracking-[0.1em] uppercase text-(--saut-navy)">
                                                        ${formatCurrencyMXN(lineTotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            <div className="flex items-center overflow-hidden rounded-full border border-(--border) bg-(--surface)">
                                                <button
                                                    type="button"
                                                    onClick={() => setItemQuantity(item.lineId, item.quantity - 1)}
                                                    disabled={!canDecrease}
                                                    className={[
                                                        "grid h-11 w-11 place-items-center text-[16px] font-black transition",
                                                        canDecrease
                                                            ? "hover:bg-[rgba(8,10,13,.08)]"
                                                            : "cursor-not-allowed opacity-40",
                                                    ].join(" ")}
                                                    aria-label={`Disminuir cantidad de ${item.name}`}
                                                >
                                                    -
                                                </button>

                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    value={item.quantity}
                                                    onChange={(event) =>
                                                        setItemQuantity(
                                                            item.lineId,
                                                            normalizeCartQuantity(Number(event.target.value))
                                                        )
                                                    }
                                                    className="h-11 w-14 border-x border-(--border) bg-transparent text-center text-sm font-black outline-none focus-visible:bg-[rgba(255,255,255,.72)]"
                                                    aria-label={`Cantidad de ${item.name}`}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => setItemQuantity(item.lineId, item.quantity + 1)}
                                                    className="grid h-11 w-11 place-items-center text-[16px] font-black transition hover:bg-[rgba(8,10,13,.08)]"
                                                    aria-label={`Aumentar cantidad de ${item.name}`}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.lineId)}
                                                className="min-h-11 rounded-full border border-[rgba(219,38,75,.34)] bg-[rgba(219,38,75,.12)] px-4 text-xs font-black uppercase text-[rgba(8,10,13,.78)] transition-colors hover:bg-[rgba(219,38,75,.18)]"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <footer className="border-t border-(--border) bg-[rgba(255,255,255,.34)] px-4 py-4 sm:px-5">
                    <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,.55)] p-3">
                        <div className="flex items-center justify-between text-[11px] font-black tracking-[0.14em] uppercase">
                            <span className="text-(--muted)">Productos</span>
                            <span className="text-(--text)">{itemCount}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[12px] font-black tracking-[0.14em] uppercase">
                            <span className="text-(--muted)">Subtotal</span>
                            <span className="text-(--saut-navy)">${formatCurrencyMXN(subtotal)}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={items.length === 0}
                        onClick={handleCheckout}
                        className={[
                            "mt-3 h-11 w-full rounded-[999px] border border-(--border)",
                            "bg-(--saut-yellow) text-(--saut-black)",
                            "text-[12px] font-black tracking-[0.16em] uppercase",
                            "shadow-[0_16px_34px_rgba(8,10,13,.14)]",
                            "transition hover:-translate-y-[1px] hover:bg-(--saut-blue) hover:text-white",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]",
                            items.length === 0 ? "cursor-not-allowed opacity-60" : "opacity-100",
                        ].join(" ")}
                    >
                        Continuar al pago
                    </button>
                </footer>
            </aside>
        </div>
    );
}
