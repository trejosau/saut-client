import type { CartItem } from "@/core/cart/context";
import {
  addCustomizedCartItem,
  addPredesignedCartItem,
  createCartSession,
  type CartSessionResponse,
  type CustomizerPlacementPayload,
} from "@/modules/commerce/client/api";

const GUEST_CART_SESSION_STORAGE_KEY = "saut.checkout.guest_session_id.v1";
const CHECKOUT_ACCESS_TOKEN_STORAGE_PREFIX = "saut.checkout.access_token.v1.";

type CustomizerElementLike = {
  type?: string;
  assetId?: string;
  id?: string;
  xPct?: number;
  yPct?: number;
  scale?: number;
  rotationDeg?: number;
};

type PredesignedSnapshot = {
  kind?: string;
  publication_id?: string;
  publication_slug?: string;
  design_variant_id?: string | null;
  garment_type?: string;
  garment_model?: string;
  color?: string;
  size?: string;
  grammage_g?: number;
  fit?: string;
};

type CustomizerSnapshot = {
  kind?: string;
  design_id?: string;
  design_title?: string;
  garment_id?: string;
  garment_type?: string;
  garment_model?: string;
  color?: string;
  size?: string;
  grammage_g?: number;
  fit?: string;
  quantity?: number;
  visual_mode?: string;
  improve_quality?: boolean;
  note?: string;
  front?: CustomizerElementLike[];
  back?: CustomizerElementLike[];
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function createUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const suffix = `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return `${suffix.slice(0, 8)}-${suffix.slice(0, 4)}-4${suffix.slice(
    0,
    3
  )}-a${suffix.slice(0, 3)}-${suffix.slice(0, 12)}`.padEnd(36, "0");
}

function safeNumber(value: unknown, fallback = 0): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeGrammage(raw: string | undefined, fallback = 0): number {
  if (!raw) return fallback;
  const digits = raw.replace(/[^\d]/g, "");
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function selectionValue(item: CartItem, label: string): string | undefined {
  const found = item.selections.find(
    (selection) => selection.label.trim().toLowerCase() === label.trim().toLowerCase()
  );
  return found?.value;
}

function normalizeOrderColor(raw: string | undefined): string {
  return (raw ?? "").trim() || "Negra";
}

function normalizeOrderSize(raw: string | undefined): string {
  return (raw ?? "").trim() || "M";
}

function predesignedFromFallback(item: CartItem): {
  garment_type: string;
  garment_model: string;
  color: string;
  size: string;
  grammage_g: number;
  fit: string;
} {
  const type = (selectionValue(item, "Tipo") ?? "").toLowerCase();
  const grammage = normalizeGrammage(selectionValue(item, "Gramaje"), 200);
  const isHoodie = type.includes("hoodie");
  const garmentType = isHoodie ? "hoodie" : "tshirt";
  const garmentModel = isHoodie
    ? "hoodie"
    : type.includes("manga larga")
      ? "long_sleeve_oversize"
      : type.includes("regular")
        ? "regular"
        : "oversize";
  const fit = isHoodie
    ? grammage >= 400
      ? "oversize"
      : "semi-oversize"
    : "";

  return {
    garment_type: garmentType,
    garment_model: garmentModel,
    color: normalizeOrderColor(selectionValue(item, "Color")),
    size: normalizeOrderSize(selectionValue(item, "Talla")),
    grammage_g: grammage,
    fit,
  };
}

function getPredesignedSnapshot(item: CartItem): PredesignedSnapshot | null {
  const snapshot = item.customizerSnapshot;
  if (!snapshot || typeof snapshot !== "object") return null;
  const parsed = snapshot as PredesignedSnapshot;
  if ((parsed.kind ?? "") !== "predesigned_v1") return null;
  return parsed;
}

function getCustomizerSnapshot(item: CartItem): CustomizerSnapshot | null {
  const snapshot = item.customizerSnapshot;
  if (!snapshot || typeof snapshot !== "object") return null;
  const parsed = snapshot as CustomizerSnapshot;
  if ((parsed.kind ?? "") !== "customizer_v1") return null;
  return parsed;
}

function toPlacement(element: CustomizerElementLike): CustomizerPlacementPayload {
  const sourceId =
    safeText(element.assetId).trim() || safeText(element.id).trim() || createUuid();
  return {
    asset_id: isUuid(sourceId) ? sourceId : createUuid(),
    x: safeNumber(element.xPct, 50),
    y: safeNumber(element.yPct, 50),
    scale: safeNumber(element.scale, 1),
    rotation: safeNumber(element.rotationDeg, 0),
  };
}

function toImagePlacements(elements: unknown): CustomizerPlacementPayload[] {
  if (!Array.isArray(elements)) return [];
  return elements
    .filter((value) => value && typeof value === "object")
    .map((value) => value as CustomizerElementLike)
    .filter((element) => (element.type ?? "").toLowerCase() === "image")
    .map(toPlacement);
}

function normalizeImproveQuality(value: unknown): boolean {
  return value === true;
}

function normalizeNote(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, 300);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function hasCustomizedShape(item: CartItem): boolean {
  if (item.productId.startsWith("customized-")) return true;
  return getCustomizerSnapshot(item) !== null;
}

function parseQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function parseUnitPrice(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function parsePredesigned(item: CartItem) {
  const snapshot = getPredesignedSnapshot(item);
  const fallback = predesignedFromFallback(item);
  const garment_type = safeText(snapshot?.garment_type, fallback.garment_type);
  const garment_model = safeText(snapshot?.garment_model, fallback.garment_model);
  const color = safeText(snapshot?.color, fallback.color);
  const size = safeText(snapshot?.size, fallback.size);
  const grammage_g =
    Number.isFinite(snapshot?.grammage_g) && Number(snapshot?.grammage_g) >= 0
      ? Number(snapshot?.grammage_g)
      : fallback.grammage_g;
  const fit = safeText(snapshot?.fit, fallback.fit);

  const publicationSlug = safeText(snapshot?.publication_slug, item.slug ?? "");
  if (!publicationSlug) {
    throw new Error(`El item "${item.name}" no tiene publication_slug.`);
  }

  const productId = item.productId.trim();
  const publicationId =
    safeText(snapshot?.publication_id).trim() || (isUuid(productId) ? productId : undefined);
  const designVariantId = safeText(snapshot?.design_variant_id ?? "").trim() || undefined;

  return {
    publication_slug: publicationSlug,
    publication_id: publicationId,
    design_variant_id: designVariantId,
    garment_type,
    garment_model,
    color,
    size,
    grammage_g,
    fit,
    quantity: parseQuantity(item.quantity),
    unit_price_mxn: parseUnitPrice(item.unitPrice),
    meta: {
      source: "client_cart_sync",
      line_id: item.lineId,
      line_key: item.key,
      selections: item.selections,
      visual: {
        preview_image_url:
          item.imageFrontOverlaySrc ??
          item.imageFrontSrc ??
          item.imageSrc,
        front_design_url: item.imageFrontOverlaySrc ?? item.imageFrontSrc,
        back_design_url: item.imageBackOverlaySrc ?? item.imageBackSrc,
        base_front_url: item.imageFrontSrc,
        base_back_url: item.imageBackSrc,
      },
    },
  };
}

function parseCustomized(item: CartItem) {
  const snapshot = getCustomizerSnapshot(item);
  const fallback = asRecord(item.customizerSnapshot) ?? {};

  const frontRaw = snapshot?.front ?? fallback.front;
  const backRaw = snapshot?.back ?? fallback.back;

  const front_assets = toImagePlacements(frontRaw);
  const back_assets = toImagePlacements(backRaw);

  return {
    garment_type: safeText(snapshot?.garment_type, "tshirt"),
    garment_model: safeText(snapshot?.garment_model, "oversize"),
    color: safeText(snapshot?.color, "Negra"),
    size: safeText(snapshot?.size, "M"),
    grammage_g:
      Number.isFinite(snapshot?.grammage_g) && Number(snapshot?.grammage_g) >= 0
        ? Number(snapshot?.grammage_g)
        : 240,
    fit: safeText(snapshot?.fit, "oversize"),
    quantity: parseQuantity(item.quantity),
    unit_price_mxn: parseUnitPrice(item.unitPrice),
    front_assets,
    back_assets,
    note: normalizeNote(snapshot?.note),
    improve_quality: normalizeImproveQuality(snapshot?.improve_quality),
    meta: {
      source: "client_cart_sync",
      line_id: item.lineId,
      line_key: item.key,
      design_id: snapshot?.design_id,
      design_title: snapshot?.design_title,
      garment_id: snapshot?.garment_id,
      visual_mode: snapshot?.visual_mode,
      visual: {
        preview_image_url: item.imageFrontSrc ?? item.imageSrc,
        front_design_url: item.imageFrontOverlaySrc ?? item.imageFrontSrc,
        back_design_url: item.imageBackOverlaySrc ?? item.imageBackSrc,
        base_front_url: item.imageFrontSrc,
        base_back_url: item.imageBackSrc,
      },
      raw_snapshot: item.customizerSnapshot ?? null,
    },
  };
}

export function getOrCreateGuestCartSessionId(): string {
  if (typeof window === "undefined") {
    return createUuid();
  }

  const existing = window.localStorage.getItem(GUEST_CART_SESSION_STORAGE_KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const created = createUuid();
  window.localStorage.setItem(GUEST_CART_SESSION_STORAGE_KEY, created);
  return created;
}

export function storeCheckoutAccessToken(checkoutId: string, cartAccessToken: string): void {
  if (typeof window === "undefined" || !checkoutId || cartAccessToken.length < 32) return;
  try {
    window.sessionStorage.setItem(`${CHECKOUT_ACCESS_TOKEN_STORAGE_PREFIX}${checkoutId}`, cartAccessToken);
  } catch {
    // The checkout can still continue in the current page when session storage is unavailable.
  }
}

export function getCheckoutAccessToken(checkoutId: string): string | null {
  if (typeof window === "undefined" || !checkoutId) return null;
  try {
    const token = window.sessionStorage.getItem(`${CHECKOUT_ACCESS_TOKEN_STORAGE_PREFIX}${checkoutId}`);
    return token && token.length >= 32 ? token : null;
  } catch {
    return null;
  }
}

export function clearCheckoutAccessToken(checkoutId: string): void {
  if (typeof window === "undefined" || !checkoutId) return;
  try {
    window.sessionStorage.removeItem(`${CHECKOUT_ACCESS_TOKEN_STORAGE_PREFIX}${checkoutId}`);
  } catch {
    // Best effort cleanup only.
  }
}

export async function syncLocalCartToBackend(input: {
  localItems: CartItem[];
  accountId?: string | null;
  guestSessionId: string;
}): Promise<CartSessionResponse> {
  if (input.localItems.length === 0) {
    throw new Error("No hay items en el carrito.");
  }

  let cart = await createCartSession({
    guest_session_id: input.guestSessionId,
    account_id: input.accountId ?? undefined,
  });
  const cartAccessToken = cart.cart_access_token;
  if (!cartAccessToken) {
    throw new Error("No se recibió la capacidad segura del carrito.");
  }

  for (const localItem of input.localItems) {
    if (hasCustomizedShape(localItem)) {
      cart = {
        ...(await addCustomizedCartItem(cart.id, parseCustomized(localItem), cartAccessToken)),
        cart_access_token: cartAccessToken,
      };
    } else {
      cart = {
        ...(await addPredesignedCartItem(cart.id, parsePredesigned(localItem), cartAccessToken)),
        cart_access_token: cartAccessToken,
      };
    }
  }

  return cart;
}
