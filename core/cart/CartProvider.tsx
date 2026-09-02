"use client";

import * as React from "react";

import { CartDrawer } from "@/core/cart/CartDrawer";
import {
    type AddCartItemInput,
    type CartContextValue,
    type CartItem,
    CartContext,
} from "@/core/cart/context";

const STORAGE_KEY = "saut.cart.v1";

type StoredCart = {
    items?: CartItem[];
};

function normalizeStoredItem(item: CartItem): CartItem {
    const front = item.imageFrontSrc ?? item.imageSrc;
    const back = item.imageBackSrc ?? front;
    return {
        ...item,
        imageFrontSrc: front,
        imageBackSrc: back,
        imageSrc: item.imageSrc ?? front,
        lineKeySuffix: item.lineKeySuffix,
        customizerSnapshot: item.customizerSnapshot,
    };
}

function createLineId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeQuantity(value: number | undefined) {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.floor(value ?? 1));
}

function normalizeSelections(input: AddCartItemInput["selections"]) {
    return (input ?? [])
        .map((selection) => ({
            label: selection.label.trim(),
            value: selection.value.trim(),
        }))
        .filter((selection) => selection.label.length > 0 && selection.value.length > 0);
}

function createLineKey(
    productId: string,
    selections: { label: string; value: string }[],
    suffix?: string
) {
    const normalized = [...selections]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((selection) => `${selection.label}:${selection.value}`)
        .join("|");
    const base = `${productId}::${normalized}`;
    if (!suffix || suffix.trim().length === 0) return base;
    return `${base}::${suffix.trim()}`;
}

function readStorage(): CartItem[] {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as StoredCart;
        if (!parsed.items || !Array.isArray(parsed.items)) return [];
        return parsed.items
            .filter((item) => item && typeof item === "object")
            .map((item) => normalizeStoredItem(item as CartItem));
    } catch {
        return [];
    }
}

function writeStorage(items: CartItem[]) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
    } catch {
        // noop
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = React.useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = React.useState(false);
    const [hydrated, setHydrated] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled) return;
            setItems(readStorage());
            setHydrated(true);
        });
        return () => { cancelled = true; };
    }, []);

    React.useEffect(() => {
        if (!hydrated) return;
        writeStorage(items);
    }, [items, hydrated]);

    const addItem = React.useCallback((input: AddCartItemInput) => {
        const quantity = normalizeQuantity(input.quantity);
        const selections = normalizeSelections(input.selections);
        const key = createLineKey(input.productId, selections, input.lineKeySuffix);
        const front = input.imageFrontSrc ?? input.imageSrc;
        const back = input.imageBackSrc ?? front;

        setItems((prev) => {
            const existing = prev.find((item) => item.key === key);
            if (existing) {
                return prev.map((item) =>
                    item.key === key
                        ? {
                              ...item,
                              quantity: item.quantity + quantity,
                              imageSrc: front,
                              imageFrontSrc: front,
                              imageBackSrc: back,
                              imageFrontOverlaySrc: input.imageFrontOverlaySrc,
                              imageBackOverlaySrc: input.imageBackOverlaySrc,
                              frontPrintArea: input.frontPrintArea,
                              backPrintArea: input.backPrintArea,
                              customizerSnapshot: input.customizerSnapshot,
                          }
                        : item
                );
            }

            const nextItem: CartItem = {
                lineId: createLineId(),
                key,
                lineKeySuffix: input.lineKeySuffix,
                productId: input.productId,
                slug: input.slug,
                name: input.name,
                imageSrc: front,
                imageFrontSrc: front,
                imageBackSrc: back,
                imageFrontOverlaySrc: input.imageFrontOverlaySrc,
                imageBackOverlaySrc: input.imageBackOverlaySrc,
                frontPrintArea: input.frontPrintArea,
                backPrintArea: input.backPrintArea,
                unitPrice: input.unitPrice,
                quantity,
                selections,
                customizerSnapshot: input.customizerSnapshot,
                addedAt: new Date().toISOString(),
            };

            return [nextItem, ...prev];
        });

        setIsOpen(true);
    }, []);

    const removeItem = React.useCallback((lineId: string) => {
        setItems((prev) => prev.filter((item) => item.lineId !== lineId));
    }, []);

    const setItemQuantity = React.useCallback((lineId: string, quantity: number) => {
        const nextQty = normalizeQuantity(quantity);
        setItems((prev) =>
            prev.map((item) =>
                item.lineId === lineId ? { ...item, quantity: nextQty } : item
            )
        );
    }, []);

    const clear = React.useCallback(() => setItems([]), []);
    const openCart = React.useCallback(() => setIsOpen(true), []);
    const closeCart = React.useCallback(() => setIsOpen(false), []);
    const toggleCart = React.useCallback(() => setIsOpen((prev) => !prev), []);

    const itemCount = React.useMemo(
        () => items.reduce((acc, item) => acc + item.quantity, 0),
        [items]
    );

    const subtotal = React.useMemo(
        () => items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
        [items]
    );

    const value = React.useMemo<CartContextValue>(
        () => ({
            items,
            itemCount,
            subtotal,
            isOpen,
            addItem,
            removeItem,
            setItemQuantity,
            clear,
            openCart,
            closeCart,
            toggleCart,
        }),
        [
            items,
            itemCount,
            subtotal,
            isOpen,
            addItem,
            removeItem,
            setItemQuantity,
            clear,
            openCart,
            closeCart,
            toggleCart,
        ]
    );

    return (
        <CartContext.Provider value={value}>
            {children}
            <CartDrawer />
        </CartContext.Provider>
    );
}
