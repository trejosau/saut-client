"use client";

import * as React from "react";

export type CartSelection = {
    label: string;
    value: string;
};

export type CartPrintArea = {
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
};

export type CartItem = {
    lineId: string;
    key: string;
    lineKeySuffix?: string;
    productId: string;
    slug?: string;
    name: string;
    imageFrontSrc: string;
    imageBackSrc: string;
    imageFrontOverlaySrc?: string;
    imageBackOverlaySrc?: string;
    frontPrintArea?: CartPrintArea;
    backPrintArea?: CartPrintArea;
    imageSrc: string;
    unitPrice: number;
    quantity: number;
    selections: CartSelection[];
    customizerSnapshot?: unknown;
    addedAt: string;
};

export type AddCartItemInput = {
    productId: string;
    lineKeySuffix?: string;
    slug?: string;
    name: string;
    imageFrontSrc?: string;
    imageBackSrc?: string;
    imageFrontOverlaySrc?: string;
    imageBackOverlaySrc?: string;
    frontPrintArea?: CartPrintArea;
    backPrintArea?: CartPrintArea;
    imageSrc: string;
    unitPrice: number;
    quantity?: number;
    selections?: CartSelection[];
    customizerSnapshot?: unknown;
};

export type CartContextValue = {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    isOpen: boolean;
    addItem: (input: AddCartItemInput) => void;
    removeItem: (lineId: string) => void;
    setItemQuantity: (lineId: string, quantity: number) => void;
    clear: () => void;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
};

export const CartContext = React.createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
    const value = React.useContext(CartContext);
    if (!value) {
        throw new Error("useCart debe usarse dentro de CartProvider");
    }
    return value;
}
