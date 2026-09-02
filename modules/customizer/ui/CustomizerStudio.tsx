"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";

import { useCart } from "@/core/cart";
import {
  Button,
  CheckboxControl,
  FileUpload,
  IconButton,
  Modal,
  RangeField,
  SelectField,
  TextAreaField,
  TextField,
  notify,
} from "@/core/design-system";
import { emitCustomizerEvent } from "@/modules/analytics/client";
import { getSession } from "@/modules/auth/client/session";
import {
  duplicateCustomizerDesign,
  loadCustomizerDesigns,
  migrateGuestDesignsToAccount,
  removeCustomizerDesign,
  upsertCustomizerDesign,
} from "@/modules/customizer/storage";
import {
  countGarmentImages,
  createCustomizerElementAssetId,
  createNewCustomizerDesign,
  createNewGarment,
  CUSTOMIZER_MAX_GARMENTS_PER_SESSION,
  CUSTOMIZER_MAX_NOTE_LENGTH,
  type CustomizerElement,
  type CustomizerGarmentState,
  type CustomizerTextElement,
  type CustomizerViewSide,
  type SavedCustomizerDesign,
} from "@/modules/customizer/types";

type PrintArea = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
};

type DragState = {
  pointerId: number;
  garmentId: string;
  side: CustomizerViewSide;
  elementId: string;
  startClientX: number;
  startClientY: number;
  startXPct: number;
  startYPct: number;
  areaRect: DOMRect;
};

type ScaleDragState = {
  pointerId: number;
  garmentId: string;
  side: CustomizerViewSide;
  elementId: string;
  startScale: number;
  centerClientX: number;
  centerClientY: number;
  startDistance: number;
};

type CartQualityScope = "active" | "session";

const MAX_UPLOAD_MB = 8;

const FONT_OPTIONS = [
  { label: "Impact", value: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
  { label: "Bebas", value: "'Bebas Neue', Impact, sans-serif" },
  { label: "Oswald", value: "Oswald, 'Arial Narrow', sans-serif" },
  { label: "Rethink", value: "var(--font-sans), 'Segoe UI', sans-serif" },
  { label: "Courier", value: "'Courier New', monospace" },
];

const GARMENT_MODEL_OPTIONS = [
  { value: "oversize", label: "Oversize" },
  { value: "long_sleeve_oversize", label: "Manga Larga Oversize" },
  { value: "hoodie_semi_oversize", label: "Hoodie Semi-oversize" },
  { value: "hoodie_oversize", label: "Hoodie Oversize" },
  { value: "regular", label: "Regular" },
];

const PRICE_BY_MODEL_GRAMMAGE: Record<string, number> = {
  "oversize:200": 439,
  "oversize:220": 459,
  "oversize:240": 479,
  "long_sleeve_oversize:220": 499,
  "hoodie_semi_oversize:300": 639,
  "hoodie_oversize:400": 699,
  "regular:200": 399,
};

type GarmentStockEntry = {
  model: string;
  color: string;
  grammageG: number;
  fit: string;
};

const GARMENT_STOCK: GarmentStockEntry[] = [
  { model: "oversize", color: "Negra", grammageG: 240, fit: "oversize" },
  { model: "oversize", color: "Blanca", grammageG: 240, fit: "oversize" },
  { model: "oversize", color: "Crudo", grammageG: 240, fit: "oversize" },
  { model: "oversize", color: "Hueso", grammageG: 240, fit: "oversize" },
  { model: "oversize", color: "Chocolate", grammageG: 240, fit: "oversize" },
  { model: "oversize", color: "Gris Azulada", grammageG: 240, fit: "oversize" },
  { model: "oversize", color: "Chocolate", grammageG: 220, fit: "oversize" },
  { model: "oversize", color: "Negro", grammageG: 220, fit: "oversize" },
  { model: "oversize", color: "Blanco", grammageG: 220, fit: "oversize" },
  { model: "oversize", color: "Gris Grafito", grammageG: 220, fit: "oversize" },
  { model: "oversize", color: "Verde Olivo", grammageG: 220, fit: "oversize" },
  { model: "oversize", color: "Beige", grammageG: 220, fit: "oversize" },
  { model: "oversize", color: "Rojo", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Azul Rey", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Negra", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Blanco", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Chocolate", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Petroleo", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Rosa Baby", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Verde Militar", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Vino", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Azul Cielo", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Arena", grammageG: 200, fit: "oversize" },
  { model: "oversize", color: "Gris Grafito", grammageG: 200, fit: "oversize" },
  {
    model: "long_sleeve_oversize",
    color: "Gris Grafito",
    grammageG: 220,
    fit: "oversize",
  },
  {
    model: "long_sleeve_oversize",
    color: "Negra",
    grammageG: 220,
    fit: "oversize",
  },
  {
    model: "long_sleeve_oversize",
    color: "Blanca",
    grammageG: 220,
    fit: "oversize",
  },
  {
    model: "long_sleeve_oversize",
    color: "Beige",
    grammageG: 220,
    fit: "oversize",
  },
  {
    model: "hoodie_semi_oversize",
    color: "Negra",
    grammageG: 300,
    fit: "semi-oversize",
  },
  {
    model: "hoodie_oversize",
    color: "Negra",
    grammageG: 400,
    fit: "oversize",
  },
  { model: "regular", color: "Negra", grammageG: 200, fit: "regular" },
];

const GARMENT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const GARMENT_FITS = ["oversize", "semi-oversize", "regular"];
const CUSTOMIZER_ANALYTICS_SESSION_KEY = "saut.customizer.analytics.session";

const COLOR_SLUG_MAP: Record<string, string> = {
  negra: "negra",
  negro: "negra",
  blanca: "blanca",
  blanco: "blanca",
  crudo: "crudo",
  hueso: "hueso",
  chocolate: "chocolate",
  "gris azulada": "gris-azulada",
  "gris grafito": "gris-grafito",
  "verde olivo": "verde-olivo",
  beige: "beige",
  rojo: "rojo",
  "azul rey": "azul-rey",
  petroleo: "petroleo",
  "rosa baby": "rosa-baby",
  "verde militar": "verde-militar",
  vino: "vino",
  "azul cielo": "azul-cielo",
  arena: "arena",
};

function removeDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeColorKey(value: string): string {
  return removeDiacritics(value).toLowerCase().trim().replace(/\s+/g, " ");
}

function colorSlugForValue(color: string): string {
  const key = normalizeColorKey(color);
  return COLOR_SLUG_MAP[key] ?? key.replace(/\s+/g, "-");
}

function uniqueList<T extends string | number>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function stockByModel(model: string): GarmentStockEntry[] {
  return GARMENT_STOCK.filter((entry) => entry.model === model);
}

function grammageOptionsForModel(model: string): number[] {
  return uniqueList(stockByModel(model).map((entry) => entry.grammageG)).sort(
    (a, b) => b - a
  );
}

function colorOptionsForModel(model: string, grammageG: number): string[] {
  const byModel = stockByModel(model);
  const colors = byModel
    .filter((entry) => entry.grammageG === grammageG)
    .map((entry) => entry.color);
  if (colors.length > 0) return uniqueList(colors);
  return uniqueList(byModel.map((entry) => entry.color));
}

function fitOptionsForModel(model: string): string[] {
  const fits = uniqueList(stockByModel(model).map((entry) => entry.fit));
  if (fits.length > 0) return fits;
  return GARMENT_FITS;
}

function sanitizeGarmentForStock(
  garment: CustomizerGarmentState
): Pick<CustomizerGarmentState, "garmentModel" | "grammageG" | "color" | "fit"> {
  const garmentModel =
    stockByModel(garment.garmentModel).length > 0 ? garment.garmentModel : "oversize";

  const grammageOptions = grammageOptionsForModel(garmentModel);
  const grammageG = grammageOptions.includes(garment.grammageG)
    ? garment.grammageG
    : (grammageOptions[0] ?? garment.grammageG);

  const colorOptions = colorOptionsForModel(garmentModel, grammageG);
  const color = colorOptions.includes(garment.color)
    ? garment.color
    : (colorOptions[0] ?? garment.color);

  const fitOptions = fitOptionsForModel(garmentModel);
  const fit = fitOptions.includes(garment.fit) ? garment.fit : (fitOptions[0] ?? garment.fit);

  return {
    garmentModel,
    grammageG,
    color,
    fit,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(input: string, maxLen: number): string {
  const trimmed = input.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen);
}

function baseShirtImageForGarment(garment: CustomizerGarmentState): string {
  const model = garment.garmentModel.toLowerCase();
  const colorSlug = colorSlugForValue(garment.color);

  if (model === "hoodie_oversize") return "/tiles/hoodie-oversize-negra.webp";
  if (model === "hoodie_semi_oversize") return "/tiles/hoodie-semi-orversize-negra.webp";
  if (model === "long_sleeve_oversize") return `/tiles/manga-larga-${colorSlug}.webp`;
  if (model === "regular") return "/tiles/regular-negra.webp";
  return `/tiles/oversize-${colorSlug}.webp`;
}

function printAreaForModel(model: string): { front: PrintArea; back: PrintArea } {
  const normalized = model.toLowerCase();
  if (normalized.startsWith("hoodie")) {
    return {
      front: { xPct: 34, yPct: 27, wPct: 32, hPct: 33 },
      back: { xPct: 32, yPct: 24, wPct: 36, hPct: 36 },
    };
  }
  if (normalized === "regular") {
    return {
      front: { xPct: 35, yPct: 26, wPct: 30, hPct: 32 },
      back: { xPct: 33, yPct: 24, wPct: 34, hPct: 34 },
    };
  }
  if (normalized === "long_sleeve_oversize") {
    return {
      front: { xPct: 34, yPct: 24, wPct: 32, hPct: 34 },
      back: { xPct: 32, yPct: 22, wPct: 36, hPct: 36 },
    };
  }
  return {
    front: { xPct: 34, yPct: 25, wPct: 32, hPct: 34 },
    back: { xPct: 32, yPct: 23, wPct: 36, hPct: 36 },
  };
}

function estimateUnitPrice(garment: CustomizerGarmentState): number {
  const model = garment.garmentModel.toLowerCase();
  const key = `${model}:${garment.grammageG}`;
  const fromTable = PRICE_BY_MODEL_GRAMMAGE[key];
  if (Number.isFinite(fromTable)) return fromTable;

  if (model.startsWith("hoodie")) {
    return garment.grammageG >= 400 ? 699 : garment.grammageG >= 300 ? 639 : 599;
  }
  if (model.includes("long_sleeve")) return garment.grammageG >= 220 ? 499 : 479;
  if (model.includes("regular")) return garment.grammageG >= 220 ? 419 : 399;
  return garment.grammageG >= 240 ? 479 : garment.grammageG >= 220 ? 459 : 439;
}

function createDuoCompanionGarment(
  source: CustomizerGarmentState,
  index: number
): CustomizerGarmentState {
  const garment = createNewGarment(index);
  return {
    ...garment,
    garmentModel: source.garmentModel,
    color: source.color,
    size: source.size,
    grammageG: source.grammageG,
    fit: source.fit,
    quantity: clamp(Math.round(source.quantity || 1), 1, 50),
    visualMode: "duo",
  };
}

function formatMoney(value: number): string {
  try {
    return value.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(value);
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer archivo"));
    reader.onload = () => {
      const out = typeof reader.result === "string" ? reader.result : "";
      if (!out) {
        reject(new Error("Archivo vacio"));
        return;
      }
      resolve(out);
    };
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar imagen"));
    image.src = src;
  });
}

async function renderSideOverlay(
  elements: CustomizerElement[]
): Promise<string | undefined> {
  if (elements.length === 0) return undefined;
  if (typeof document === "undefined") return undefined;

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  for (const element of elements) {
    const x = (element.xPct / 100) * canvas.width;
    const y = (element.yPct / 100) * canvas.height;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((element.rotationDeg * Math.PI) / 180);
    ctx.scale(element.scale, element.scale);

    if (element.type === "image") {
      try {
        const image = await loadImage(element.src);
        const maxBase = canvas.width * 0.34;
        const ratio = image.height / Math.max(1, image.width);
        const width = maxBase;
        const height = width * ratio;
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
      } catch {
        // ignore rendering failures for a single image
      }
    } else {
      const textElement = element as CustomizerTextElement;
      ctx.fillStyle = textElement.colorHex;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${textElement.fontWeight} ${textElement.fontSizePx}px ${textElement.fontFamily}`;
      ctx.fillText(textElement.text, 0, 0);
    }

    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

function readAccountId(): string | null {
  const session = getSession();
  return session?.accountId ?? null;
}

function ensureSideElements(
  garment: CustomizerGarmentState,
  side: CustomizerViewSide
): CustomizerElement[] {
  return garment.sides[side].elements;
}

function canvasRefKey(garmentId: string, side: CustomizerViewSide): string {
  return `${garmentId}:${side}`;
}

function getCustomizerAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(CUSTOMIZER_ANALYTICS_SESSION_KEY);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `customizer-${crypto.randomUUID()}`
      : `customizer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(CUSTOMIZER_ANALYTICS_SESSION_KEY, next);
  return next;
}

export function CustomizerStudio() {
  const { addItem, openCart } = useCart();

  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [savedDesigns, setSavedDesigns] = React.useState<SavedCustomizerDesign[]>([]);
  const [draft, setDraft] = React.useState<SavedCustomizerDesign | null>(null);

  const [selectedGarmentId, setSelectedGarmentId] = React.useState<string | null>(null);
  const [selectedSide, setSelectedSide] = React.useState<CustomizerViewSide>("front");
  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);

  const [textInput, setTextInput] = React.useState("SAUT");
  const [textFontFamily, setTextFontFamily] = React.useState(FONT_OPTIONS[0].value);
  const [textColorHex, setTextColorHex] = React.useState("#ffffff");
  const [textSizePx, setTextSizePx] = React.useState(92);
  const [textWeight, setTextWeight] = React.useState(900);

  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const [scaleDragState, setScaleDragState] = React.useState<ScaleDragState | null>(null);
  const [busyAddToCart, setBusyAddToCart] = React.useState(false);
  const [qualityModalScope, setQualityModalScope] = React.useState<CartQualityScope | null>(null);

  const printAreaRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const dragRafRef = React.useRef<number | null>(null);
  const pendingDragRef = React.useRef<{
    garmentId: string;
    side: CustomizerViewSide;
    elementId: string;
    xPct: number;
    yPct: number;
  } | null>(null);
  const analyticsSessionIdRef = React.useRef<string>("session-pending");
  const startedDesignIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    analyticsSessionIdRef.current = getCustomizerAnalyticsSessionId();
  }, []);

  React.useEffect(() => {
    const sync = () => setAccountId(readAccountId());
    sync();

    const onStorage = (event: StorageEvent) => {
      if (event.key === "saut.auth.session" || event.key === "login") sync();
    };
    const onCustom = () => sync();

    window.addEventListener("storage", onStorage);
    window.addEventListener("saut:auth", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("saut:auth", onCustom as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (accountId) {
      migrateGuestDesignsToAccount(accountId);
    }

    const loaded = loadCustomizerDesigns(accountId);
    queueMicrotask(() => {
      setSavedDesigns(loaded);
      if (loaded.length > 0) {
        const first = deepClone(loaded[0]);
        setDraft(first);
        setSelectedGarmentId(first.garments[0]?.id ?? null);
        setSelectedElementId(null);
        return;
      }

      const fresh = { ...createNewCustomizerDesign(), ownerAccountId: accountId };
      setDraft(fresh);
      setSelectedGarmentId(fresh.garments[0]?.id ?? null);
      setSelectedElementId(null);
    });
  }, [accountId]);

  React.useEffect(() => {
    if (!draft) return;
    const handle = window.setTimeout(() => {
      upsertCustomizerDesign(accountId, { ...draft, ownerAccountId: accountId });
      setSavedDesigns(loadCustomizerDesigns(accountId));
    }, 650);
    return () => window.clearTimeout(handle);
  }, [draft, accountId]);

  React.useEffect(() => {
    if (!draft) return;
    if (startedDesignIdsRef.current.has(draft.designId)) return;
    startedDesignIdsRef.current.add(draft.designId);

    const sessionId = analyticsSessionIdRef.current;
    void emitCustomizerEvent({
      eventType: "customizer_started",
      eventId: `customizer_started:${sessionId}:${draft.designId}`,
      sessionId,
      accountId,
      designId: draft.designId,
      garmentCount: draft.garments.length,
      payload: {
        source: "customizer_studio",
      },
    });
  }, [accountId, draft]);

  const activeGarment = React.useMemo(() => {
    if (!draft || !selectedGarmentId) return null;
    return draft.garments.find((garment) => garment.id === selectedGarmentId) ?? null;
  }, [draft, selectedGarmentId]);

  React.useEffect(() => {
    if (!draft) return;
    if (!selectedGarmentId || !draft.garments.some((garment) => garment.id === selectedGarmentId)) {
      queueMicrotask(() => setSelectedGarmentId(draft.garments[0]?.id ?? null));
    }
  }, [draft, selectedGarmentId]);

  const activeElements = React.useMemo(() => {
    if (!activeGarment) return [];
    return ensureSideElements(activeGarment, selectedSide);
  }, [activeGarment, selectedSide]);

  const selectedElement = React.useMemo(() => {
    if (!selectedElementId) return null;
    return activeElements.find((element) => element.id === selectedElementId) ?? null;
  }, [activeElements, selectedElementId]);

  const activeGarmentModel =
    activeGarment && stockByModel(activeGarment.garmentModel).length > 0
      ? activeGarment.garmentModel
      : GARMENT_MODEL_OPTIONS[0].value;
  const availableGrammageOptions = React.useMemo(
    () => grammageOptionsForModel(activeGarmentModel),
    [activeGarmentModel]
  );
  const activeGarmentGrammage = activeGarment?.grammageG ?? availableGrammageOptions[0] ?? 240;
  const availableColorOptions = React.useMemo(
    () => colorOptionsForModel(activeGarmentModel, activeGarmentGrammage),
    [activeGarmentGrammage, activeGarmentModel]
  );

  const selectedTextElement =
    selectedElement && selectedElement.type === "text" ? selectedElement : null;

  React.useEffect(() => {
    if (!selectedTextElement) return;
    queueMicrotask(() => {
      setTextInput(selectedTextElement.text);
      setTextFontFamily(selectedTextElement.fontFamily);
      setTextColorHex(selectedTextElement.colorHex);
      setTextSizePx(selectedTextElement.fontSizePx);
      setTextWeight(selectedTextElement.fontWeight);
    });
  }, [selectedTextElement]);

  const mutateDraft = React.useCallback(
    (updater: (current: SavedCustomizerDesign) => SavedCustomizerDesign) => {
      setDraft((current) => {
        if (!current) return current;
        return updater(current);
      });
    },
    []
  );

  React.useEffect(() => {
    if (!draft || !activeGarment) return;
    if (activeGarment.visualMode !== "duo") return;
    if (draft.garments.length >= 2) return;

    queueMicrotask(() => mutateDraft((current) => {
      if (current.garments.length >= 2) return current;
      const source =
        current.garments.find((garment) => garment.id === activeGarment.id) ??
        current.garments[0];
      if (!source) return current;
      const companion = createDuoCompanionGarment(source, current.garments.length);
      return {
        ...current,
        garments: [...current.garments, companion],
        updatedAt: nowIso(),
      };
    }));
  }, [activeGarment, draft, mutateDraft]);

  const mutateGarment = React.useCallback(
    (
      garmentId: string,
      updater: (garment: CustomizerGarmentState) => CustomizerGarmentState
    ) => {
      mutateDraft((current) => {
        const index = current.garments.findIndex((garment) => garment.id === garmentId);
        if (index < 0) return current;

        const now = nowIso();
        const nextGarment = {
          ...updater(current.garments[index]),
          updatedAt: now,
        };
        const garments = [...current.garments];
        garments[index] = nextGarment;

        return {
          ...current,
          garments,
          updatedAt: now,
        };
      });
    },
    [mutateDraft]
  );

  React.useEffect(() => {
    if (!activeGarment) return;
    const sanitized = sanitizeGarmentForStock(activeGarment);
    if (
      sanitized.garmentModel === activeGarment.garmentModel &&
      sanitized.grammageG === activeGarment.grammageG &&
      sanitized.color === activeGarment.color &&
      sanitized.fit === activeGarment.fit
    ) {
      return;
    }
    queueMicrotask(() => mutateGarment(activeGarment.id, (garment) => ({
      ...garment,
      ...sanitized,
    })));
  }, [activeGarment, mutateGarment]);

  const updateElement = React.useCallback(
    (
      garmentId: string,
      side: CustomizerViewSide,
      elementId: string,
      updater: (element: CustomizerElement) => CustomizerElement
    ) => {
      mutateGarment(garmentId, (garment) => {
        const sideState = garment.sides[side];
        return {
          ...garment,
          sides: {
            ...garment.sides,
            [side]: {
              ...sideState,
              elements: sideState.elements.map((element) =>
                element.id === elementId ? updater(element) : element
              ),
            },
          },
        };
      });
    },
    [mutateGarment]
  );

  const saveNow = React.useCallback(() => {
    if (!draft) return;
    const next = {
      ...draft,
      ownerAccountId: accountId,
      updatedAt: nowIso(),
    };
    upsertCustomizerDesign(accountId, next);
    setSavedDesigns(loadCustomizerDesigns(accountId));
    setDraft(next);
    notify.success("Diseño guardado.");
  }, [draft, accountId]);

  const createNewDesign = React.useCallback(() => {
    const fresh = {
      ...createNewCustomizerDesign(),
      ownerAccountId: accountId,
    };
    setDraft(fresh);
    setSelectedGarmentId(fresh.garments[0]?.id ?? null);
    setSelectedSide("front");
    setSelectedElementId(null);
    upsertCustomizerDesign(accountId, fresh);
    setSavedDesigns(loadCustomizerDesigns(accountId));
    notify.success("Nuevo diseño creado.");
  }, [accountId]);

  const loadDesign = React.useCallback(
    (designId: string) => {
      const next = loadCustomizerDesigns(accountId).find(
        (item) => item.designId === designId
      );
      if (!next) return;
      const clone = deepClone(next);
      setDraft(clone);
      setSelectedGarmentId(clone.garments[0]?.id ?? null);
      setSelectedElementId(null);
      setSelectedSide("front");
      setSavedDesigns(loadCustomizerDesigns(accountId));
    },
    [accountId]
  );

  const duplicateActiveDesign = React.useCallback(() => {
    if (!draft) return;
    const duplicated = duplicateCustomizerDesign(accountId, draft);
    setSavedDesigns(loadCustomizerDesigns(accountId));
    setDraft(deepClone(duplicated));
    setSelectedGarmentId(duplicated.garments[0]?.id ?? null);
    setSelectedElementId(null);
    notify.success("Diseño duplicado.");
  }, [accountId, draft]);

  const deleteActiveDesign = React.useCallback(() => {
    if (!draft) return;
    removeCustomizerDesign(accountId, draft.designId);
    const remaining = loadCustomizerDesigns(accountId);
    setSavedDesigns(remaining);

    if (remaining.length > 0) {
      const next = deepClone(remaining[0]);
      setDraft(next);
      setSelectedGarmentId(next.garments[0]?.id ?? null);
      setSelectedElementId(null);
      notify.success("Diseño eliminado.");
      return;
    }

    const fresh = {
      ...createNewCustomizerDesign(),
      ownerAccountId: accountId,
    };
    setDraft(fresh);
    setSelectedGarmentId(fresh.garments[0]?.id ?? null);
    setSelectedElementId(null);
    notify.success("Diseño eliminado.");
  }, [accountId, draft]);

  const addGarment = React.useCallback(() => {
    if (!draft) return;
    if (draft.garments.length >= CUSTOMIZER_MAX_GARMENTS_PER_SESSION) {
      notify.warning("Límite de 4 diseños por sesión.");
      return;
    }
    const garment = createNewGarment(draft.garments.length);
    mutateDraft((current) => ({
      ...current,
      garments: [...current.garments, garment],
      updatedAt: nowIso(),
    }));
    setSelectedGarmentId(garment.id);
    setSelectedSide("front");
    setSelectedElementId(null);
  }, [draft, mutateDraft]);

  const removeActiveGarment = React.useCallback(() => {
    if (!draft || !activeGarment) return;
    if (draft.garments.length <= 1) {
      notify.warning("Debe existir al menos un diseño.");
      return;
    }

    const now = nowIso();
    const remainingBase = draft.garments.filter((garment) => garment.id !== activeGarment.id);
    const remaining =
      remainingBase.length === 1 && remainingBase[0]?.visualMode === "duo"
        ? [
            {
              ...remainingBase[0],
              visualMode: "single" as const,
              updatedAt: now,
            },
          ]
        : remainingBase;
    mutateDraft((current) => ({
      ...current,
      garments: remaining,
      updatedAt: now,
    }));
    setSelectedGarmentId(remaining[0]?.id ?? null);
    setSelectedElementId(null);
  }, [draft, activeGarment, mutateDraft]);

  const onUploadImages = React.useCallback(
    async (files: File[]) => {
      if (!activeGarment) return;
      if (files.length === 0) return;

      const nextElements = [...activeGarment.sides[selectedSide].elements];

      for (const file of files) {
        const src = await fileToDataUrl(file);
        const assetId = createCustomizerElementAssetId("img");
        const jitter = nextElements.length % 2 === 0 ? -5 : 5;
        nextElements.push({
          id: `el-${assetId}`,
          assetId,
          type: "image",
          src,
          fileName: file.name,
          xPct: clamp(50 + jitter, 8, 92),
          yPct: clamp(50 + jitter * 0.25, 8, 92),
          scale: 0.72,
          rotationDeg: 0,
          createdAt: nowIso(),
        });
      }

      mutateGarment(activeGarment.id, (garment) => ({
        ...garment,
        sides: {
          ...garment.sides,
          [selectedSide]: {
            ...garment.sides[selectedSide],
            elements: nextElements,
          },
        },
      }));
    },
    [activeGarment, mutateGarment, selectedSide]
  );

  const updateSelectedText = React.useCallback(
    (
      updater: (element: CustomizerTextElement) => CustomizerTextElement,
      fallback?: () => void
    ) => {
      if (!activeGarment || !selectedTextElement) {
        fallback?.();
        return;
      }

      updateElement(activeGarment.id, selectedSide, selectedTextElement.id, (element) => {
        if (element.type !== "text") return element;
        return updater(element);
      });
    },
    [activeGarment, selectedSide, selectedTextElement, updateElement]
  );

  const onTextInputChange = React.useCallback(
    (value: string) => {
      const normalized = normalizeText(value, 60);
      updateSelectedText(
        (element) => ({
          ...element,
          text: normalized,
        }),
        () => setTextInput(normalized)
      );
      if (selectedTextElement) setTextInput(normalized);
    },
    [selectedTextElement, updateSelectedText]
  );

  const onTextFontFamilyChange = React.useCallback(
    (fontFamily: string) => {
      updateSelectedText(
        (element) => ({
          ...element,
          fontFamily,
        }),
        () => setTextFontFamily(fontFamily)
      );
      if (selectedTextElement) setTextFontFamily(fontFamily);
    },
    [selectedTextElement, updateSelectedText]
  );

  const onTextColorChange = React.useCallback(
    (colorHex: string) => {
      updateSelectedText(
        (element) => ({
          ...element,
          colorHex,
        }),
        () => setTextColorHex(colorHex)
      );
      if (selectedTextElement) setTextColorHex(colorHex);
    },
    [selectedTextElement, updateSelectedText]
  );

  const onTextSizeChange = React.useCallback(
    (fontSizePx: number) => {
      const clamped = clamp(Math.round(fontSizePx), 24, 180);
      updateSelectedText(
        (element) => ({
          ...element,
          fontSizePx: clamped,
        }),
        () => setTextSizePx(clamped)
      );
      if (selectedTextElement) setTextSizePx(clamped);
    },
    [selectedTextElement, updateSelectedText]
  );

  const onTextWeightChange = React.useCallback(
    (fontWeight: number) => {
      const clamped = clamp(Math.round(fontWeight), 100, 900);
      updateSelectedText(
        (element) => ({
          ...element,
          fontWeight: clamped,
        }),
        () => setTextWeight(clamped)
      );
      if (selectedTextElement) setTextWeight(clamped);
    },
    [selectedTextElement, updateSelectedText]
  );

  const onAddText = React.useCallback(() => {
    if (!activeGarment) return;
    const text = normalizeText(textInput, 60);
    if (!text) {
      notify.warning("Escribe texto antes de agregar.");
      return;
    }

    const assetId = createCustomizerElementAssetId("txt");
    const element: CustomizerTextElement = {
      id: `el-${assetId}`,
      assetId,
      type: "text",
      text,
      fontFamily: textFontFamily,
      colorHex: textColorHex,
      fontSizePx: clamp(Math.round(textSizePx), 24, 180),
      fontWeight: clamp(Math.round(textWeight), 100, 900),
      xPct: 50,
      yPct: 50,
      scale: 1,
      rotationDeg: 0,
      createdAt: nowIso(),
    };

    mutateGarment(activeGarment.id, (garment) => ({
      ...garment,
      sides: {
        ...garment.sides,
        [selectedSide]: {
          ...garment.sides[selectedSide],
          elements: [...garment.sides[selectedSide].elements, element],
        },
      },
    }));
    setSelectedElementId(element.id);
  }, [
    activeGarment,
    mutateGarment,
    selectedSide,
    textColorHex,
    textFontFamily,
    textInput,
    textSizePx,
    textWeight,
  ]);

  const deleteElementById = React.useCallback(
    (garmentId: string, side: CustomizerViewSide, elementId: string) => {
      mutateGarment(garmentId, (garment) => ({
        ...garment,
        sides: {
          ...garment.sides,
          [side]: {
            ...garment.sides[side],
            elements: garment.sides[side].elements.filter((element) => element.id !== elementId),
          },
        },
      }));
    },
    [mutateGarment]
  );

  const deleteSelectedElement = React.useCallback(() => {
    if (!activeGarment || !selectedElementId) return;
    deleteElementById(activeGarment.id, selectedSide, selectedElementId);
    setSelectedElementId(null);
  }, [activeGarment, deleteElementById, selectedElementId, selectedSide]);

  const removeAllSideImages = React.useCallback(() => {
    if (!activeGarment) return;
    mutateGarment(activeGarment.id, (garment) => ({
      ...garment,
      sides: {
        ...garment.sides,
        [selectedSide]: {
          ...garment.sides[selectedSide],
          elements: garment.sides[selectedSide].elements.filter(
            (element) => element.type !== "image"
          ),
        },
      },
    }));
    setSelectedElementId(null);
  }, [activeGarment, mutateGarment, selectedSide]);

  React.useEffect(() => {
    if (!dragState) return;

    const flushPendingDrag = () => {
      const pending = pendingDragRef.current;
      if (!pending) return;
      pendingDragRef.current = null;
      updateElement(
        pending.garmentId,
        pending.side,
        pending.elementId,
        (element) => ({
          ...element,
          xPct: pending.xPct,
          yPct: pending.yPct,
        })
      );
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;
      event.preventDefault();

      const deltaX = event.clientX - dragState.startClientX;
      const deltaY = event.clientY - dragState.startClientY;
      const xPct =
        dragState.startXPct + (deltaX / Math.max(1, dragState.areaRect.width)) * 100;
      const yPct =
        dragState.startYPct + (deltaY / Math.max(1, dragState.areaRect.height)) * 100;

      pendingDragRef.current = {
        garmentId: dragState.garmentId,
        side: dragState.side,
        elementId: dragState.elementId,
        xPct,
        yPct,
      };

      if (dragRafRef.current !== null) return;
      dragRafRef.current = window.requestAnimationFrame(() => {
        dragRafRef.current = null;
        flushPendingDrag();
      });
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      flushPendingDrag();
      setDragState(null);
    };

    const onBlur = () => {
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      flushPendingDrag();
      setDragState(null);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      pendingDragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [dragState, updateElement]);

  const startDrag = React.useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      element: CustomizerElement,
      garmentId: string,
      side: CustomizerViewSide
    ) => {
      const area = printAreaRefs.current[canvasRefKey(garmentId, side)]?.getBoundingClientRect();
      if (!area) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      pendingDragRef.current = null;
      setScaleDragState(null);
      setSelectedGarmentId(garmentId);
      setSelectedSide(side);
      setSelectedElementId(element.id);
      setDragState({
        pointerId: event.pointerId,
        garmentId,
        side,
        elementId: element.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startXPct: element.xPct,
        startYPct: element.yPct,
        areaRect: area,
      });
    },
    []
  );

  React.useEffect(() => {
    if (!scaleDragState) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== scaleDragState.pointerId) return;
      event.preventDefault();

      const distance = Math.hypot(
        event.clientX - scaleDragState.centerClientX,
        event.clientY - scaleDragState.centerClientY
      );
      const ratio = distance / Math.max(8, scaleDragState.startDistance);
      const nextScale = clamp(scaleDragState.startScale * ratio, 0.2, 5);

      updateElement(
        scaleDragState.garmentId,
        scaleDragState.side,
        scaleDragState.elementId,
        (element) => ({
          ...element,
          scale: nextScale,
        })
      );
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== scaleDragState.pointerId) return;
      setScaleDragState(null);
    };

    const onBlur = () => setScaleDragState(null);

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [scaleDragState, updateElement]);

  const startScaleDrag = React.useCallback(
    (
      event: React.PointerEvent<HTMLButtonElement>,
      element: CustomizerElement,
      garmentId: string,
      side: CustomizerViewSide
    ) => {
      const area = printAreaRefs.current[canvasRefKey(garmentId, side)]?.getBoundingClientRect();
      if (!area) return;

      const centerClientX = area.left + (element.xPct / 100) * area.width;
      const centerClientY = area.top + (element.yPct / 100) * area.height;
      const startDistance = Math.max(
        8,
        Math.hypot(event.clientX - centerClientX, event.clientY - centerClientY)
      );

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDragState(null);
      setSelectedGarmentId(garmentId);
      setSelectedSide(side);
      setSelectedElementId(element.id);
      setScaleDragState({
        pointerId: event.pointerId,
        garmentId,
        side,
        elementId: element.id,
        startScale: element.scale,
        centerClientX,
        centerClientY,
        startDistance,
      });
    },
    []
  );

  const addGarmentToCart = React.useCallback(
    async (garment: CustomizerGarmentState, improveQuality: boolean) => {
      if (!draft) return;

      const [frontOverlay, backOverlay] = await Promise.all([
        renderSideOverlay(garment.sides.front.elements),
        renderSideOverlay(garment.sides.back.elements),
      ]);

      const baseImage = baseShirtImageForGarment(garment);
      const printArea = printAreaForModel(garment.garmentModel);
      const unitPrice = estimateUnitPrice(garment);
      const garmentIndex = draft.garments.findIndex((item) => item.id === garment.id);
      const designLabel = garmentIndex >= 0 ? `Diseño ${garmentIndex + 1}` : garment.label;

      const snapshot = {
        kind: "customizer_v1",
        design_id: draft.designId,
        design_title: draft.title,
        garment_id: garment.id,
        garment_type: garment.garmentType,
        garment_model: garment.garmentModel,
        color: garment.color,
        size: garment.size,
        grammage_g: garment.grammageG,
        fit: garment.fit,
        quantity: garment.quantity,
        visual_mode: garment.visualMode,
        improve_quality: improveQuality,
        note: garment.note,
        front: garment.sides.front.elements,
        back: garment.sides.back.elements,
        frozen_at: nowIso(),
      };

      addItem({
        productId: `customized-${draft.designId}-${garment.id}`,
        lineKeySuffix: `${garment.id}-${Date.now()}`,
        name: `${draft.title} · ${designLabel}`,
        imageSrc: baseImage,
        imageFrontSrc: baseImage,
        imageBackSrc: baseImage,
        imageFrontOverlaySrc: frontOverlay,
        imageBackOverlaySrc: backOverlay,
        frontPrintArea: printArea.front,
        backPrintArea: printArea.back,
        unitPrice,
        quantity: clamp(Math.round(garment.quantity), 1, 50),
        selections: [
          { label: "Tipo", value: "Personalizado" },
          { label: "Modelo", value: garment.garmentModel },
          { label: "Color", value: garment.color },
          { label: "Talla", value: garment.size },
          { label: "Gramaje", value: `${garment.grammageG}g` },
          { label: "Vista", value: garment.visualMode === "duo" ? "Duo" : "Individual" },
          {
            label: "Calidad",
            value: improveQuality ? "Mejorar calidad" : "Tal cual",
          },
        ],
        customizerSnapshot: snapshot,
      });

      const sessionId = analyticsSessionIdRef.current;
      void emitCustomizerEvent({
        eventType: "customizer_added_to_cart",
        eventId: `customizer_added_to_cart:${sessionId}:${draft.designId}:${garment.id}:${Date.now()}`,
        sessionId,
        accountId,
        designId: draft.designId,
        garmentCount: 1,
        payload: {
          garment_id: garment.id,
          visual_mode: garment.visualMode,
          source: "customizer_studio",
        },
      });
    },
    [accountId, addItem, draft]
  );

  const addCurrentGarmentToCart = React.useCallback(async (improveQuality: boolean) => {
    if (!activeGarment || !draft) return;
    const garmentsToAdd =
      activeGarment.visualMode === "duo"
        ? [
            activeGarment,
            ...draft.garments.filter((garment) => garment.id !== activeGarment.id),
          ]
            .slice(0, 2)
            .sort(
              (a, b) =>
                draft.garments.findIndex((garment) => garment.id === a.id) -
                draft.garments.findIndex((garment) => garment.id === b.id)
            )
        : [activeGarment];

    setBusyAddToCart(true);
    try {
      for (const garment of garmentsToAdd) {
        await addGarmentToCart(garment, improveQuality);
      }
      openCart();
      notify.success("Diseño personalizado agregado al carrito.");
      saveNow();
    } finally {
      setBusyAddToCart(false);
    }
  }, [activeGarment, addGarmentToCart, draft, openCart, saveNow]);

  const addSessionToCart = React.useCallback(async (improveQuality: boolean) => {
    if (!draft) return;
    setBusyAddToCart(true);
    try {
      for (const garment of draft.garments) {
        await addGarmentToCart(garment, improveQuality);
      }
      openCart();
      notify.success("Sesión completa agregada al carrito.");
      saveNow();
    } finally {
      setBusyAddToCart(false);
    }
  }, [addGarmentToCart, draft, openCart, saveNow]);

  const confirmQualityChoice = React.useCallback(
    async (improveQuality: boolean) => {
      if (!qualityModalScope) return;
      const scope = qualityModalScope;
      setQualityModalScope(null);
      if (scope === "active") {
        await addCurrentGarmentToCart(improveQuality);
        return;
      }
      await addSessionToCart(improveQuality);
    },
    [addCurrentGarmentToCart, addSessionToCart, qualityModalScope]
  );

  if (!draft || !activeGarment) {
    return (
      <div className="w-full px-4 py-8 sm:px-8 lg:px-14">
        <div className="rounded-[20px] border border-hairline bg-[rgba(255,255,255,.45)] p-6 text-[13px] text-mute">
          Cargando personalizador...
        </div>
      </div>
    );
  }

  const duoGarments = [
    activeGarment,
    ...draft.garments.filter((garment) => garment.id !== activeGarment.id),
  ]
    .slice(0, 2)
    .sort(
      (a, b) =>
        draft.garments.findIndex((garment) => garment.id === a.id) -
        draft.garments.findIndex((garment) => garment.id === b.id)
    );
  const isDuoMode = activeGarment.visualMode === "duo";
  const canvasCards =
    isDuoMode
      ? duoGarments.map((garment, index) => ({
          garment,
          side: selectedSide,
          label: `Playera ${index + 1} · ${selectedSide === "front" ? "Frontal" : "Trasera"}`,
        }))
      : [
          {
            garment: activeGarment,
            side: selectedSide,
            label: selectedSide === "front" ? "Frontal" : "Trasera",
          },
        ];

  const pricingGarments =
    isDuoMode && duoGarments.length === 1 ? [duoGarments[0], duoGarments[0]] : isDuoMode ? duoGarments : [activeGarment];
  const designTotalPrice = pricingGarments.reduce(
    (sum, garment) => sum + estimateUnitPrice(garment) * clamp(Math.round(garment.quantity), 1, 50),
    0
  );
  const activeSideImages = activeGarment.sides[selectedSide].elements.filter(
    (element): element is Extract<CustomizerElement, { type: "image" }> =>
      element.type === "image"
  );
  const activeGarmentImageCounts = countGarmentImages(activeGarment);

  const textPreviewValue = selectedTextElement?.text || textInput || "Texto de muestra";
  const textPreviewFontFamily = selectedTextElement?.fontFamily ?? textFontFamily;
  const textPreviewColor = selectedTextElement?.colorHex ?? textColorHex;
  const textPreviewSize = selectedTextElement?.fontSizePx ?? textSizePx;
  const textPreviewWeight = selectedTextElement?.fontWeight ?? textWeight;

  return (
    <main className="min-h-[calc(100dvh-104px)] w-full p-2.5 sm:p-3 lg:h-[calc(100dvh-104px)] lg:overflow-hidden">
      <div className="flex h-full flex-col gap-3">
      <section className="shrink-0 rounded-[8px] bg-charcoal p-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-primary">
              Estudio SAUT
            </p>
            <h1 className="saut-display mt-1 text-[24px] uppercase sm:text-[30px]">
              Diseña tu playera
            </h1>
            <p className="mt-1 text-[11px] text-white/62">
              Hasta {CUSTOMIZER_MAX_GARMENTS_PER_SESSION} diseños por sesión · máximo {MAX_UPLOAD_MB}
              MB por imagen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" shadow="none" caps className="h-11 rounded-[7px] border border-white/25 bg-white/10 px-4 text-[10px] text-white hover:bg-white/20" onClick={saveNow}>
              Guardar ahora
            </Button>
            <Button type="button" size="sm" shadow="none" caps variant="primary" className="h-11 rounded-[7px] border border-primary px-4 text-[10px] hover:bg-white" onClick={createNewDesign}>
              Nuevo diseño
            </Button>
            <Button type="button" size="sm" shadow="none" caps className="h-11 rounded-[7px] border border-white/25 bg-white/10 px-4 text-[10px] text-white hover:bg-white/20" onClick={duplicateActiveDesign}>
              Duplicar
            </Button>
            <Button type="button" size="sm" shadow="none" caps variant="danger" className="h-11 rounded-[7px] border border-red-300/50 bg-red-950/30 px-4 text-[10px] text-red-100 hover:bg-red-950/50" onClick={deleteActiveDesign}>
              Eliminar
            </Button>
          </div>
        </div>

      </section>

      <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="order-2 flex min-h-0 flex-col rounded-[8px] border border-hairline bg-white p-2.5 lg:order-1 lg:overflow-auto">
          <div className="rounded-[12px] border border-hairline bg-white/80 p-2.5">
            <h2 className="text-[12px] font-black uppercase tracking-[0.12em] text-ink">
              Resumen
            </h2>
            <p className="mt-1 text-[11px] font-black text-charcoal">
              Precio actual: ${formatMoney(designTotalPrice)}
            </p>
            <p className="text-[10px] text-[rgba(8,10,13,.62)]">
              Modo activo: {isDuoMode ? "Dúo (2 playeras)" : "Individual (1 playera)"}
            </p>
            <div className="mt-2 space-y-1.5">
              {draft.garments.map((garment, idx) => {
                const counts = countGarmentImages(garment);
                return (
                  <div
                    key={`summary-${garment.id}`}
                    className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/75 px-2 py-1.5"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-ink">
                      Diseño {idx + 1}
                    </p>
                    <p className="text-[10px] text-[rgba(8,10,13,.68)]">
                      Frontales: {counts.front}
                    </p>
                    <p className="text-[10px] text-[rgba(8,10,13,.68)]">
                      Traseras: {counts.back}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <h2 className="text-[13px] font-black uppercase tracking-[0.12em] text-ink">
              Mis diseños
            </h2>
            <span className="rounded-full border border-hairline bg-white/75 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-ink">
              {savedDesigns.length}
            </span>
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-auto pr-1">
            {savedDesigns.map((design) => {
              const active = draft.designId === design.designId;
              return (
                <button
                  key={design.designId}
                  type="button"
                  onClick={() => loadDesign(design.designId)}
                  className={[
                    "w-full rounded-[12px] border px-3 py-2.5 text-left transition",
                    active
                      ? "border-[rgba(5,122,168,.38)] bg-[rgba(5,122,168,.14)]"
                      : "border-hairline bg-white/75 hover:bg-white",
                  ].join(" ")}
                >
                  <p className="truncate text-[11px] font-black uppercase tracking-[0.10em] text-ink">
                    {design.title}
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.02em] text-[rgba(8,10,13,.62)]">
                    {design.garments.length} diseño
                    {design.garments.length === 1 ? "" : "s"} ·{" "}
                    {new Date(design.updatedAt).toLocaleString("es-MX", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-3 shrink-0 rounded-[12px] border border-hairline bg-white/70 p-2.5">
            <TextField
              size="sm"
              label="Título del diseño"
              value={draft.title}
              onChange={(event) =>
                mutateDraft((current) => ({
                  ...current,
                  title: normalizeText(event.target.value, 90) || "Mi dise\u00f1o personalizado",
                  updatedAt: nowIso(),
                }))
              }
              maxLength={90}
              shellClassName="h-10 rounded-[10px] bg-white px-0"
              inputClassName="px-3 text-[12px]"
            />
            <p className="mt-1 text-[10px] tracking-[0.02em] text-[rgba(8,10,13,.58)]">
              Guardado {accountId ? "ligado a tu cuenta" : "local para invitado"}.
            </p>
          </div>
        </aside>

        <section className="order-1 flex min-h-0 flex-col overflow-hidden rounded-[8px] border border-hairline bg-white p-2 lg:order-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {draft.garments.map((garment, index) => {
                const active = garment.id === activeGarment.id;
                return (
                  <Button
                    key={garment.id}
                    type="button"
                    size="pill"
                    shadow="none"
                    caps
                    onClick={() => {
                      setSelectedGarmentId(garment.id);
                      setSelectedElementId(null);
                    }}
                    className={[
                      "h-9 rounded-[999px] border px-3 text-[10px] font-black uppercase tracking-[0.12em]",
                      active
                        ? "border-[rgba(5,122,168,.38)] bg-[rgba(5,122,168,.16)] text-charcoal"
                        : "border-hairline bg-white/80 text-ink",
                    ].join(" ")}
                  >
                    {`Diseño ${index + 1}`}
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="pill" shadow="none" caps className="h-9 border border-hairline bg-white/80 px-3 text-[10px]" onClick={addGarment}>
                + Diseño
              </Button>
              <Button type="button" size="pill" shadow="none" caps variant="danger" className="h-9 border border-[rgba(168,43,43,.35)] bg-[rgba(168,43,43,.1)] px-3 text-[10px] text-[rgb(120,24,24)]" onClick={removeActiveGarment}>
                Quitar diseño
              </Button>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <SelectField
              size="sm"
              label="Modelo"
              value={activeGarment.garmentModel}
              options={GARMENT_MODEL_OPTIONS}
              onChange={(event) =>
                mutateGarment(activeGarment.id, (garment) => {
                  const nextModel = event.target.value;
                  const candidate = {
                    ...garment,
                    garmentModel: nextModel,
                  };
                  return {
                    ...candidate,
                    ...sanitizeGarmentForStock(candidate),
                  };
                })
              }
              shellClassName="h-[36px] rounded-[10px] px-2.5"
              selectClassName="text-[11px]"
              wrapperClassName="min-w-0"
            />
            <SelectField
              size="sm"
              label="Color"
              value={activeGarment.color}
              options={availableColorOptions.map((color) => ({ value: color, label: color }))}
              onChange={(event) =>
                mutateGarment(activeGarment.id, (garment) => ({
                  ...garment,
                  color: event.target.value,
                }))
              }
              disabled={availableColorOptions.length <= 1}
              shellClassName="h-[36px] rounded-[10px] px-2.5"
              selectClassName="text-[11px]"
              wrapperClassName="min-w-0"
            />
            <SelectField
              size="sm"
              label="Talla"
              value={activeGarment.size}
              options={GARMENT_SIZES.map((size) => ({ value: size, label: size }))}
              onChange={(event) =>
                mutateGarment(activeGarment.id, (garment) => ({
                  ...garment,
                  size: event.target.value,
                }))
              }
              shellClassName="h-[36px] rounded-[10px] px-2.5"
              selectClassName="text-[11px]"
              wrapperClassName="min-w-0"
            />
            <SelectField
              size="sm"
              label="Gramaje"
              value={String(activeGarment.grammageG)}
              options={availableGrammageOptions.map((grammage) => ({
                value: String(grammage),
                label: `${grammage}g`,
              }))}
              onChange={(event) =>
                mutateGarment(activeGarment.id, (garment) => {
                  const nextGrammage = Number(event.target.value);
                  const candidate = {
                    ...garment,
                    grammageG: nextGrammage,
                  };
                  const { color } = sanitizeGarmentForStock(candidate);
                  return {
                    ...candidate,
                    color,
                  };
                })
              }
              disabled={availableGrammageOptions.length <= 1}
              shellClassName="h-[36px] rounded-[10px] px-2.5"
              selectClassName="text-[11px]"
              wrapperClassName="min-w-0"
            />
            <SelectField
              size="sm"
              label="Cantidad"
              value={String(activeGarment.quantity)}
              options={Array.from({ length: 50 }, (_, idx) => {
                const value = String(idx + 1);
                return { value, label: value };
              })}
              onChange={(event) =>
                mutateGarment(activeGarment.id, (garment) => ({
                  ...garment,
                  quantity: clamp(Math.round(Number(event.target.value) || 1), 1, 50),
                }))
              }
              shellClassName="h-[36px] rounded-[10px] px-2.5"
              selectClassName="text-[11px]"
              wrapperClassName="min-w-0"
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="pill"
              shadow="none"
              caps
              onClick={() => {
                setSelectedSide("front");
                setSelectedElementId(null);
              }}
              className={[
                "h-9 rounded-[999px] border px-3 text-[10px] font-black uppercase tracking-[0.12em]",
                selectedSide === "front"
                  ? "border-[rgba(5,122,168,.38)] bg-[rgba(5,122,168,.16)] text-charcoal"
                  : "border-hairline bg-white/80 text-ink",
              ].join(" ")}
            >
              Frente
            </Button>
            <Button
              type="button"
              size="pill"
              shadow="none"
              caps
              onClick={() => {
                setSelectedSide("back");
                setSelectedElementId(null);
              }}
              className={[
                "h-9 rounded-[999px] border px-3 text-[10px] font-black uppercase tracking-[0.12em]",
                selectedSide === "back"
                  ? "border-[rgba(5,122,168,.38)] bg-[rgba(5,122,168,.16)] text-charcoal"
                  : "border-hairline bg-white/80 text-ink",
              ].join(" ")}
            >
              Espalda
            </Button>
            <Button
              type="button"
              size="pill"
              shadow="none"
              caps
              onClick={() =>
                mutateDraft((current) => {
                  const index = current.garments.findIndex(
                    (garment) => garment.id === activeGarment.id
                  );
                  if (index < 0) return current;

                  const garments = [...current.garments];
                  const nextMode =
                    garments[index].visualMode === "single" ? "duo" : "single";
                  const now = nowIso();

                  garments[index] = {
                    ...garments[index],
                    visualMode: nextMode,
                    updatedAt: now,
                  };

                  if (nextMode === "duo" && garments.length < 2) {
                    garments.push(createDuoCompanionGarment(garments[index], garments.length));
                  }

                  if (nextMode === "duo") {
                    const partnerIndex = garments.findIndex((_, garmentIndex) => garmentIndex !== index);
                    if (partnerIndex >= 0) {
                      garments[partnerIndex] = {
                        ...garments[partnerIndex],
                        visualMode: "duo",
                        updatedAt: now,
                      };
                    }
                  }
                  if (nextMode === "single" && garments.length === 2) {
                    const companionIndex = index === 0 ? 1 : 0;
                    if (garments[companionIndex]?.visualMode === "duo") {
                      garments.splice(companionIndex, 1);
                    }
                  }

                  return {
                    ...current,
                    garments,
                    updatedAt: nowIso(),
                  };
                })
              }
              className="h-9 rounded-[999px] border border-hairline bg-white/80 px-3 text-[10px] font-black uppercase tracking-[0.12em]"
            >
              {activeGarment.visualMode === "single" ? "Modo duo" : "Modo individual"}
            </Button>
          </div>

          <div
            className={[
              "mt-1.5 grid min-h-0 flex-1 content-start gap-1.5",
              isDuoMode ? "md:grid-cols-2" : "md:grid-cols-1 justify-items-center",
            ].join(" ")}
          >
            {canvasCards.map(({ garment, side, label }) => {
              const sideElements = garment.sides[side].elements;
              const sideIsActive = selectedSide === side && selectedGarmentId === garment.id;
              return (
                <div
                  key={canvasRefKey(garment.id, side)}
                  ref={(node) => {
                    printAreaRefs.current[canvasRefKey(garment.id, side)] = node;
                  }}
                  onPointerDown={() => {
                    setSelectedGarmentId(garment.id);
                    setSelectedSide(side);
                    if (!sideIsActive) setSelectedElementId(null);
                  }}
                  className={[
                    "relative w-full overflow-hidden rounded-[18px] border border-hairline",
                    isDuoMode
                      ? "mx-auto h-[clamp(300px,44vh,460px)] max-w-[460px]"
                      : "mx-auto h-[clamp(360px,56vh,620px)] max-w-[760px]",
                    "bg-[linear-gradient(160deg,rgba(255,255,255,.82),rgba(255,255,255,.56))]",
                    sideIsActive ? "border-[rgba(5,122,168,.52)] ring-1 ring-[rgba(5,122,168,.24)]" : "",
                  ].join(" ")}
                >
                  <img
                    src={baseShirtImageForGarment(garment)}
                    alt={`Playera ${label}`}
                    className="absolute inset-0 h-full w-full object-contain p-0"
                    style={{
                      transform: isDuoMode ? "translateY(-0.5%) scale(1.08)" : "scale(1.1)",
                      transformOrigin: "center center",
                    }}
                    draggable={false}
                  />
                  <div className="absolute left-2 top-2 rounded-[999px] border border-hairline bg-white/85 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.11em] text-ink">
                    {label}
                  </div>
                  {sideIsActive ? (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[rgb(255,217,66)] shadow-[0_0_0_3px_rgba(255,217,66,.28)]" />
                  ) : null}

                  <div
                    onPointerDown={() => {
                      setSelectedGarmentId(garment.id);
                      setSelectedSide(side);
                      setSelectedElementId(null);
                    }}
                    className="absolute overflow-visible"
                    style={{
                      left: "0%",
                      top: "0%",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {sideElements.map((element) => {
                      const active =
                        selectedElementId === element.id &&
                        selectedSide === side &&
                        selectedGarmentId === garment.id;
                      return (
                        <React.Fragment key={element.id}>
                          <div
                            onPointerDown={(event) => startDrag(event, element, garment.id, side)}
                            className={[
                              "absolute cursor-grab select-none touch-none will-change-transform",
                              active ? "ring-2 ring-[rgba(255,217,66,.85)]" : "",
                            ].join(" ")}
                            style={{
                              left: `${element.xPct}%`,
                              top: `${element.yPct}%`,
                              transform: `translate(-50%, -50%) rotate(${element.rotationDeg}deg) scale(${element.scale})`,
                              transformOrigin: "center center",
                            }}
                          >
                            {element.type === "image" ? (
                              <img
                                src={element.src}
                                alt={element.fileName}
                                draggable={false}
                                className="pointer-events-none max-h-[96px] max-w-[96px] object-contain"
                              />
                            ) : (
                              <div
                                className="pointer-events-none whitespace-nowrap"
                                style={{
                                  fontFamily: element.fontFamily,
                                  color: element.colorHex,
                                  fontSize: `${element.fontSizePx}px`,
                                  fontWeight: element.fontWeight,
                                  textShadow: "0 1px 2px rgba(0,0,0,.35)",
                                }}
                              >
                                {element.text}
                              </div>
                            )}
                            {active ? (
                              <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteElementById(garment.id, side, element.id);
                                  setSelectedElementId(null);
                                }}
                                className="absolute -right-2 -top-2 h-5 w-5 rounded-full border border-[rgba(168,43,43,.45)] bg-[rgba(168,43,43,.94)] text-[10px] font-black leading-none text-white"
                                aria-label="Eliminar elemento"
                              >
                                x
                              </button>
                            ) : null}
                            {active ? (
                              <button
                                type="button"
                                onPointerDown={(event) =>
                                  startScaleDrag(event, element, garment.id, side)
                                }
                                className="absolute -bottom-2 -right-2 h-5 w-5 cursor-se-resize rounded-full border border-white bg-[rgba(8,10,13,.88)] text-[9px] font-black leading-none text-white shadow-[0_2px_8px_rgba(0,0,0,.28)]"
                                style={{
                                  transform: `scale(${1 / Math.max(0.2, element.scale)})`,
                                  transformOrigin: "center center",
                                }}
                                aria-label="Cambiar tamaño"
                              >
                                <span className="block leading-[18px]">+</span>
                              </button>
                            ) : null}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        <aside
          onPointerDown={() => {
            setDragState(null);
            setScaleDragState(null);
          }}
          className="order-3 min-h-0 overflow-auto rounded-[8px] border border-hairline bg-white p-2.5"
        >
          <h2 className="text-[13px] font-black uppercase tracking-[0.12em] text-ink">
            Herramientas
          </h2>

          <div className="mt-3 rounded-[12px] border border-hairline bg-white/78 p-3">
            <FileUpload
              label="Imágenes"
              acceptedTypes={["image/png", "image/jpeg", "image/webp"]}
              maxSize={MAX_UPLOAD_MB * 1024 * 1024}
              multiple
              value={[]}
              showPreview={false}
              onChange={(files) => void onUploadImages(files)}
              onError={(message) => notify.warning(message)}
              dropLabel="Arrastra imágenes aquí o selecciona para explorar"
              className="mt-0"
            />
            <div className="mt-2 rounded-[10px] border border-hairline bg-[rgba(245,246,248,.86)] p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink">
                  {selectedSide === "front" ? "Frontal" : "Trasera"}: {activeSideImages.length}
                </p>
                <Button
                  type="button"
                  size="sm"
                  shadow="none"
                  caps
                  variant="danger"
                  onClick={removeAllSideImages}
                  disabled={activeSideImages.length === 0}
                  className={[
                    "rounded-[8px] border px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em]",
                    activeSideImages.length === 0
                      ? "cursor-not-allowed border-hairline bg-white/70 text-[rgba(8,10,13,.4)]"
                      : "border-[rgba(168,43,43,.35)] bg-[rgba(168,43,43,.10)] text-[rgb(120,24,24)]",
                  ].join(" ")}
                >
                  Quitar todas
                </Button>
              </div>
              <p className="mt-1 text-[9px] text-[rgba(8,10,13,.58)]">
                Total en este diseño: {activeGarmentImageCounts.total} imágenes
              </p>
              <div className="mt-2 max-h-[170px] space-y-1.5 overflow-auto pr-1">
                {activeSideImages.length > 0 ? (
                  activeSideImages.map((image) => (
                    <div
                      key={`img-${image.id}`}
                      className="flex items-center gap-2 rounded-[8px] border border-hairline bg-white px-2 py-1"
                    >
                      <img
                        src={image.src}
                        alt={image.fileName}
                        className="h-8 w-8 rounded-[6px] object-cover"
                      />
                      <p className="min-w-0 flex-1 truncate text-[10px] text-[rgba(8,10,13,.72)]">
                        {image.fileName}
                      </p>
                      <IconButton
                        size="icon"
                        shadow="none"
                        variant="danger"
                        label="Eliminar imagen"
                        onClick={() =>
                          deleteElementById(activeGarment.id, selectedSide, image.id)
                        }
                        className="h-6 w-6 rounded-full border border-[rgba(168,43,43,.35)] bg-[rgba(168,43,43,.10)] p-0 text-[10px] text-[rgb(120,24,24)]"
                      >
                        x
                      </IconButton>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-[rgba(8,10,13,.58)]">Sin imágenes en este lado.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-[12px] border border-hairline bg-white/78 p-3">
            <TextAreaField
              size="sm"
              rows={3}
              label={`Nota (${activeGarment.note.length}/${CUSTOMIZER_MAX_NOTE_LENGTH})`}
              value={activeGarment.note}
              onChange={(event) =>
                mutateGarment(activeGarment.id, (garment) => ({
                  ...garment,
                  note: normalizeText(event.target.value, CUSTOMIZER_MAX_NOTE_LENGTH),
                }))
              }
              shellClassName="rounded-[10px] bg-white px-0 py-0"
              textareaClassName="min-h-[74px] px-3 py-2 text-[12px]"
              wrapperClassName="min-w-0"
            />
          </div>

          <div className="mt-3 rounded-[12px] border border-hairline bg-white/78 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink">
              Texto
            </p>
            <TextField
              size="sm"
              value={textInput}
              onChange={(event) => onTextInputChange(event.target.value)}
              maxLength={60}
              placeholder="Escribe texto"
              aria-label="Texto para agregar"
              wrapperClassName="mt-2"
              shellClassName="h-10 rounded-[10px] bg-white px-0"
              inputClassName="px-3 text-[12px]"
            />
            <div className="mt-2 rounded-[10px] border border-hairline bg-[rgba(245,246,248,.9)] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.58)]">
                Previsualizacion
              </p>
              <p
                className="mt-1 truncate"
                style={{
                  fontFamily: textPreviewFontFamily,
                  color: textPreviewColor,
                  fontSize: `${textPreviewSize}px`,
                  fontWeight: textPreviewWeight,
                  lineHeight: 1.2,
                }}
              >
                {textPreviewValue}
              </p>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <SelectField
                size="sm"
                label="Fuente"
                value={textFontFamily}
                options={FONT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(event) => onTextFontFamilyChange(event.target.value)}
                shellClassName="h-[36px] rounded-[10px] px-2.5"
                selectClassName="text-[11px]"
                wrapperClassName="min-w-0"
              />
              <label className="saut-field">
                <span className="saut-form-label">Color</span>
                <input
                  type="color"
                  value={textColorHex}
                  onChange={(event) => onTextColorChange(event.target.value)}
                  className="saut-color-control h-10 w-full rounded-[10px] border border-hairline bg-white px-2"
                  aria-label="Color del texto"
                />
              </label>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <RangeField
                label="Tamaño"
                min={24}
                max={180}
                value={textSizePx}
                onChange={(event) => onTextSizeChange(Number(event.target.value))}
                className="mt-1 w-full"
                wrapperClassName="min-w-0"
                output={`${textSizePx}px`}
              />
              <label className="inline-flex items-center gap-2 rounded-[10px] border border-hairline bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.10em] text-ink">
                <CheckboxControl
                  checked={textWeight >= 700}
                  onChange={(event) => onTextWeightChange(event.target.checked ? 900 : 400)}
                />
                <span>Bold</span>
              </label>
            </div>
            <Button
              type="button"
              size="sm"
              shadow="none"
              variant="primary"
              fullWidth
              className="mt-2 h-9 rounded-[10px] border border-hairline bg-primary text-[10px]"
              onClick={onAddText}
            >
              {selectedTextElement ? "Agregar texto nuevo" : "Agregar texto"}
            </Button>
          </div>

          <div className="mt-3 rounded-[12px] border border-hairline bg-white/78 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink">
              Elemento seleccionado
            </p>

            {selectedElement ? (
              <div className="mt-2 space-y-2">
                <RangeField
                  label="Escala"
                  min={0.3}
                  max={5}
                  step={0.01}
                  value={selectedElement.scale}
                  onChange={(event) =>
                    updateElement(
                      activeGarment.id,
                      selectedSide,
                      selectedElement.id,
                      (element) => ({ ...element, scale: Number(event.target.value) })
                    )
                  }
                  className="mt-1 w-full"
                  output={`${selectedElement.scale.toFixed(2)}x`}
                />
                <RangeField
                  label="Rotación"
                  min={-180}
                  max={180}
                  step={1}
                  value={selectedElement.rotationDeg}
                  onChange={(event) =>
                    updateElement(
                      activeGarment.id,
                      selectedSide,
                      selectedElement.id,
                      (element) => ({ ...element, rotationDeg: Number(event.target.value) })
                    )
                  }
                  className="mt-1 w-full"
                  output={
                    <>
                      {Math.round(selectedElement.rotationDeg)}°{" "}
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(
                            activeGarment.id,
                            selectedSide,
                            selectedElement.id,
                            (element) => ({ ...element, rotationDeg: 0 })
                          )
                        }
                        className="rounded-[7px] border border-hairline bg-white px-2 py-0.5 text-[9px]"
                      >
                        0°
                      </button>
                    </>
                  }
                />
                {selectedElement.type === "text" ? (
                  <TextField
                    size="sm"
                    label="Texto"
                    value={selectedElement.text}
                    onChange={(event) =>
                      updateElement(
                        activeGarment.id,
                        selectedSide,
                        selectedElement.id,
                        (element) => ({
                          ...(element as CustomizerTextElement),
                          text: normalizeText(event.target.value, 60),
                        })
                      )
                    }
                    maxLength={60}
                    wrapperClassName="mt-1"
                    shellClassName="h-9 rounded-[10px] bg-white px-0"
                    inputClassName="px-3 text-[12px]"
                  />
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  shadow="none"
                  variant="danger"
                  fullWidth
                  className="h-9 rounded-[10px] border border-[rgba(168,43,43,.35)] bg-[rgba(168,43,43,.10)] text-[10px] text-[rgb(120,24,24)]"
                  onClick={deleteSelectedElement}
                >
                  Eliminar elemento
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-[rgba(8,10,13,.62)]">
                Selecciona un elemento en el canvas para ajustar escala/rotación.
              </p>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              size="sm"
              shadow="none"
              variant="primary"
              fullWidth
              disabled={busyAddToCart}
              onClick={() => setQualityModalScope("active")}
              className={[
                "h-10 w-full rounded-[12px] border border-hairline text-[11px] font-black uppercase tracking-[0.12em]",
                busyAddToCart
                  ? "cursor-wait bg-[rgba(255,255,255,.70)] text-[rgba(8,10,13,.55)]"
                  : "bg-primary text-ink",
              ].join(" ")}
            >
              Agregar diseño al carrito
            </Button>
            <Button
              type="button"
              size="sm"
              shadow="none"
              variant="blue"
              fullWidth
              disabled={busyAddToCart}
              onClick={() => setQualityModalScope("session")}
              className={[
                "h-10 w-full rounded-[12px] border border-hairline text-[11px] font-black uppercase tracking-[0.12em]",
                busyAddToCart
                  ? "cursor-wait bg-[rgba(255,255,255,.70)] text-[rgba(8,10,13,.55)]"
                  : "bg-info text-white",
              ].join(" ")}
            >
              Agregar sesión completa
            </Button>
          </div>
        </aside>
      </section>
      <Modal
        open={qualityModalScope !== null}
        onClose={() => setQualityModalScope(null)}
        title="¿Cómo quieres enviarlo?"
        description="Calidad de impresión"
        size="sm"
        contentClassName="text-[12px] text-[rgba(8,10,13,.68)]"
        footer={
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={busyAddToCart}
              isLoading={busyAddToCart}
              onClick={() => void confirmQualityChoice(false)}
            >
              Tal cual lo subí
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={busyAddToCart}
              onClick={() => void confirmQualityChoice(true)}
            >
              Mejorar calidad
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="sm:col-span-2"
              disabled={busyAddToCart}
              onClick={() => setQualityModalScope(null)}
            >
              Cancelar
            </Button>
          </div>
        }
      >
        Puedes enviarlo tal cual lo subiste o pedir que nuestros diseñadores mejoren un poco la
        calidad de tus diseños antes de producción.
      </Modal>
      </div>
    </main>
  );
}


