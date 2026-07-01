"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/core/cart";

type ProductCardDefaultCartConfig = {
    typeLabel: string;
    garmentType: string;
    garmentModel: string;
    color: string;
    size: string;
    grammageG: number;
    fit: string;
};

export type ProductCardData = {
    id: string;
    name: string;
    priceMXN: number;
    href?: string;
    imageFrontSrc: string;
    imageBackSrc: string;
    frontPrintArea?: { xPct: number; yPct: number; wPct: number; hPct: number };
    backPrintArea?: { xPct: number; yPct: number; wPct: number; hPct: number };
    variants?: Array<{
        id: string;
        label: string;
        frontOverlaySrc?: string;
        backOverlaySrc?: string;
    }>;
    defaultCartConfig?: ProductCardDefaultCartConfig;
    badge?: string;
    imageAlt?: string;
};

type Props = {
    product: ProductCardData;
    onAdd?: (product: ProductCardData) => void;
    className?: string;
};

function formatMXN(amount: number) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function productSlugFromHref(href?: string) {
    return href?.match(/^\/producto\/([^/?#]+)/)?.[1];
}

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolveDefaultCartConfig(product: ProductCardData): ProductCardDefaultCartConfig {
    return product.defaultCartConfig ?? {
        typeLabel: "Oversize",
        garmentType: "tshirt",
        garmentModel: "oversize",
        color: "Negra",
        size: "M",
        grammageG: 240,
        fit: "oversize",
    };
}

function areaToStyle(area?: { xPct: number; yPct: number; wPct: number; hPct: number }) {
    const resolved = area ?? { xPct: 34, yPct: 25, wPct: 32, hPct: 34 };
    return {
        left: `${resolved.xPct}%`,
        top: `${resolved.yPct}%`,
        width: `${resolved.wPct}%`,
        height: `${resolved.hPct}%`,
    } as React.CSSProperties;
}

export default function ProductCard({ product, onAdd, className }: Props) {
    const { addItem } = useCart();
    const variants = product.variants ?? [];
    const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(
        variants[0]?.id ?? null
    );
    const [previewVariantId, setPreviewVariantId] = React.useState<string | null>(null);

    React.useEffect(() => {
        setSelectedVariantId(product.variants?.[0]?.id ?? null);
        setPreviewVariantId(null);
    }, [product.id, product.variants]);

    const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
    const activeVariant =
        variants.find((variant) => variant.id === previewVariantId) ?? selectedVariant;

    const handleAdd = React.useCallback(() => {
        if (onAdd) {
            onAdd(product);
            return;
        }

        const publicationSlug = productSlugFromHref(product.href);
        const config = resolveDefaultCartConfig(product);
        const normalizedSize = config.size.trim().toUpperCase() || "M";
        const designVariantId =
            selectedVariant && isUuid(selectedVariant.id) ? selectedVariant.id : null;

        addItem({
            productId: product.id,
            slug: publicationSlug,
            name: product.name,
            imageSrc: product.imageFrontSrc,
            imageFrontSrc: product.imageFrontSrc,
            imageBackSrc: product.imageBackSrc,
            imageFrontOverlaySrc: selectedVariant?.frontOverlaySrc || undefined,
            imageBackOverlaySrc: selectedVariant?.backOverlaySrc || undefined,
            frontPrintArea: product.frontPrintArea,
            backPrintArea: product.backPrintArea,
            unitPrice: product.priceMXN,
            quantity: 1,
            selections: [
                { label: "Tipo", value: config.typeLabel },
                { label: "Gramaje", value: `${config.grammageG} Gr` },
                { label: "Talla", value: normalizedSize },
                { label: "Color", value: config.color },
                ...(selectedVariant?.label
                    ? [{ label: "Diseño", value: selectedVariant.label }]
                    : []),
            ],
            customizerSnapshot: publicationSlug
                ? {
                      kind: "predesigned_v1",
                      publication_id: product.id,
                      publication_slug: publicationSlug,
                      design_variant_id: designVariantId,
                      garment_type: config.garmentType,
                      garment_model: config.garmentModel,
                      color: config.color,
                      size: normalizedSize,
                      grammage_g: config.grammageG,
                      fit: config.fit,
                      frozen_at: new Date().toISOString(),
                  }
                : undefined,
        });
    }, [addItem, onAdd, product, selectedVariant]);

    return (
        <article
            style={{ contentVisibility: "auto", containIntrinsicSize: "320px 470px" }}
            className={[
                "group flex h-full flex-col overflow-hidden rounded-[8px] border border-(--border) bg-white transition duration-200",
                "hover:-translate-y-1 hover:border-[rgba(5,122,168,.34)] hover:shadow-[0_18px_40px_rgba(8,10,13,.12)]",
                className ?? "",
            ].join(" ")}
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-(--surface-3)">
                {product.href ? (
                    <Link
                        href={product.href}
                        aria-label={`Ver ${product.name}`}
                        className="absolute inset-0 z-10"
                    />
                ) : null}

                <div className="absolute inset-0 transition duration-300 group-hover:scale-[1.025] group-hover:opacity-0">
                    <img
                        src={product.imageFrontSrc}
                        alt={product.imageAlt ?? product.name}
                        loading="lazy"
                        decoding="async"
                        width={720}
                        height={900}
                        draggable={false}
                        className="h-full w-full object-contain p-5"
                    />
                    {activeVariant?.frontOverlaySrc ? (
                        <div className="absolute" style={areaToStyle(product.frontPrintArea)}>
                            <img src={activeVariant.frontOverlaySrc} alt="" className="h-full w-full object-contain" />
                        </div>
                    ) : null}
                </div>

                <div className="absolute inset-0 scale-[1.025] opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                    <img
                        src={product.imageBackSrc}
                        alt={`${product.imageAlt ?? product.name}, vista posterior`}
                        loading="lazy"
                        decoding="async"
                        width={720}
                        height={900}
                        draggable={false}
                        className="h-full w-full object-contain p-5"
                    />
                    {activeVariant?.backOverlaySrc ? (
                        <div className="absolute" style={areaToStyle(product.backPrintArea)}>
                            <img src={activeVariant.backOverlaySrc} alt="" className="h-full w-full object-contain" />
                        </div>
                    ) : null}
                </div>

                {product.badge ? (
                    <span className="absolute left-3 top-3 z-20 bg-(--saut-navy) px-2.5 py-1.5 text-[10px] font-black uppercase text-white">
                        {product.badge}
                    </span>
                ) : null}

                <button
                    type="button"
                    onClick={handleAdd}
                    aria-label={`Agregar ${product.name} al carrito`}
                    title="Agregar al carrito"
                    className="absolute bottom-3 right-3 z-20 grid h-11 w-11 place-items-center rounded-[8px] border border-(--saut-black) bg-(--saut-yellow) text-(--saut-black) shadow-[0_8px_20px_rgba(8,10,13,.16)] transition hover:bg-(--saut-blue) hover:text-white"
                >
                    <ShoppingBag size={19} strokeWidth={2.1} />
                </button>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h3 className="min-h-10 text-[13px] font-extrabold leading-5 uppercase text-(--saut-black)">
                    {product.name}
                </h3>

                {variants.length > 1 ? (
                    <div className="mt-3 flex min-h-8 flex-wrap gap-1.5" aria-label="Variantes de diseño">
                        {variants.map((variant) => {
                            const selected = selectedVariant?.id === variant.id;
                            const preview = variant.frontOverlaySrc || variant.backOverlaySrc;
                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onMouseEnter={() => setPreviewVariantId(variant.id)}
                                    onMouseLeave={() => setPreviewVariantId(null)}
                                    onFocus={() => setPreviewVariantId(variant.id)}
                                    onBlur={() => setPreviewVariantId(null)}
                                    onClick={() => setSelectedVariantId(variant.id)}
                                    title={variant.label}
                                    aria-label={`Diseño ${variant.label}`}
                                    aria-pressed={selected}
                                    className={[
                                        "grid h-8 w-8 place-items-center overflow-hidden rounded-[6px] border bg-(--surface-2)",
                                        selected ? "border-(--saut-blue) ring-2 ring-[rgba(5,122,168,.18)]" : "border-(--border)",
                                    ].join(" ")}
                                >
                                    {preview ? (
                                        <img src={preview} alt="" className="h-[72%] w-[72%] object-contain" />
                                    ) : (
                                        <span className="text-[8px] font-black">{variant.label.slice(0, 2)}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : null}

                <p className="mt-auto pt-4 text-base font-black text-(--saut-navy)">
                    {formatMXN(product.priceMXN)} <span className="text-[11px] text-(--muted)">MXN</span>
                </p>
            </div>
        </article>
    );
}
