// app/layout.tsx

import type { Metadata } from "next";
import { Archivo_Black, Rethink_Sans } from "next/font/google";
import { CartProvider } from "@/core/cart";
import { ToastProvider } from "@/core/design-system/feedback/ToastHost";
import { ScrollMotion } from "@/core/motion/ScrollMotion";
import "./globals.css";

const rethinkSans = Rethink_Sans({
    variable: "--font-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
});

const archivoBlack = Archivo_Black({
    variable: "--font-display",
    subsets: ["latin"],
    display: "swap",
    weight: "400",
});

export const metadata: Metadata = {
    title: {
        default: "SAUT Street Wear",
        template: "%s | SAUT Street Wear",
    },
    description: "Streetwear y prendas personalizadas hechas en Mexico.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
        <body
            suppressHydrationWarning
            className={`${rethinkSans.variable} ${archivoBlack.variable} antialiased`}
        >
        <ToastProvider>
            <CartProvider>
                <ScrollMotion>{children}</ScrollMotion>
            </CartProvider>
        </ToastProvider>
        </body>
        </html>
    );
}
