"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";

import { useCart } from "@/core/cart";
import { RadioTiles, type RadioTileOption } from "@/core/design-system";
import type {
    CatalogDesign,
    CatalogMockup,
    CatalogPublication,
    CatalogVariant,
} from "@/modules/catalog/client/api";
import { resolveGlobalStockPreset } from "@/modules/dashboard/inventory/constants/global-stock";

type ProductConfiguratorProps = {
    publication: CatalogPublication;
    design: CatalogDesign;
    variants: CatalogVariant[];
    mockups: CatalogMockup[];
};

type PreviewMode = "front" | "back";
type SizeValue = "s" | "m" | "l" | "xl" | "2xl";
type TypeUi = "oversize" | "manga_larga_oversize" | "hoodie" | "regular";
type Gramaje = "200" | "220" | "240" | "300" | "400";

type ColorOption = {
    value: string;
    label: string;
    hex: string;
    imageSrc?: string;
};

type PrintArea = {
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
};

const EMPTY_OVERSIZE_URL = "/tiles/oversize-negra.webp";
const EMPTY_LONG_SLEEVE_URL = "/tiles/manga-larga-negra.webp";
const EMPTY_HOODIE_URL = "/tiles/hoodie-semi-orversize-negra.webp";
const EMPTY_REGULAR_URL = "/tiles/regular-negra.webp";

const FRONT_PRINT_AREA_BY_GARMENT: Record<string, PrintArea> = {
    oversize: { xPct: 34, yPct: 25, wPct: 32, hPct: 34 },
    long_sleeve_oversize: { xPct: 34, yPct: 24, wPct: 32, hPct: 34 },
    long_sleeve_regular: { xPct: 34, yPct: 25, wPct: 32, hPct: 34 },
    regular: { xPct: 35, yPct: 26, wPct: 30, hPct: 32 },
    hoodie: { xPct: 32, yPct: 23, wPct: 36, hPct: 36 },
    jogger: { xPct: 38, yPct: 29, wPct: 24, hPct: 26 },
};

const BACK_PRINT_AREA_BY_GARMENT: Record<string, PrintArea> = {
    oversize: { xPct: 32, yPct: 23, wPct: 36, hPct: 36 },
    long_sleeve_oversize: { xPct: 32, yPct: 22, wPct: 36, hPct: 36 },
    long_sleeve_regular: { xPct: 32, yPct: 23, wPct: 36, hPct: 36 },
    regular: { xPct: 33, yPct: 24, wPct: 34, hPct: 34 },
    hoodie: { xPct: 31, yPct: 21, wPct: 38, hPct: 38 },
    jogger: { xPct: 38, yPct: 31, wPct: 24, hPct: 26 },
};

const DEFAULT_FRONT_PRINT_AREA: PrintArea = { xPct: 34, yPct: 25, wPct: 32, hPct: 34 };
const DEFAULT_BACK_PRINT_AREA: PrintArea = { xPct: 32, yPct: 23, wPct: 36, hPct: 36 };

const OVERSIZE_COLORS: ColorOption[] = [
    { value: "negra", label: "Negra", hex: "#141412", imageSrc: "/tiles/oversize-negra.webp" },
    { value: "blanca", label: "Blanca", hex: "#f6f6f6", imageSrc: "/tiles/oversize-blanca.webp" },
    { value: "chocolate", label: "Chocolate", hex: "#603519", imageSrc: "/tiles/oversize-chocolate.webp" },
    { value: "crudo", label: "Crudo", hex: "#fbf9ea", imageSrc: "/tiles/oversize-crudo.webp" },
    { value: "hueso", label: "Hueso", hex: "#fbf2d5", imageSrc: "/tiles/oversize-hueso.webp" },
    { value: "gris-azulada", label: "Gris Azulada", hex: "#657d90", imageSrc: "/tiles/oversize-gris-azulada.webp" },
    { value: "gris-grafito", label: "Gris Grafito", hex: "#4e5051", imageSrc: "/tiles/oversize-gris-grafito.webp" },
    { value: "verde-olivo", label: "Verde Olivo", hex: "#57571e", imageSrc: "/tiles/oversize-verde-olivo.webp" },
    { value: "beige", label: "Beige", hex: "#d3b17d", imageSrc: "/tiles/oversize-beige.webp" },
    { value: "rojo", label: "Rojo", hex: "#d4120f", imageSrc: "/tiles/oversize-rojo.webp" },
    { value: "azul-rey", label: "Azul Rey", hex: "#0747a6", imageSrc: "/tiles/oversize-azul-rey.webp" },
    { value: "petroleo", label: "Petroleo", hex: "#114352", imageSrc: "/tiles/oversize-petroleo.webp" },
    { value: "rosa-baby", label: "Rosa Baby", hex: "#ffd2e4", imageSrc: "/tiles/oversize-rosa-baby.webp" },
    { value: "verde-militar", label: "Verde Militar", hex: "#536f28", imageSrc: "/tiles/oversize-verde-militar.webp" },
    { value: "vino", label: "Vino", hex: "#6f0d1c", imageSrc: "/tiles/oversize-vino.webp" },
    { value: "azul-cielo", label: "Azul Cielo", hex: "#aed4e9", imageSrc: "/tiles/oversize-azul-cielo.webp" },
    { value: "arena", label: "Arena", hex: "#e6cbad", imageSrc: "/tiles/oversize-arena.webp" },
];

const LONG_SLEEVE_COLORS: ColorOption[] = [
    { value: "negra", label: "Negra", hex: "#101010", imageSrc: "/tiles/manga-larga-negra.webp" },
    { value: "blanca", label: "Blanca", hex: "#f8f8f8", imageSrc: "/tiles/manga-larga-blanca.webp" },
    { value: "beige", label: "Beige", hex: "#e0b984", imageSrc: "/tiles/manga-larga-beige.webp" },
    { value: "gris-grafito", label: "Gris Grafito", hex: "#505352", imageSrc: "/tiles/manga-larga-gris-grafito.webp" },
];

const HOODIE_COLORS: ColorOption[] = [
    { value: "negra", label: "Negra", hex: "#1b1b19", imageSrc: "/tiles/hoodie-oversize-negra.webp" },
];

const REGULAR_COLORS: ColorOption[] = [
    { value: "negra", label: "Negra", hex: "#131311", imageSrc: "/tiles/regular-negra.webp" },
];

const TYPE_LABELS: Record<TypeUi, string> = {
    oversize: "Oversize",
    manga_larga_oversize: "Manga Larga",
    hoodie: "Hoodie",
    regular: "Regular",
};

const GRAMAJES_BY_TYPE: Record<TypeUi, Gramaje[]> = {
    oversize: ["240", "220", "200"],
    manga_larga_oversize: ["220"],
    hoodie: ["300", "400"],
    regular: ["200"],
};

const SIZES_BY_TYPE_GRAMAJE: Record<TypeUi, Record<Gramaje, SizeValue[]>> = {
    oversize: {
        "240": ["s", "m", "l", "xl", "2xl"],
        "220": ["s", "m", "l", "xl", "2xl"],
        "200": ["s", "m", "l", "xl"],
        "300": [],
        "400": [],
    },
    manga_larga_oversize: {
        "240": [],
        "220": ["s", "m", "l", "xl", "2xl"],
        "200": [],
        "300": [],
        "400": [],
    },
    hoodie: {
        "240": [],
        "220": [],
        "200": [],
        "300": ["s", "m", "l", "xl", "2xl"],
        "400": ["s", "m", "l", "xl", "2xl"],
    },
    regular: {
        "240": [],
        "220": [],
        "200": ["s", "m", "l", "xl"],
        "300": [],
        "400": [],
    },
};

const COLOR_VALUES_BY_TYPE_GRAMAJE: Record<TypeUi, Record<Gramaje, string[]>> = {
    oversize: {
        "240": ["negra", "blanca", "chocolate", "crudo", "hueso", "gris-azulada"],
        "220": ["negra", "blanca", "chocolate", "gris-grafito", "verde-olivo", "beige"],
        "200": [
            "negra",
            "blanca",
            "chocolate",
            "gris-grafito",
            "rojo",
            "azul-rey",
            "petroleo",
            "rosa-baby",
            "verde-militar",
            "vino",
            "azul-cielo",
            "arena",
        ],
        "300": [],
        "400": [],
    },
    manga_larga_oversize: {
        "240": [],
        "220": ["negra", "blanca", "beige", "gris-grafito"],
        "200": [],
        "300": [],
        "400": [],
    },
    hoodie: {
        "240": [],
        "220": [],
        "200": [],
        "300": ["negra"],
        "400": ["negra"],
    },
    regular: {
        "240": [],
        "220": [],
        "200": ["negra"],
        "300": [],
        "400": [],
    },
};

const DEFAULT_DESIGN_FALLBACKS = ["/tiles/design-1.webp", "/tiles/design-2.webp", "/tiles/design-3.webp", "/tiles/design-4.webp"];
const INVENTORY_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const MAX_INVENTORY_PAGE_SIZE = 200;
const LOW_STOCK_LIMIT = 8;

type InventoryItemRow = {
    garment_type: string;
    garment_model: string;
    color: string;
    size: string;
    grammage_g: number;
    fit: string;
    quantity: number;
};

type InventoryItemsResponse = {
    items?: unknown[];
};

type StockLoadState = "loading" | "ready" | "error";

type SnapshotStockShape = {
    garment_type?: string | null;
    garment_model?: string | null;
    color?: string | null;
    size?: string | null;
    grammage_g?: number | null;
    fit?: string | null;
};

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

function getSizePreset(publication: CatalogPublication): SizeValue[] {
    if (publication.garment_type === "jogger") return ["s", "m", "l", "xl"];
    if (publication.garment_model === "regular") return ["s", "m", "l", "xl"];
    return ["s", "m", "l", "xl", "2xl"];
}

function clampQty(value: number) {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.floor(value));
}

function clampToEnabled<T extends string>(
    value: T,
    list: T[],
    isDisabled: (candidate: T) => boolean,
    fallback: T
): T {
    if (list.length === 0) return fallback;
    if (list.includes(value) && !isDisabled(value)) return value;
    const firstEnabled = list.find((candidate) => !isDisabled(candidate));
    return firstEnabled ?? list[0] ?? fallback;
}

function normalizeSizeToken(value?: string | null): string {
    return (value ?? "").trim().toUpperCase();
}

function parseInteger(value: unknown): number | null {
    const parsed =
        typeof value === "number"
            ? value
            : typeof value === "string"
              ? Number(value)
              : Number.NaN;
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.floor(parsed));
}

function parseInventoryItemRow(value: unknown): InventoryItemRow | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;

    const garmentType =
        typeof row.garment_type === "string" && row.garment_type.trim().length > 0
            ? row.garment_type.trim()
            : "";
    const garmentModel =
        typeof row.garment_model === "string" && row.garment_model.trim().length > 0
            ? row.garment_model.trim()
            : "";
    const color =
        typeof row.color === "string" && row.color.trim().length > 0
            ? row.color.trim()
            : "";
    const size =
        typeof row.size === "string" && row.size.trim().length > 0
            ? normalizeSizeToken(row.size)
            : "";
    const fit =
        typeof row.fit === "string" && row.fit.trim().length > 0
            ? row.fit.trim()
            : "";
    const grammage = parseInteger(row.grammage_g);
    const quantity = parseInteger(row.quantity);

    if (!garmentType || !garmentModel || !color || !size || grammage === null || quantity === null) {
        return null;
    }

    return {
        garment_type: garmentType,
        garment_model: garmentModel,
        color,
        size,
        grammage_g: grammage,
        fit,
        quantity,
    };
}

function parseSnapshotStock(value: unknown): SnapshotStockShape | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    const grammage = parseInteger(row.grammage_g);

    return {
        garment_type: typeof row.garment_type === "string" ? row.garment_type : null,
        garment_model: typeof row.garment_model === "string" ? row.garment_model : null,
        color: typeof row.color === "string" ? row.color : null,
        size: typeof row.size === "string" ? row.size : null,
        grammage_g: grammage,
        fit: typeof row.fit === "string" ? row.fit : null,
    };
}

function presetSizeKey(presetId: string, size: string): string {
    return `${presetId}::${normalizeSizeToken(size)}`;
}

function presetIdFromSizeKey(key: string): string {
    const marker = key.indexOf("::");
    if (marker < 0) return key;
    return key.slice(0, marker);
}

function inferTypeUi(publication: CatalogPublication): TypeUi {
    const model = (publication.garment_model ?? "").toLowerCase();
    const type = (publication.garment_type ?? "").toLowerCase();
    if (model.includes("long_sleeve")) return "manga_larga_oversize";
    if (model.includes("regular")) return "regular";
    if (model.includes("hoodie") || type.includes("hoodie")) return "hoodie";
    return "oversize";
}

function inferFitForType(typeUi: TypeUi, grammage: Gramaje): string {
    if (typeUi === "hoodie") {
        return grammage === "400" ? "oversize" : "semi-oversize";
    }
    if (typeUi === "regular") return "regular";
    return "oversize";
}

function mapTypeToOrderModel(typeUi: TypeUi): { garmentType: string; garmentModel: string } {
    if (typeUi === "hoodie") {
        return { garmentType: "hoodie", garmentModel: "hoodie" };
    }
    if (typeUi === "manga_larga_oversize") {
        return { garmentType: "tshirt", garmentModel: "long_sleeve_oversize" };
    }
    if (typeUi === "regular") {
        return { garmentType: "tshirt", garmentModel: "regular" };
    }
    return { garmentType: "tshirt", garmentModel: "oversize" };
}

function baseColorsByType(typeUi: TypeUi): ColorOption[] {
    switch (typeUi) {
        case "manga_larga_oversize":
            return LONG_SLEEVE_COLORS;
        case "hoodie":
            return HOODIE_COLORS;
        case "regular":
            return REGULAR_COLORS;
        case "oversize":
        default:
            return OVERSIZE_COLORS;
    }
}

function resolveColorPresetForTypeAndGramaje(
    typeUi: TypeUi,
    gramaje: Gramaje,
    publicationFallback: ColorOption[]
): ColorOption[] {
    const source = baseColorsByType(typeUi);
    const allowed = COLOR_VALUES_BY_TYPE_GRAMAJE[typeUi][gramaje] ?? [];
    const filtered = source.filter((item) => allowed.includes(item.value));
    if (filtered.length) return filtered;
    if (source.length) return source;
    return publicationFallback;
}

function hexToRgb(hex?: string) {
    if (!hex) return null;
    const h = hex.replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    if (full.length !== 6) return null;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b };
}

function shadowFromHex(hex?: string, alpha = 0.35) {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(8,10,13,${alpha})`;
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function OutOfStockBadge() {
    return (
        <>
            <span
                className={[
                    "absolute left-1/2 top-[-1px] z-[3] -translate-x-1/2 px-1",
                    "bg-[rgba(233,226,196,.96)] text-[7px] sm:text-[8px] leading-none",
                    "font-black tracking-[0.08em] uppercase text-[rgba(200,35,40,.98)] whitespace-nowrap",
                ].join(" ")}
            >
                SIN
            </span>
            <span
                className={[
                    "absolute left-1/2 bottom-[-1px] z-[3] -translate-x-1/2 px-1",
                    "bg-[rgba(233,226,196,.96)] text-[7px] sm:text-[8px] leading-none",
                    "font-black tracking-[0.08em] uppercase text-[rgba(200,35,40,.98)] whitespace-nowrap",
                ].join(" ")}
            >
                STOCK
            </span>
        </>
    );
}

function resolveStockUnits(publication: CatalogPublication): number | null {
    const candidates = [
        publication.stock_qty,
        publication.stock_units,
        publication.inventory_qty,
    ];
    for (const candidate of candidates) {
        if (Number.isFinite(candidate)) {
            return Math.max(0, Math.floor(Number(candidate)));
        }
    }
    return null;
}

function toPct(value: number | null | undefined, fallback: number) {
    return Number.isFinite(value) ? Number(value) : fallback;
}

function areaToStyle(area: PrintArea): React.CSSProperties {
    return {
        left: `${area.xPct}%`,
        top: `${area.yPct}%`,
        width: `${area.wPct}%`,
        height: `${area.hPct}%`,
    };
}

function getGarmentKey(publication: CatalogPublication) {
    return publication.garment_model ?? publication.garment_type ?? "oversize";
}

function getColorPreset(publication: CatalogPublication): ColorOption[] {
    if (publication.garment_type === "hoodie") return HOODIE_COLORS;
    if (
        publication.garment_model === "long_sleeve_oversize" ||
        publication.garment_model === "long_sleeve_regular"
    ) {
        return LONG_SLEEVE_COLORS;
    }
    if (publication.garment_model === "regular") return REGULAR_COLORS;
    return OVERSIZE_COLORS;
}

function emptyGarmentBaseUrl(publication: Pick<CatalogPublication, "garment_type" | "garment_model">) {
    const model = (publication.garment_model ?? "").toLowerCase();
    const type = (publication.garment_type ?? "").toLowerCase();
    if (model.includes("long_sleeve")) return EMPTY_LONG_SLEEVE_URL;
    if (model.includes("regular")) return EMPTY_REGULAR_URL;
    if (model.includes("hoodie") || type.includes("hoodie")) return EMPTY_HOODIE_URL;
    return EMPTY_OVERSIZE_URL;
}

function toVariantOptions(
    variants: CatalogVariant[],
    design: CatalogDesign,
    previewMode: PreviewMode
): RadioTileOption[] {
    const useBack = previewMode === "back";

    if (variants.length === 0) {
        const fallbackImage = useBack
            ? design.default_back_design_url ?? design.default_front_design_url ?? DEFAULT_DESIGN_FALLBACKS[0]
            : design.default_front_design_url ?? design.default_back_design_url ?? DEFAULT_DESIGN_FALLBACKS[0];

        return [
            {
                value: "design-main",
                label: "MAIN",
                sublabel: design.name,
                imageSrc: fallbackImage,
                accentHex: "#057aa8",
            },
        ];
    }

    return variants.map((variant, index) => ({
        value: variant.id,
        label: variant.code,
        sublabel: variant.label,
        imageSrc: useBack
            ? variant.back_design_url ??
              variant.front_design_url ??
              variant.public_preview_url ??
              DEFAULT_DESIGN_FALLBACKS[index % DEFAULT_DESIGN_FALLBACKS.length]
            : variant.front_design_url ??
              variant.public_preview_url ??
              variant.back_design_url ??
              DEFAULT_DESIGN_FALLBACKS[index % DEFAULT_DESIGN_FALLBACKS.length],
        accentHex: "#057aa8",
    }));
}

function getFrontPrintArea(publication: CatalogPublication): PrintArea {
    const key = getGarmentKey(publication);
    const fallback = FRONT_PRINT_AREA_BY_GARMENT[key] ?? FRONT_PRINT_AREA_BY_GARMENT[publication.garment_type] ?? DEFAULT_FRONT_PRINT_AREA;
    return {
        xPct: toPct(publication.front_print_x_pct, fallback.xPct),
        yPct: toPct(publication.front_print_y_pct, fallback.yPct),
        wPct: toPct(publication.front_print_w_pct, fallback.wPct),
        hPct: toPct(publication.front_print_h_pct, fallback.hPct),
    };
}

function getBackPrintArea(publication: CatalogPublication): PrintArea {
    const key = getGarmentKey(publication);
    const fallback = BACK_PRINT_AREA_BY_GARMENT[key] ?? BACK_PRINT_AREA_BY_GARMENT[publication.garment_type] ?? DEFAULT_BACK_PRINT_AREA;
    return {
        xPct: toPct(publication.back_print_x_pct, fallback.xPct),
        yPct: toPct(publication.back_print_y_pct, fallback.yPct),
        wPct: toPct(publication.back_print_w_pct, fallback.wPct),
        hPct: toPct(publication.back_print_h_pct, fallback.hPct),
    };
}

export default function ProductConfigurator({
    publication,
    design,
    variants,
    mockups,
}: ProductConfiguratorProps) {
    const { addItem, items } = useCart();

    const initialTypeUi = React.useMemo(() => inferTypeUi(publication), [publication]);
    const [typeUi, setTypeUi] = React.useState<TypeUi>(initialTypeUi);
    const [gramaje, setGramaje] = React.useState<Gramaje>(GRAMAJES_BY_TYPE[initialTypeUi][0] ?? "240");

    const publicationSizePreset = React.useMemo(() => getSizePreset(publication), [publication]);
    const publicationColorPreset = React.useMemo(() => getColorPreset(publication), [publication]);
    const gramajePreset = React.useMemo(() => GRAMAJES_BY_TYPE[typeUi] ?? ["240"], [typeUi]);
    const sizePreset = React.useMemo(() => {
        const preset = SIZES_BY_TYPE_GRAMAJE[typeUi][gramaje] ?? [];
        return preset.length ? preset : publicationSizePreset;
    }, [gramaje, publicationSizePreset, typeUi]);
    const colorPreset = React.useMemo(() => {
        return resolveColorPresetForTypeAndGramaje(typeUi, gramaje, publicationColorPreset);
    }, [gramaje, publicationColorPreset, typeUi]);

    const [activePreview, setActivePreview] = React.useState<PreviewMode>("front");
    const designOptions = React.useMemo(
        () => toVariantOptions(variants, design, activePreview === "back" ? "back" : "front"),
        [activePreview, design, variants]
    );

    const [size, setSize] = React.useState<SizeValue>(sizePreset[1] ?? sizePreset[0] ?? "m");
    const [color, setColor] = React.useState(colorPreset[0]?.value ?? "negra");
    const [designId, setDesignId] = React.useState(designOptions[0]?.value ?? "design-main");
    const [quantity, setQuantity] = React.useState(1);
    const [justAdded, setJustAdded] = React.useState(false);
    const [infoOpen, setInfoOpen] = React.useState(false);
    const [inventoryRows, setInventoryRows] = React.useState<InventoryItemRow[]>([]);
    const [stockState, setStockState] = React.useState<StockLoadState>("loading");
    const [stockError, setStockError] = React.useState<string | null>(null);

    const orderModel = React.useMemo(() => mapTypeToOrderModel(typeUi), [typeUi]);

    React.useEffect(() => {
        const params = new URLSearchParams({
            garment_type: orderModel.garmentType,
            garment_model: orderModel.garmentModel,
            limit: String(MAX_INVENTORY_PAGE_SIZE),
            offset: "0",
        });
        const controller = new AbortController();

        setStockState("loading");
        setStockError(null);
        setInventoryRows([]);

        void (async () => {
            try {
                const response = await fetch(
                    `${INVENTORY_API_BASE_URL}/inventory/items?${params.toString()}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        signal: controller.signal,
                    }
                );
                if (!response.ok) {
                    throw new Error(`Stock request failed (${response.status})`);
                }
                const payload = (await response.json()) as InventoryItemsResponse;
                const nextRows = Array.isArray(payload.items)
                    ? payload.items
                          .map((item) => parseInventoryItemRow(item))
                          .filter((item): item is InventoryItemRow => item !== null)
                    : [];
                setInventoryRows(nextRows);
                setStockState("ready");
            } catch (error) {
                if (controller.signal.aborted) return;
                setInventoryRows([]);
                setStockState("error");
                setStockError(
                    error instanceof Error ? error.message : "No se pudo validar stock real."
                );
            }
        })();

        return () => controller.abort();
    }, [orderModel.garmentModel, orderModel.garmentType]);

    const stockByPreset = React.useMemo(() => {
        const inventoryByPresetSize = new Map<string, number>();
        const reservedByPresetSize = new Map<string, number>();

        for (const row of inventoryRows) {
            const preset = resolveGlobalStockPreset({
                garmentType: row.garment_type,
                garmentModel: row.garment_model,
                color: row.color,
                grammageG: row.grammage_g,
                fit: row.fit,
            });
            if (!preset) continue;
            const key = presetSizeKey(preset.id, row.size);
            inventoryByPresetSize.set(
                key,
                (inventoryByPresetSize.get(key) ?? 0) + Math.max(0, row.quantity)
            );
        }

        for (const item of items) {
            const snapshot = parseSnapshotStock(item.customizerSnapshot);
            if (!snapshot) continue;
            const preset = resolveGlobalStockPreset({
                garmentType: snapshot.garment_type,
                garmentModel: snapshot.garment_model,
                color: snapshot.color,
                grammageG: snapshot.grammage_g,
                fit: snapshot.fit,
            });
            if (!preset) continue;
            const sizeToken = normalizeSizeToken(snapshot.size);
            if (!sizeToken) continue;
            const quantityInCart = Math.max(0, Math.floor(item.quantity));
            if (quantityInCart <= 0) continue;
            const key = presetSizeKey(preset.id, sizeToken);
            reservedByPresetSize.set(key, (reservedByPresetSize.get(key) ?? 0) + quantityInCart);
        }

        const availableByPresetSize = new Map<string, number>();
        const availableByPreset = new Map<string, number>();
        for (const [key, inventoryQty] of inventoryByPresetSize.entries()) {
            const reservedQty = reservedByPresetSize.get(key) ?? 0;
            const availableQty = Math.max(0, inventoryQty - reservedQty);
            availableByPresetSize.set(key, availableQty);
            const presetId = presetIdFromSizeKey(key);
            availableByPreset.set(
                presetId,
                (availableByPreset.get(presetId) ?? 0) + availableQty
            );
        }

        return {
            inventoryByPresetSize,
            reservedByPresetSize,
            availableByPresetSize,
            availableByPreset,
        };
    }, [inventoryRows, items]);

    const stockReady = stockState === "ready";
    const selectedFit = React.useMemo(() => inferFitForType(typeUi, gramaje), [gramaje, typeUi]);

    const resolvePresetId = React.useCallback(
        (nextGramaje: Gramaje, colorLabel: string): string | null => {
            const preset = resolveGlobalStockPreset({
                garmentType: orderModel.garmentType,
                garmentModel: orderModel.garmentModel,
                color: colorLabel,
                grammageG: Number(nextGramaje),
                fit: inferFitForType(typeUi, nextGramaje),
            });
            return preset?.id ?? null;
        },
        [orderModel.garmentModel, orderModel.garmentType, typeUi]
    );

    const gramajeAvailableByValue = React.useMemo(() => {
        const map = new Map<Gramaje, number>();
        for (const item of gramajePreset) {
            const colorsForGramaje = resolveColorPresetForTypeAndGramaje(
                typeUi,
                item,
                publicationColorPreset
            );
            const total = colorsForGramaje.reduce((accumulator, colorOption) => {
                const presetId = resolvePresetId(item, colorOption.label);
                if (!presetId) return accumulator;
                return accumulator + (stockByPreset.availableByPreset.get(presetId) ?? 0);
            }, 0);
            map.set(item, total);
        }
        return map;
    }, [
        gramajePreset,
        publicationColorPreset,
        resolvePresetId,
        stockByPreset.availableByPreset,
        typeUi,
    ]);

    const colorAvailableByValue = React.useMemo(() => {
        const map = new Map<string, number>();
        for (const item of colorPreset) {
            const presetId = resolvePresetId(gramaje, item.label);
            const total = presetId ? stockByPreset.availableByPreset.get(presetId) ?? 0 : 0;
            map.set(item.value, total);
        }
        return map;
    }, [colorPreset, gramaje, resolvePresetId, stockByPreset.availableByPreset]);

    const selectedPresetId = React.useMemo(
        () => resolvePresetId(gramaje, colorPreset.find((item) => item.value === color)?.label ?? color),
        [color, colorPreset, gramaje, resolvePresetId]
    );

    const sizeAvailableByValue = React.useMemo(() => {
        const map = new Map<SizeValue, number>();
        for (const item of sizePreset) {
            if (!selectedPresetId) {
                map.set(item, 0);
                continue;
            }
            map.set(
                item,
                stockByPreset.availableByPresetSize.get(presetSizeKey(selectedPresetId, item)) ?? 0
            );
        }
        return map;
    }, [selectedPresetId, sizePreset, stockByPreset.availableByPresetSize]);

    const selectedSizeAvailable = sizeAvailableByValue.get(size) ?? 0;

    React.useEffect(() => {
        const nextType = inferTypeUi(publication);
        const nextGramaje = GRAMAJES_BY_TYPE[nextType][0] ?? "240";
        setTypeUi(nextType);
        setGramaje(nextGramaje);
    }, [publication]);

    React.useEffect(() => {
        setGramaje((prev) =>
            clampToEnabled(
                prev,
                gramajePreset,
                (candidate) =>
                    stockReady && (gramajeAvailableByValue.get(candidate) ?? 0) <= 0,
                gramajePreset[0] ?? "240"
            )
        );
    }, [gramajeAvailableByValue, gramajePreset, stockReady]);

    React.useEffect(() => {
        setSize((prev) =>
            clampToEnabled(
                prev,
                sizePreset,
                (candidate) =>
                    stockReady && (sizeAvailableByValue.get(candidate) ?? 0) <= 0,
                sizePreset[0] ?? "m"
            )
        );
    }, [sizeAvailableByValue, sizePreset, stockReady]);

    React.useEffect(() => {
        const colorValues = colorPreset.map((item) => item.value);
        setColor((prev) =>
            clampToEnabled(
                prev,
                colorValues,
                (candidate) =>
                    stockReady && (colorAvailableByValue.get(candidate) ?? 0) <= 0,
                colorPreset[0]?.value ?? "negra"
            )
        );
    }, [colorAvailableByValue, colorPreset, stockReady]);

    React.useEffect(() => {
        setDesignId((prev) => {
            if (designOptions.some((option) => option.value === prev)) return prev;
            return designOptions[0]?.value ?? "design-main";
        });
    }, [designOptions]);

    React.useEffect(() => {
        if (!stockReady) {
            setQuantity(1);
            return;
        }
        if (selectedSizeAvailable <= 0) {
            setQuantity(1);
            return;
        }
        setQuantity((prev) => Math.min(clampQty(prev), selectedSizeAvailable));
    }, [selectedSizeAvailable, stockReady]);

    React.useEffect(() => {
        if (!justAdded) return;
        const timeoutId = window.setTimeout(() => setJustAdded(false), 1500);
        return () => window.clearTimeout(timeoutId);
    }, [justAdded]);

    React.useEffect(() => {
        if (!infoOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setInfoOpen(false);
        };
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [infoOpen]);

    const selectedColor = React.useMemo(
        () => colorPreset.find((item) => item.value === color) ?? colorPreset[0],
        [color, colorPreset]
    );

    const selectedDesign = React.useMemo(
        () => designOptions.find((option) => option.value === designId) ?? designOptions[0],
        [designId, designOptions]
    );

    const selectedVariant = React.useMemo(
        () => variants.find((variant) => variant.id === designId),
        [designId, variants]
    );
    const baseGarmentImage = React.useMemo(
        () => emptyGarmentBaseUrl(publication),
        [publication]
    );

    const previewFrontBase = React.useMemo(
        () => selectedColor?.imageSrc ?? baseGarmentImage,
        [baseGarmentImage, selectedColor?.imageSrc]
    );
    const previewBackBase = React.useMemo(
        () => selectedColor?.imageSrc ?? baseGarmentImage,
        [baseGarmentImage, selectedColor?.imageSrc]
    );

    const previewFront = previewFrontBase;
    const previewBack = previewBackBase;

    const frontOverlay = selectedVariant?.front_design_url ?? design.default_front_design_url;
    const backOverlay = selectedVariant?.back_design_url ?? design.default_back_design_url;

    const previewInfo =
        publication.informative_image_url ??
        selectedVariant?.public_preview_url ??
        frontOverlay ??
        mockups[0]?.mockup_url ??
        previewFront;

    const previewItems = React.useMemo(
        () => [
            {
                mode: "front" as PreviewMode,
                label: "Frontal",
                imageSrc: previewFront,
            },
            {
                mode: "back" as PreviewMode,
                label: "Trasera",
                imageSrc: previewBack,
            },
        ],
        [previewBack, previewFront]
    );

    const activePreviewMeta = React.useMemo(
        () => previewItems.find((item) => item.mode === activePreview) ?? previewItems[0],
        [activePreview, previewItems]
    );

    const activePreviewImage = React.useMemo(() => {
        if (activePreview === "back") return previewBack;
        return previewFront;
    }, [activePreview, previewBack, previewFront]);

    const frontPrintAreaData = React.useMemo(() => getFrontPrintArea(publication), [publication]);
    const backPrintAreaData = React.useMemo(() => getBackPrintArea(publication), [publication]);
    const frontPrintArea = React.useMemo(() => areaToStyle(frontPrintAreaData), [frontPrintAreaData]);
    const backPrintArea = React.useMemo(() => areaToStyle(backPrintAreaData), [backPrintAreaData]);
    const activePrintArea = activePreview === "back" ? backPrintArea : frontPrintArea;

    const activeOverlay = activePreview === "back" ? backOverlay : frontOverlay;
    const usesComposedMockup = false;

    const typeOptions = React.useMemo<RadioTileOption[]>(
        () =>
            (Object.keys(TYPE_LABELS) as TypeUi[]).map((item) => ({
                value: item,
                label: TYPE_LABELS[item],
                accentHex: "#ffd942",
            })),
        []
    );

    const gramajeOptions = React.useMemo<RadioTileOption[]>(
        () =>
            gramajePreset.map((item) => ({
                value: item,
                label: `${item} Gr`,
                accentHex: "#ffd942",
                disabled: stockReady && (gramajeAvailableByValue.get(item) ?? 0) <= 0,
            })),
        [gramajeAvailableByValue, gramajePreset, stockReady]
    );

    const sizeOptions = React.useMemo<RadioTileOption[]>(
        () =>
            sizePreset.map((item) => ({
                value: item,
                label: item.toUpperCase(),
                accentHex: "#ffd942",
                disabled: stockReady && (sizeAvailableByValue.get(item) ?? 0) <= 0,
            })),
        [sizeAvailableByValue, sizePreset, stockReady]
    );

    const colorOptions = React.useMemo<RadioTileOption[]>(
        () =>
            colorPreset.map((item) => ({
                value: item.value,
                label: item.label,
                imageSrc: item.imageSrc,
                accentHex: item.hex,
                disabled: stockReady && (colorAvailableByValue.get(item.value) ?? 0) <= 0,
            })),
        [colorAvailableByValue, colorPreset, stockReady]
    );

    const selectedDesignText =
        selectedVariant?.label ??
        selectedDesign?.sublabel ??
        selectedDesign?.label ??
        design.name;
    const selectedTypeLabel = TYPE_LABELS[typeUi];
    const fallbackStockUnits = React.useMemo(() => resolveStockUnits(publication), [publication]);
    const selectedInventoryUnits = selectedPresetId
        ? stockByPreset.inventoryByPresetSize.get(presetSizeKey(selectedPresetId, size)) ?? 0
        : 0;
    const selectedReservedUnits = selectedPresetId
        ? stockByPreset.reservedByPresetSize.get(presetSizeKey(selectedPresetId, size)) ?? 0
        : 0;
    const stockLabel =
        stockState === "loading"
            ? "Validando stock real..."
            : stockState === "error"
              ? fallbackStockUnits === null
                  ? "Stock no verificado"
                  : `Stock no verificado (${fallbackStockUnits} reportados)`
              : selectedSizeAvailable <= 0
                ? `Sin stock en ${size.toUpperCase()}`
                : `${selectedSizeAvailable} disponibles en ${size.toUpperCase()}`;
    const lowStock =
        stockState === "ready" &&
        selectedSizeAvailable > 0 &&
        selectedSizeAvailable <= LOW_STOCK_LIMIT;
    const outOfStock = stockState === "ready" && selectedSizeAvailable <= 0;
    const canAddToCart = stockState === "ready" && selectedSizeAvailable > 0;
    const canIncreaseQty = canAddToCart && quantity < selectedSizeAvailable;
    const stockIndicatorClass =
        stockState === "loading"
            ? "bg-[rgba(8,10,13,.45)]"
            : stockState === "error"
              ? "bg-[rgba(188,69,37,.9)]"
              : outOfStock
                ? "bg-[rgba(188,69,37,.9)]"
                : lowStock
                  ? "bg-[rgba(206,150,21,.92)]"
                  : "bg-[rgba(10,146,89,.9)]";
    const stockFeedbackText = justAdded
        ? "Agregado al carrito"
        : stockState === "loading"
          ? "Validando disponibilidad en tiempo real..."
          : stockState === "error"
            ? stockError ?? "No se pudo validar stock real."
            : outOfStock
              ? selectedInventoryUnits > 0 && selectedReservedUnits >= selectedInventoryUnits
                  ? "Sin disponibilidad: ya apartaste esta talla en tu carrito."
                  : `Sin stock disponible para ${size.toUpperCase()}.`
              : "";
    const stockFeedbackTone = justAdded
        ? "text-(--saut-blue)"
        : stockState === "loading"
          ? "text-(--muted)"
          : stockState === "error" || outOfStock
            ? "text-[rgba(188,69,37,.9)]"
            : "text-(--muted)";

    const handleAddToCart = React.useCallback(() => {
        if (!canAddToCart) return;
        const safeQuantity = Math.min(quantity, selectedSizeAvailable);
        if (safeQuantity <= 0) return;

        addItem({
            productId: publication.id,
            slug: publication.slug,
            name: publication.title,
            imageSrc: previewFront,
            imageFrontSrc: previewFront,
            imageBackSrc: previewBack,
            imageFrontOverlaySrc: frontOverlay ?? undefined,
            imageBackOverlaySrc: backOverlay ?? undefined,
            frontPrintArea: frontPrintAreaData,
            backPrintArea: backPrintAreaData,
            unitPrice: publication.price_mxn,
            quantity: safeQuantity,
            selections: [
                { label: "Tipo", value: selectedTypeLabel },
                { label: "Gramaje", value: `${gramaje} Gr` },
                { label: "Talla", value: size.toUpperCase() },
                { label: "Color", value: selectedColor?.label ?? "N/A" },
                {
                    label: "Diseno",
                    value: selectedDesignText,
                },
            ],
            customizerSnapshot: {
                kind: "predesigned_v1",
                publication_id: publication.id,
                publication_slug: publication.slug,
                design_variant_id: selectedVariant?.id ?? null,
                garment_type: orderModel.garmentType,
                garment_model: orderModel.garmentModel,
                color: selectedColor?.label ?? color,
                size: size.toUpperCase(),
                grammage_g: Number(gramaje),
                fit: selectedFit,
                frozen_at: new Date().toISOString(),
            },
        });
        setJustAdded(true);
    }, [
        addItem,
        backOverlay,
        backPrintAreaData,
        canAddToCart,
        color,
        frontOverlay,
        frontPrintAreaData,
        gramaje,
        orderModel.garmentModel,
        orderModel.garmentType,
        previewBack,
        previewFront,
        publication,
        quantity,
        selectedColor,
        selectedDesignText,
        selectedFit,
        selectedSizeAvailable,
        selectedVariant?.id,
        selectedTypeLabel,
        size,
    ]);

    const lineTotal = publication.price_mxn * quantity;
    const canDecreaseQty = quantity > 1;

    return (
        <div className="grid gap-5">
            <div>
                <p className="text-[11px] font-black tracking-[0.18em] uppercase text-(--saut-navy) opacity-75">
                    {publication.category}
                </p>
                <h1 className="mt-1 text-[28px] sm:text-[34px] font-black tracking-[0.05em] uppercase text-(--text)">
                    {publication.title}
                </h1>
                <p className="mt-3 text-[14px] leading-relaxed text-(--text) opacity-85">
                    {publication.description ?? "Configura tu prenda y personalizala con tu estilo."}
                </p>
            </div>

            <section className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[108px_minmax(0,1fr)_390px] xl:grid-cols-[114px_minmax(0,1fr)_410px]">
                <aside className="order-2 lg:order-1">
                    <div className="text-[11px] font-black tracking-[0.14em] uppercase text-(--text)">
                        Visualizador
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-1">
                        {previewItems.map((item) => (
                            <button
                                key={item.mode}
                                type="button"
                                onClick={() => setActivePreview(item.mode)}
                                className={[
                                    "group relative overflow-hidden rounded-2xl border bg-[rgba(255,255,255,.38)] p-1.5 text-left transition",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]",
                                    activePreview === item.mode
                                        ? "border-(--saut-blue) shadow-[0_16px_30px_rgba(5,122,168,.22)]"
                                        : "border-(--border) hover:border-(--text) hover:shadow-[0_12px_24px_rgba(8,10,13,.1)]",
                                ].join(" ")}
                                aria-pressed={activePreview === item.mode}
                            >
                                <div className="overflow-hidden rounded-xl border border-[rgba(8,10,13,.08)] bg-[rgba(5,122,168,.05)]">
                                    <img
                                        src={item.imageSrc}
                                        alt={`${publication.title} ${item.label}`}
                                        width={256}
                                        height={320}
                                        className="h-[84px] sm:h-[96px] w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="px-1 pb-1 pt-2 text-center">
                                    <p className="text-[11px] font-black tracking-[0.12em] uppercase text-(--text)">
                                        {item.label}
                                    </p>
                                </div>
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setInfoOpen(true)}
                            className="
                group relative overflow-hidden rounded-2xl border border-(--border)
                bg-[rgba(255,255,255,.26)] backdrop-blur-[8px]
                p-1.5 text-left transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]
                hover:border-(--saut-blue) hover:shadow-[0_12px_24px_rgba(8,10,13,.1)]
              "
                            aria-label="Abrir informacion"
                        >
                            <div className="grid h-[110px] sm:h-[122px] w-full place-items-center rounded-xl border border-[rgba(8,10,13,.08)] bg-[radial-gradient(80%_70%_at_50%_35%,rgba(255,255,255,.46),rgba(5,122,168,.14)_65%,rgba(5,122,168,.06)_100%)]">
                                <span className="inline-flex h-9 min-w-[62px] items-center justify-center rounded-full border border-[rgba(8,10,13,.24)] bg-[rgba(255,255,255,.58)] px-3 text-[11px] font-black tracking-[0.12em] uppercase leading-none text-(--saut-navy) transition group-hover:scale-[1.04]">
                                    INFO
                                </span>
                            </div>
                        </button>
                    </div>
                </aside>

                <div className="order-1 lg:order-2 rounded-[26px] border border-(--border) bg-[rgba(255,255,255,.38)] p-3 sm:p-4">
                    <div className="relative overflow-hidden rounded-[22px] border border-[rgba(8,10,13,.08)] bg-[radial-gradient(90%_72%_at_50%_18%,rgba(255,255,255,.62),rgba(5,122,168,.08)_62%,rgba(5,122,168,.12)_100%)]">
                        <img
                            src={activePreviewImage}
                            alt={`${publication.title} ${activePreviewMeta?.label ?? activePreview}`}
                            width={960}
                            height={1200}
                            className="h-full w-full object-contain aspect-[4/5]"
                            loading={activePreview === "front" ? "eager" : "lazy"}
                            decoding="async"
                        />

                        {activeOverlay && !usesComposedMockup ? (
                            <div className="absolute" style={activePrintArea}>
                                <img
                                    src={activeOverlay}
                                    alt={selectedDesignText}
                                    className="h-full w-full object-contain"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        ) : null}

                        <div className="absolute left-3 top-3 inline-flex rounded-full border border-[rgba(255,255,255,.55)] bg-[rgba(8,10,13,.3)] px-2.5 py-1 text-[10px] font-black tracking-[0.12em] uppercase text-white">
                            {selectedColor?.label ?? "Color"}
                        </div>

                        <div className="absolute right-3 top-3 inline-flex rounded-full border border-[rgba(255,255,255,.55)] bg-[rgba(8,10,13,.3)] px-2.5 py-1 text-[10px] font-black tracking-[0.12em] uppercase text-white">
                            {activePreviewMeta?.label ?? "Vista"}
                        </div>

                        <div className="absolute bottom-3 right-3 z-[1] w-fit max-w-[calc(100%-1.5rem)] rounded-2xl border border-[rgba(255,255,255,.38)] bg-[rgba(8,10,13,.24)] p-2 backdrop-blur-[2px]">
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="text-[9px] font-black tracking-[0.12em] uppercase text-white/88">
                                    Diseno
                                </span>
                                <span className="max-w-[120px] truncate text-[8px] font-black tracking-[0.1em] uppercase text-white/72 sm:max-w-[180px]">
                                    {selectedDesignText}
                                </span>
                            </div>

                            {designOptions.length > 0 ? (
                                <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    <div className="inline-flex flex-nowrap items-center gap-1.5">
                                        {designOptions.map((option) => {
                                            const checked = option.value === designId;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setDesignId(option.value)}
                                                    className={[
                                                        "group relative grid h-11 w-11 sm:h-12 sm:w-12 shrink-0 place-items-center overflow-hidden rounded-xl border transition",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]",
                                                        checked
                                                            ? "border-(--saut-yellow) bg-[rgba(255,217,66,.18)] shadow-[0_10px_22px_rgba(255,217,66,.24)]"
                                                            : "border-[rgba(255,255,255,.26)] bg-[rgba(255,255,255,.08)] hover:border-white/55 hover:bg-[rgba(255,255,255,.14)]",
                                                    ].join(" ")}
                                                    aria-pressed={checked}
                                                    aria-label={`Elegir diseno ${option.sublabel ?? option.label}`}
                                                    title={option.sublabel ?? option.label}
                                                >
                                                    {option.imageSrc ? (
                                                        <img
                                                            src={option.imageSrc}
                                                            alt={option.label}
                                                            className={[
                                                                "object-contain transition-transform duration-150",
                                                                checked ? "h-10 w-10 sm:h-11 sm:w-11 scale-[1.03]" : "h-9 w-9 sm:h-10 sm:w-10",
                                                            ].join(" ")}
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    ) : (
                                                        <span className="px-1 text-[8px] font-black tracking-[0.08em] uppercase text-white/90">
                                                            {option.label}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="inline-flex items-center rounded-full border border-[rgba(255,255,255,.3)] bg-[rgba(255,255,255,.08)] px-2.5 py-1 text-[9px] font-black tracking-[0.11em] uppercase text-white/78">
                                    Sin disenos
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="order-3 rounded-[24px] border border-(--border) bg-[rgba(255,255,255,.36)] p-3.5 sm:p-5 lg:sticky lg:top-24">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[16px] font-black tracking-[0.08em] uppercase text-(--text)">
                                Configurador
                            </div>
                            <p className="mt-1 text-[12px] text-(--muted)">
                                Ajusta tipo, talla, color y diseno.
                            </p>
                        </div>
                        <span className="inline-flex rounded-full border border-(--border) bg-[rgba(255,217,66,.34)] px-3 py-1 text-[10px] font-black tracking-[0.1em] uppercase text-(--saut-navy)">
                            {selectedTypeLabel}
                        </span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[rgba(8,10,13,.14)] bg-[rgba(255,255,255,.72)] px-3 py-1">
                        <span
                            className={[
                                "h-2.5 w-2.5 rounded-full",
                                stockIndicatorClass,
                            ].join(" ")}
                        />
                        <span className="text-[10px] font-black tracking-[0.11em] uppercase text-(--text)">
                            {stockLabel}
                        </span>
                    </div>

                    <div className="mt-4 space-y-4">
                        <RadioTiles
                            label="Tipo"
                            name="product-type"
                            shape="rect"
                            layout="wrap"
                            size="sm"
                            value={typeUi}
                            onValueChange={(value) => setTypeUi(value as TypeUi)}
                            options={typeOptions}
                            tileClassName="!h-[40px] !px-3 !rounded-[12px]"
                        />

                        <RadioTiles
                            label="Gramaje"
                            name="product-gramaje"
                            shape="rect"
                            layout="wrap"
                            size="sm"
                            disabledStyle="keep"
                            value={gramaje}
                            onValueChange={(value) => setGramaje(value as Gramaje)}
                            options={gramajeOptions}
                            tileClassName="!h-[44px] !w-[90px] sm:!w-[96px] !px-0 !rounded-[14px] !overflow-hidden !bg-transparent !border-transparent !shadow-none before:!opacity-0 peer-checked:!border-transparent peer-checked:!shadow-none"
                            renderOption={({ option, checked }) => {
                                const outOfStockOption = option.disabled === true;
                                return (
                                    <div
                                        className={[
                                            "relative h-full w-full overflow-hidden rounded-[14px] border",
                                            "transition-[border-color,box-shadow,transform,background-color] duration-150",
                                            outOfStockOption
                                                ? "border-[rgba(8,10,13,.16)] bg-[rgba(233,226,196,.78)]"
                                                : checked
                                                  ? "border-(--saut-yellow) bg-[rgba(255,217,66,.23)] shadow-[0_8px_20px_rgba(255,217,66,.2)]"
                                                  : "border-[rgba(8,10,13,.14)] bg-[rgba(255,255,255,.8)]",
                                        ].join(" ")}
                                    >
                                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_80%_at_50%_18%,rgba(255,255,255,.48),rgba(255,255,255,0)_66%)]" />
                                        <div
                                            className={[
                                                "relative z-[1] grid h-full place-items-center px-1 text-center text-[12px] sm:text-[13px] font-black tracking-[0.1em] uppercase text-(--text)",
                                            ].join(" ")}
                                        >
                                            {option.label}
                                        </div>
                                        {outOfStockOption ? (
                                            <>
                                                <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(to_bottom,rgba(142,126,89,.16),rgba(142,126,89,.06))]" />
                                                <OutOfStockBadge />
                                            </>
                                        ) : null}
                                    </div>
                                );
                            }}
                        />

                        <RadioTiles
                            label="Talla"
                            name="product-size"
                            shape="square"
                            layout="wrap"
                            size="md"
                            disabledStyle="keep"
                            value={size}
                            onValueChange={(value) => setSize(value as SizeValue)}
                            options={sizeOptions}
                            tileClassName="!h-[58px] !w-[58px] !overflow-hidden !bg-transparent !border-transparent !shadow-none before:!opacity-0 peer-checked:!border-transparent peer-checked:!shadow-none"
                            renderOption={({ option, checked }) => {
                                const outOfStockOption = option.disabled === true;
                                return (
                                    <div
                                        className={[
                                            "relative h-full w-full overflow-hidden rounded-[16px] border",
                                            "transition-[border-color,box-shadow,transform,background-color] duration-150",
                                            outOfStockOption
                                                ? "border-[rgba(8,10,13,.16)] bg-[rgba(233,226,196,.78)]"
                                                : checked
                                                  ? "border-(--saut-yellow) bg-[rgba(255,217,66,.23)] shadow-[0_8px_20px_rgba(255,217,66,.2)]"
                                                  : "border-[rgba(8,10,13,.14)] bg-[rgba(255,255,255,.8)]",
                                        ].join(" ")}
                                    >
                                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_80%_at_50%_18%,rgba(255,255,255,.48),rgba(255,255,255,0)_66%)]" />
                                        <div
                                            className={[
                                                "relative z-[1] grid h-full place-items-center text-[15px] font-black tracking-[0.12em] uppercase text-(--text)",
                                            ].join(" ")}
                                        >
                                            {option.label}
                                        </div>
                                        {outOfStockOption ? (
                                            <>
                                                <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(to_bottom,rgba(142,126,89,.16),rgba(142,126,89,.06))]" />
                                                <OutOfStockBadge />
                                            </>
                                        ) : null}
                                    </div>
                                );
                            }}
                        />

                        <RadioTiles
                            label="Color"
                            name="product-color"
                            shape="square"
                            layout="wrap"
                            size="md"
                            disabledStyle="keep"
                            value={color}
                            onValueChange={setColor}
                            options={colorOptions}
                            tileClassName="!h-[66px] !w-[66px] !min-h-0 !aspect-auto !rounded-none !bg-transparent !border-transparent !shadow-none before:!opacity-0 peer-checked:!border-transparent peer-checked:!shadow-none"
                            renderOption={({ option, checked }) => (
                                <div className="grid h-full w-full place-items-center">
                                    <div
                                        className={[
                                            "relative grid h-[62px] w-[62px] place-items-center overflow-hidden rounded-[14px] border",
                                            "transition-[border-color,box-shadow,transform,background-color] duration-150",
                                            option.disabled
                                                ? "border-[rgba(8,10,13,.16)] bg-[rgba(233,226,196,.78)]"
                                                : checked
                                                  ? "border-(--saut-yellow) bg-[rgba(255,217,66,.19)] shadow-[0_9px_20px_rgba(255,217,66,.2)]"
                                                  : "border-[rgba(8,10,13,.14)] bg-[rgba(255,255,255,.8)]",
                                        ].join(" ")}
                                    >
                                        {option.imageSrc ? (
                                            <img
                                                src={option.imageSrc}
                                                alt={option.label}
                                                className={[
                                                    "object-contain transition-transform duration-150",
                                                    checked
                                                        ? "h-[56px] w-[56px] scale-[1.05]"
                                                        : "h-[52px] w-[52px]",
                                                ].join(" ")}
                                                style={{
                                                    filter: `drop-shadow(0 0 ${checked ? 10 : 6}px ${shadowFromHex(option.accentHex, checked ? 0.52 : 0.34)})`,
                                                }}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <span
                                                className={[
                                                    "rounded-full border border-[rgba(8,10,13,.18)] transition-transform duration-150",
                                                    checked ? "h-10 w-10 scale-[1.05]" : "h-9 w-9",
                                                ].join(" ")}
                                                style={{ backgroundColor: option.accentHex }}
                                            />
                                        )}
                                        {option.disabled ? (
                                            <>
                                                <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(to_bottom,rgba(142,126,89,.16),rgba(142,126,89,.06))]" />
                                                <OutOfStockBadge />
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        />

                    </div>

                    <div className="mt-3 rounded-2xl border border-(--border) bg-[rgba(255,255,255,.58)] p-2 shadow-[0_14px_32px_rgba(8,10,13,.06)]">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-black tracking-[0.13em] uppercase">
                            <span className="text-(--muted)">Precio unitario</span>
                            <span className="text-(--text)">${formatMXN(publication.price_mxn)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-black tracking-[0.13em] uppercase text-(--muted)">
                                Total
                            </span>
                            <span className="text-[20px] font-black tracking-[0.08em] text-(--saut-navy)">
                                ${formatMXN(lineTotal)}
                            </span>
                        </div>

                        <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="inline-flex items-center overflow-hidden rounded-full border border-(--border) bg-(--surface)">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setQuantity((prev) =>
                                            canIncreaseQty
                                                ? Math.min(selectedSizeAvailable, prev + 1)
                                                : prev
                                        )
                                    }
                                    disabled={!canIncreaseQty}
                                    className={[
                                        "grid h-6 w-6 place-items-center text-[12px] font-black transition",
                                        canIncreaseQty
                                            ? "hover:bg-[rgba(8,10,13,.08)]"
                                            : "cursor-not-allowed opacity-40",
                                    ].join(" ")}
                                    aria-label="Aumentar cantidad"
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={canAddToCart ? selectedSizeAvailable : 1}
                                    step={1}
                                    value={quantity}
                                    onChange={(event) => {
                                        const next = clampQty(
                                            Number.parseInt(event.target.value || "1", 10)
                                        );
                                        if (!canAddToCart) {
                                            setQuantity(1);
                                            return;
                                        }
                                        setQuantity(Math.min(next, selectedSizeAvailable));
                                    }}
                                    className="h-6 w-7 border-x border-(--border) bg-transparent text-center text-[9.5px] font-black outline-none focus-visible:bg-[rgba(255,255,255,.7)]"
                                    aria-label="Cantidad"
                                />
                                <button
                                    type="button"
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                    disabled={!canDecreaseQty}
                                    className={[
                                        "grid h-6 w-6 place-items-center text-[12px] font-black transition",
                                        canDecreaseQty
                                            ? "hover:bg-[rgba(8,10,13,.08)]"
                                            : "cursor-not-allowed opacity-40",
                                    ].join(" ")}
                                    aria-label="Disminuir cantidad"
                                >
                                    -
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={!canAddToCart}
                                className={[
                                    "h-6 flex-1 rounded-[999px] border border-(--border) bg-(--saut-yellow) text-(--saut-black) text-[9px] font-black tracking-[0.11em] uppercase shadow-[0_14px_30px_rgba(8,10,13,.14)] transition hover:-translate-y-[1px] hover:bg-(--saut-blue) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]",
                                    canAddToCart
                                        ? ""
                                        : "cursor-not-allowed opacity-45 hover:translate-y-0 hover:bg-(--saut-yellow) hover:text-(--saut-black)",
                                ].join(" ")}
                            >
                                {canAddToCart ? "Agregar al carrito" : "Sin disponibilidad"}
                            </button>
                        </div>

                        <p
                            className={[
                                "mt-2 text-[11px] font-black tracking-[0.1em] uppercase transition",
                                stockFeedbackText ? "opacity-100" : "opacity-0",
                                stockFeedbackTone,
                            ].join(" ")}
                            role="status"
                            aria-live="polite"
                        >
                            {stockFeedbackText || "Stock validado"}
                        </p>
                    </div>
                </aside>
            </section>

            {infoOpen ? (
                <div className="fixed inset-0 z-[140] grid place-items-center p-4 sm:p-6">
                    <button
                        type="button"
                        onClick={() => setInfoOpen(false)}
                        className="absolute inset-0 bg-[rgba(8,10,13,.58)]"
                        aria-label="Cerrar modal de info"
                    />
                    <div className="relative z-[1] w-full max-w-[980px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,.28)] bg-[rgba(12,15,20,.86)] shadow-[0_34px_80px_rgba(0,0,0,.5)]">
                        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,.16)] px-3 py-2.5 sm:px-4">
                            <div className="text-[11px] font-black tracking-[0.14em] uppercase text-white/90">
                                Info de producto
                            </div>
                            <button
                                type="button"
                                onClick={() => setInfoOpen(false)}
                                className="grid h-8 w-8 place-items-center rounded-full border border-[rgba(255,255,255,.28)] text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]"
                                aria-label="Cerrar info"
                            >
                                x
                            </button>
                        </div>
                        <div className="max-h-[78vh] overflow-auto p-2 sm:p-3">
                            <img
                                src={previewInfo}
                                alt={`${publication.title} info`}
                                className="mx-auto h-auto w-full rounded-xl object-contain"
                                loading="eager"
                                decoding="async"
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
