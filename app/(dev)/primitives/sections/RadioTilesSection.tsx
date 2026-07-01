// primitives/sections/RadioTilesSection.tsx

"use client";

import * as React from "react";
import Image from "next/image";
import { RadioTiles, type RadioTileOption } from "@/core/design-system";

type ProductType =
    | "oversize"
    | "manga_larga_oversize"
    | "hoodie_semi"
    | "hoodie_oversize"
    | "regular";

type TypeUi = "oversize" | "manga_larga_oversize" | "hoodie" | "regular";

type Gramaje = "200" | "220" | "240" | "300" | "400";
type SizeKey = "s" | "m" | "l" | "xl" | "2xl";

type ColorKey =
    | "negra"
    | "blanca"
    | "chocolate"
    | "crudo"
    | "hueso"
    | "gris_azulada"
    | "gris_grafito"
    | "verde_olivo"
    | "beige"
    | "rojo"
    | "azul_rey"
    | "petroleo"
    | "rosa_baby"
    | "verde_militar"
    | "vino"
    | "azul_cielo"
    | "arena";

/* ---------------- wrappers ---------------- */
const panel =
    "rounded-[18px] border border-[rgba(0,0,0,.12)] bg-[rgba(255,255,255,.18)] " +
    "shadow-[0_24px_50px_rgba(8,10,13,.14)] overflow-hidden";

const head =
    "px-4 py-3 flex items-baseline justify-between gap-3 bg-[rgba(255,255,255,.22)] " +
    "border-b border-[rgba(0,0,0,.10)]";

const body = "p-4 flex flex-col gap-4";

const group =
    "rounded-[16px] border border-[rgba(0,0,0,.12)] bg-[rgba(255,255,255,.22)] " +
    "shadow-[0_16px_34px_rgba(8,10,13,.10)] p-3";

function prettyColor(c: string) {
    return c.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/* ---------------- color helpers ---------------- */
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

function rgbaFromHex(hex?: string, a = 0.2) {
    const rgb = hexToRgb(hex ?? "");
    if (!rgb) return `rgba(20,20,20,${a})`;
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

function glowStyle(hex?: string): React.CSSProperties {
    const c1 = rgbaFromHex(hex, 0.26);
    const c2 = rgbaFromHex(hex, 0.12);
    return {
        background: `radial-gradient(70% 60% at 50% 42%, ${c1} 0%, ${c2} 38%, rgba(0,0,0,0) 72%)`,
        filter: "blur(18px)",
        transform: "scale(1.06)",
    };
}

function darkTintRgba(hex: string, alpha: number, k: number) {
    const rgb = hexToRgb(hex) ?? { r: 20, g: 20, b: 20 };
    const rr = Math.round(rgb.r * k);
    const gg = Math.round(rgb.g * k);
    const bb = Math.round(rgb.b * k);
    return `rgba(${rr},${gg},${bb},${alpha})`;
}

function pngShadowFilter(hex?: string) {
    const base = hex ?? "#141412";
    const s1 = darkTintRgba(base, 0.30, 0.28);
    const s2 = darkTintRgba(base, 0.18, 0.22);
    const outline = "rgba(8,10,13,.22)";
    return `drop-shadow(0 22px 34px ${s1}) drop-shadow(0 10px 18px ${s2}) drop-shadow(0 0 0.8px ${outline})`;
}

function BottomChip({ text }: { text: string }) {
    return (
        <div className="absolute bottom-3 left-3 right-3 text-center">
      <span
          className="inline-flex items-center justify-center rounded-[12px] px-3 py-1
                   text-[11px] font-black tracking-[0.14em] uppercase
                   bg-[rgba(8,10,13,.14)] text-white
                   border border-[rgba(255,255,255,.22)]
                   shadow-[0_10px_26px_rgba(8,10,13,.16)]"
      >
        {text}
      </span>
        </div>
    );
}

/* ---------------- DATA (HEX + IMG) ---------------- */
const HEX: Record<ProductType, Partial<Record<ColorKey, string>>> = {
    oversize: {
        arena: "#e6cbad",
        azul_cielo: "#aed4e9",
        azul_rey: "#0747a6",
        beige: "#d3b17d",
        blanca: "#f6f6f6",
        chocolate: "#603519",
        crudo: "#fbf9ea",
        gris_azulada: "#657d90",
        gris_grafito: "#4e5051",
        hueso: "#fbf2d5",
        negra: "#141412",
        petroleo: "#114352",
        rojo: "#d4120f",
        rosa_baby: "#ffd2e4",
        verde_militar: "#536f28",
        verde_olivo: "#57571e",
        vino: "#6f0d1c",
    },
    manga_larga_oversize: {
        beige: "#e0b984",
        blanca: "#f8f8f8",
        gris_grafito: "#505352",
        negra: "#101010",
    },
    hoodie_semi: { negra: "#1b1b19" },
    hoodie_oversize: { negra: "#1b1b19" },
    regular: { negra: "#131311" },
};

const IMG: Record<ProductType, Partial<Record<ColorKey, string>>> = {
    oversize: {
        arena: "oversize-arena.webp",
        azul_cielo: "oversize-azul-cielo.webp",
        azul_rey: "oversize-azul-rey.webp",
        beige: "oversize-beige.webp",
        blanca: "oversize-blanca.webp",
        chocolate: "oversize-chocolate.webp",
        crudo: "oversize-crudo.webp",
        gris_azulada: "oversize-gris-azulada.webp",
        gris_grafito: "oversize-gris-grafito.webp",
        hueso: "oversize-hueso.webp",
        negra: "oversize-negra.webp",
        petroleo: "oversize-petroleo.webp",
        rojo: "oversize-rojo.webp",
        rosa_baby: "oversize-rosa-baby.webp",
        verde_militar: "oversize-verde-militar.webp",
        verde_olivo: "oversize-verde-olivo.webp",
        vino: "oversize-vino.webp",
    },
    manga_larga_oversize: {
        beige: "manga-larga-beige.webp",
        blanca: "manga-larga-blanca.webp",
        gris_grafito: "manga-larga-gris-grafito.webp",
        negra: "manga-larga-negra.webp",
    },
    hoodie_semi: { negra: "hoodie-semi-orversize-negra.webp" },
    hoodie_oversize: { negra: "hoodie-oversize-negra.webp" },
    regular: { negra: "regular-negra.webp" },
};

const GRAMAGES_BY_TYPE: Record<ProductType, Gramaje[]> = {
    oversize: ["240", "220", "200"],
    manga_larga_oversize: ["220"],
    hoodie_semi: ["300"],
    hoodie_oversize: ["400"],
    regular: ["200"],
};

const SIZES_BY_TYPE_GR: Record<ProductType, Record<Gramaje, SizeKey[]>> = {
    oversize: {
        "240": ["s", "m", "l", "xl", "2xl"],
        "220": ["s", "m", "l", "xl", "2xl"],
        "200": ["s", "m", "l", "xl"],
        "300": [],
        "400": [],
    },
    manga_larga_oversize: {
        "220": ["s", "m", "l", "xl", "2xl"],
        "200": [],
        "240": [],
        "300": [],
        "400": [],
    },
    hoodie_semi: {
        "300": ["s", "m", "l", "xl", "2xl"],
        "200": [],
        "220": [],
        "240": [],
        "400": [],
    },
    hoodie_oversize: {
        "400": ["s", "m", "l", "xl", "2xl"],
        "200": [],
        "220": [],
        "240": [],
        "300": [],
    },
    regular: {
        "200": ["s", "m", "l", "xl"],
        "220": [],
        "240": [],
        "300": [],
        "400": [],
    },
};

const COLORS_BY_TYPE_GR: Record<ProductType, Record<Gramaje, ColorKey[]>> = {
    oversize: {
        "240": ["negra", "blanca", "chocolate", "crudo", "hueso", "gris_azulada"],
        "220": ["negra", "blanca", "chocolate", "gris_grafito", "verde_olivo", "beige"],
        "200": [
            "negra",
            "blanca",
            "chocolate",
            "gris_grafito",
            "rojo",
            "azul_rey",
            "petroleo",
            "rosa_baby",
            "verde_militar",
            "vino",
            "azul_cielo",
            "arena",
        ],
        "300": [],
        "400": [],
    },
    manga_larga_oversize: {
        "220": ["negra", "blanca", "beige", "gris_grafito"],
        "200": [],
        "240": [],
        "300": [],
        "400": [],
    },
    hoodie_semi: {
        "300": ["negra"],
        "200": [],
        "220": [],
        "240": [],
        "400": [],
    },
    hoodie_oversize: {
        "400": ["negra"],
        "200": [],
        "220": [],
        "240": [],
        "300": [],
    },
    regular: {
        "200": ["negra"],
        "220": [],
        "240": [],
        "300": [],
        "400": [],
    },
};

const DESIGN_FILES = ["design-1", "design-2", "design-3", "design-4"] as const;
type DesignKey = (typeof DESIGN_FILES)[number];

/* ---------------- print areas (percent) ---------------- */
type PrintArea = { xPct: number; yPct: number; wPct: number; hPct: number };

const PRINT_AREA_BY_TYPE: Record<ProductType, PrintArea> = {
    oversize: { xPct: 34, yPct: 26, wPct: 32, hPct: 34 },
    manga_larga_oversize: { xPct: 34, yPct: 24, wPct: 32, hPct: 34 },
    hoodie_semi: { xPct: 32, yPct: 24, wPct: 36, hPct: 36 },
    hoodie_oversize: { xPct: 32, yPct: 24, wPct: 36, hPct: 36 },
    regular: { xPct: 35, yPct: 27, wPct: 30, hPct: 32 },
};

function boxStyle(pa: PrintArea): React.CSSProperties {
    return {
        left: `${pa.xPct}%`,
        top: `${pa.yPct}%`,
        width: `${pa.wPct}%`,
        height: `${pa.hPct}%`,
    };
}

const TYPE_HEX: Record<ProductType, string> = {
    oversize: "#141412",
    manga_larga_oversize: "#101010",
    hoodie_semi: "#1b1b19",
    hoodie_oversize: "#1b1b19",
    regular: "#131311",
};

function typeLabel(t: ProductType) {
    switch (t) {
        case "oversize":
            return "OVERSIZE";
        case "manga_larga_oversize":
            return "MANGA-LARGA";
        case "regular":
            return "REGULAR";
        case "hoodie_semi":
        case "hoodie_oversize":
            return "HOODIE";
        default:
            return "PRENDA";
    }
}

function typeGramajes(t: ProductType) {
    const gs = GRAMAGES_BY_TYPE[t] ?? [];
    return gs.length ? gs.map((g) => `${g} Gr`).join(" / ") : "";
}

function effectiveTypeFromUi(typeUi: TypeUi, gramaje: Gramaje): ProductType {
    if (typeUi !== "hoodie") return typeUi;
    return gramaje === "400" ? "hoodie_oversize" : "hoodie_semi";
}

function clampToAvailable<T extends string>(value: T, list: T[], fallback: T): T {
    return list.includes(value) ? value : (list[0] ?? fallback);
}

export function RadioTilesSection() {
    const [sel, setSel] = React.useState<{
        typeUi: TypeUi;
        gramaje: Gramaje;
        size: SizeKey;
        color: ColorKey;
        design: DesignKey;
    }>({
        typeUi: "oversize",
        gramaje: "240",
        size: "m",
        color: "negra",
        design: "design-1",
    });

    const effectiveType = React.useMemo(
        () => effectiveTypeFromUi(sel.typeUi, sel.gramaje),
        [sel.typeUi, sel.gramaje]
    );

    const setTypeUi = React.useCallback((nextTypeUi: TypeUi) => {
        setSel((prev) => {
            const nextGramaje: Gramaje =
                nextTypeUi === "hoodie"
                    ? (prev.gramaje === "300" || prev.gramaje === "400" ? prev.gramaje : "300")
                    : GRAMAGES_BY_TYPE[nextTypeUi as ProductType][0];

            const nextEffective = effectiveTypeFromUi(nextTypeUi, nextGramaje);

            const sizes = SIZES_BY_TYPE_GR[nextEffective][nextGramaje] ?? [];
            const colors = COLORS_BY_TYPE_GR[nextEffective][nextGramaje] ?? [];

            return {
                ...prev,
                typeUi: nextTypeUi,
                gramaje: nextGramaje,
                size: clampToAvailable(prev.size, sizes, "m"),
                color: clampToAvailable(prev.color, colors, "negra"),
            };
        });
    }, []);

    const setGramaje = React.useCallback((nextGramaje: Gramaje) => {
        setSel((prev) => {
            const allowed: Gramaje[] =
                prev.typeUi === "hoodie"
                    ? (["300", "400"] as Gramaje[])
                    : GRAMAGES_BY_TYPE[prev.typeUi as ProductType];

            const safeGramaje = allowed.includes(nextGramaje) ? nextGramaje : allowed[0];

            const nextEffective = effectiveTypeFromUi(prev.typeUi, safeGramaje);

            const sizes = SIZES_BY_TYPE_GR[nextEffective][safeGramaje] ?? [];
            const colors = COLORS_BY_TYPE_GR[nextEffective][safeGramaje] ?? [];

            return {
                ...prev,
                gramaje: safeGramaje,
                size: clampToAvailable(prev.size, sizes, "m"),
                color: clampToAvailable(prev.color, colors, "negra"),
            };
        });
    }, []);

    const currentHex = HEX[effectiveType][sel.color] ?? "#141412";
    const printArea = PRINT_AREA_BY_TYPE[effectiveType];

    const typeOptions = React.useMemo<RadioTileOption[]>(
        () => [
            {
                value: "oversize",
                label: typeLabel("oversize"),
                sublabel: typeGramajes("oversize"),
                imageSrc: "/tiles/oversize-negra.webp",
                accentHex: TYPE_HEX.oversize,
            },
            {
                value: "manga_larga_oversize",
                label: typeLabel("manga_larga_oversize"),
                sublabel: typeGramajes("manga_larga_oversize"),
                imageSrc: "/tiles/manga-larga-negra.webp",
                accentHex: TYPE_HEX.manga_larga_oversize,
            },
            {
                value: "hoodie",
                label: "HOODIE",
                sublabel: "Semi-oversize 300 / Oversize 400 Gr",
                imageSrc: "/tiles/hoodie-semi-orversize-negra.webp",
                accentHex: TYPE_HEX.hoodie_semi,
            },
            {
                value: "regular",
                label: typeLabel("regular"),
                sublabel: typeGramajes("regular"),
                imageSrc: "/tiles/regular-negra.webp",
                accentHex: TYPE_HEX.regular,
            },
        ],
        []
    );

    const gramajeOptions = React.useMemo<RadioTileOption[]>(() => {
        if (sel.typeUi === "hoodie") {
            return [
                { value: "300", label: "SEMI-OVERSIZE", sublabel: "300 GR", accentHex: "#FFD942" },
                { value: "400", label: "OVERSIZE", sublabel: "400 GR", accentHex: "#FFD942" },
            ];
        }
        return GRAMAGES_BY_TYPE[sel.typeUi as ProductType].map((g) => ({
            value: g,
            label: `${g} GR`,
            accentHex: "#FFD942",
        }));
    }, [sel.typeUi]);

    const sizeOptions = React.useMemo<RadioTileOption[]>(
        () =>
            (SIZES_BY_TYPE_GR[effectiveType][sel.gramaje] ?? []).map((s) => ({
                value: s,
                label: s.toUpperCase(),
                accentHex: "#FFD942",
            })),
        [effectiveType, sel.gramaje]
    );

    const colorOptions = React.useMemo<RadioTileOption[]>(() => {
        const availableColors = COLORS_BY_TYPE_GR[effectiveType][sel.gramaje] ?? [];
        return availableColors.map((c) => {
            const file = IMG[effectiveType][c];
            const hx = HEX[effectiveType][c] ?? "#141412";
            return {
                value: c,
                label: prettyColor(c),
                imageSrc: file ? `/tiles/${file}` : undefined,
                accentHex: hx,
            };
        });
    }, [effectiveType, sel.gramaje]);

    const baseSrc = React.useMemo(() => {
        const baseFile = IMG[effectiveType][sel.color];
        return baseFile ? `/tiles/${baseFile}` : undefined;
    }, [effectiveType, sel.color]);

    const designOptions = React.useMemo<RadioTileOption[]>(
        () =>
            DESIGN_FILES.map((d) => ({
                value: d,
                label: d.toUpperCase().replace("-", " "),
                imageSrc: `/tiles/${d}.webp`,
                accentHex: currentHex,
            })),
        [currentHex]
    );

    const renderTypeOption = React.useCallback(
        ({ option }: { option: RadioTileOption }) => {
            const hx = option.accentHex ?? "#141412";

            const isHoodie = option.value === "hoodie";
            const imgSrc =
                isHoodie && sel.gramaje === "400"
                    ? "/tiles/hoodie-oversize-negra.webp"
                    : (option.imageSrc ?? "");

            return (
                <div className="relative w-full h-full">
                    <div className="absolute inset-0 pointer-events-none" style={glowStyle(hx)} />
                    {imgSrc ? (
                        <Image
                            src={imgSrc}
                            alt={option.label}
                            fill
                            sizes="160px"
                            className="absolute inset-0 object-contain p-3"
                            style={{ filter: pngShadowFilter(hx) }}
                            draggable={false}
                        />
                    ) : null}

                    <div
                        className="absolute bottom-2 left-2 right-2 rounded-[14px] px-2 py-2
                       bg-[rgba(8,10,13,.14)] border border-[rgba(255,255,255,.20)]
                       text-white shadow-[0_14px_34px_rgba(8,10,13,.16)]"
                    >
                        <div className="text-[11px] font-black tracking-[0.14em] uppercase truncate">
                            {option.label}
                        </div>
                        <div className="mt-0.5 text-[10px] font-extrabold opacity-90 truncate">
                            {option.sublabel}
                        </div>
                    </div>
                </div>
            );
        },
        [sel.gramaje]
    );

    const renderGramajeOption = React.useCallback(
        ({ option }: { option: RadioTileOption }) => (
            <div className="w-full h-full grid place-items-center text-center">
                <div className="text-[12px] font-black tracking-[0.12em] uppercase">{option.label}</div>
                {option.sublabel ? (
                    <div className="mt-1 text-[11px] font-black tracking-[0.12em] uppercase opacity-80">
                        {option.sublabel}
                    </div>
                ) : null}
            </div>
        ),
        []
    );

    const renderColorOption = React.useCallback(
        ({ option, checked }: { option: RadioTileOption; checked: boolean }) => {
            const hx = (option.accentHex ?? "#141412").toUpperCase();
            const src = option.imageSrc ?? "";
            return (
                <div className="relative w-full h-full">
                    <div className="absolute left-0 right-0 top-0 h-[88px] overflow-hidden rounded-[18px]">
                        <div className="absolute inset-0 pointer-events-none" style={glowStyle(hx)} />
                        <div className="absolute inset-0 grid place-items-center">
                            {src ? (
                                <Image
                                    src={src}
                                    alt={option.label}
                                    width={78}
                                    height={78}
                                    className="h-[78px] w-[78px] object-contain"
                                    draggable={false}
                                    style={{
                                        filter:
                                            pngShadowFilter(hx) +
                                            (checked
                                                ? " drop-shadow(0 0 0.9px rgba(255,217,66,.95)) drop-shadow(0 0 16px rgba(255,217,66,.20))"
                                                : ""),
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>

                    <div className="absolute left-0 right-0 bottom-1 text-center">
            <span className="text-[10px] font-black tracking-[0.12em] uppercase text-[rgba(8,10,13,.72)]">
              {option.label}
            </span>
                    </div>
                </div>
            );
        },
        []
    );

    const renderDesignOption = React.useCallback(
        ({ option }: { option: RadioTileOption }) => (
            <div className="relative w-full h-full">
                <div className="absolute inset-0 pointer-events-none" style={glowStyle(currentHex)} />

                {baseSrc ? (
                    <Image
                        src={baseSrc}
                        alt="prenda seleccionada"
                        fill
                        sizes="220px"
                        className="absolute inset-0 object-contain p-5"
                        style={{ filter: pngShadowFilter(currentHex) }}
                        draggable={false}
                    />
                ) : null}

                <div className="absolute" style={boxStyle(printArea)}>
                    <Image
                        src={`/tiles/${String(option.value)}.webp`}
                        alt={String(option.value)}
                        fill
                        sizes="90px"
                        className="object-contain"
                        style={{
                            filter:
                                "drop-shadow(0 10px 18px rgba(0,0,0,.20)) drop-shadow(0 0 0.6px rgba(0,0,0,.16))",
                        }}
                        draggable={false}
                    />
                </div>

                <BottomChip text={String(option.value).replace("design-", "D")} />
            </div>
        ),
        [baseSrc, currentHex, printArea]
    );

    return (
        <section className={panel} aria-label="Configurador - Tiles">
            <div className={head}>
                <b className="text-[13px] font-black tracking-[0.02em]">Configurador • Tiles</b>
            </div>

            <div className={body}>
                {/* 1) Tipo prenda */}
                <div className={group}>
                    <RadioTiles
                        label="Tipo de prenda"
                        name="tipo_prenda"
                        shape="square"
                        layout="wrap"
                        size="lg"
                        value={sel.typeUi}
                        onValueChange={(v) => setTypeUi(v as TypeUi)}
                        options={typeOptions}
                        tileClassName="!h-[150px] !w-[150px] !rounded-[20px]"
                        renderOption={renderTypeOption}
                    />
                </div>

                {/* 2) Gramaje */}
                <div className={group}>
                    <RadioTiles
                        label="Gramaje"
                        name="gramaje"
                        shape="square"
                        layout="wrap"
                        size="md"
                        value={sel.gramaje}
                        onValueChange={(v) => setGramaje(v as Gramaje)}
                        tileClassName="!h-[70px] !w-[92px] !rounded-[18px]"
                        options={gramajeOptions}
                        renderOption={renderGramajeOption}
                    />
                </div>

                {/* 3) Tallas */}
                <div className={group}>
                    <RadioTiles
                        label="Tallas"
                        name="tallas"
                        shape="square"
                        layout="wrap"
                        size="md"
                        value={sel.size}
                        onValueChange={(v) => setSel((p) => ({ ...p, size: v as SizeKey }))}
                        tileClassName="!h-[62px] !w-[62px] !rounded-[18px]"
                        options={sizeOptions}
                    />
                </div>

                {/* 4) Colores */}
                <div className={group}>
                    <RadioTiles
                        label="Colores"
                        name="colores"
                        shape="square"
                        layout="wrap"
                        size="md"
                        value={sel.color}
                        onValueChange={(v) => setSel((p) => ({ ...p, color: v as ColorKey }))}
                        options={colorOptions}
                        tileClassName="!h-[112px] !w-[92px] !rounded-[18px] before:!opacity-0"
                        renderOption={renderColorOption}
                    />
                </div>

                {/* 5) Variantes de diseño */}
                <div className={group}>
                    <RadioTiles
                        label="Variantes de diseño"
                        name="disenos"
                        shape="square"
                        layout="grid"
                        columns={4}
                        size="lg"
                        value={sel.design}
                        onValueChange={(v) => setSel((p) => ({ ...p, design: v as DesignKey }))}
                        options={designOptions}
                        renderOption={renderDesignOption}
                    />
                </div>
            </div>
        </section>
    );
}
