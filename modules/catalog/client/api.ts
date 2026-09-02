import { requestJson } from "@/core/lib/api/fetcher";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:8080";

const EMPTY_OVERSIZE_URL = "/tiles/oversize-negra.webp";
const EMPTY_LONG_SLEEVE_URL = "/tiles/manga-larga-negra.webp";
const EMPTY_HOODIE_URL = "/tiles/hoodie-semi-orversize-negra.webp";
const EMPTY_REGULAR_URL = "/tiles/regular-negra.webp";
const CATALOG_REVALIDATE_SECONDS = 60;
const IS_DEV = process.env.NODE_ENV !== "production";

export type CatalogPublicationVariantPreview = {
  id: string;
  code: string;
  label: string;
  front_design_url?: string | null;
  back_design_url?: string | null;
  sort_rank: number;
};

export type CatalogPublication = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  garment_type: string;
  garment_model?: string | null;
  design_id: string;
  category: string;
  visibility: string;
  is_active: boolean;
  is_seasonal: boolean;
  sort_rank: number;
  price_mxn: number;
  cover_asset_id?: string | null;
  preview_front_asset_id?: string | null;
  preview_back_asset_id?: string | null;
  informative_image_id?: string | null;
  cover_url?: string | null;
  preview_front_url?: string | null;
  preview_back_url?: string | null;
  informative_image_url?: string | null;
  default_front_design_url?: string | null;
  default_back_design_url?: string | null;
  variants_preview?: CatalogPublicationVariantPreview[];
  front_print_x_pct?: number;
  front_print_y_pct?: number;
  front_print_w_pct?: number;
  front_print_h_pct?: number;
  back_print_x_pct?: number;
  back_print_y_pct?: number;
  back_print_w_pct?: number;
  back_print_h_pct?: number;
  stock_qty?: number | null;
  stock_units?: number | null;
  inventory_qty?: number | null;
  created_at: string;
  updated_at: string;
};

export type CatalogDesign = {
  id: string;
  name: string;
  has_variants: boolean;
  default_front_design_url?: string | null;
  default_back_design_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogVariant = {
  id: string;
  design_id: string;
  code: string;
  label: string;
  dtf_asset_id: string;
  public_preview_asset_id?: string | null;
  front_design_url?: string | null;
  back_design_url?: string | null;
  is_active: boolean;
  sort_rank: number;
  dtf_asset_url?: string | null;
  public_preview_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogMockup = {
  id: string;
  publication_id: string;
  variant_id?: string | null;
  garment_color?: string | null;
  view_side?: "front" | "back" | string;
  mockup_asset_id: string;
  mockup_url?: string | null;
  created_at: string;
};

export type CatalogPublicationDetail = {
  publication: CatalogPublication;
  design: CatalogDesign;
  variants: CatalogVariant[];
  mockups: CatalogMockup[];
};

export type CatalogCollection = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  visibility: string;
  cover_asset_id?: string | null;
  informative_image_id?: string | null;
  cover_url?: string | null;
  informative_image_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogCollectionDetail = {
  collection: CatalogCollection;
  items: CatalogPublication[];
};

export type CatalogDrop = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
  capacity_total?: number | null;
  visibility: string;
  cover_asset_id?: string | null;
  informative_image_id?: string | null;
  cover_url?: string | null;
  informative_image_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogDropDetail = {
  drop: CatalogDrop;
  items: CatalogPublication[];
};

type ListPublicationsOptions = {
  category?: string;
  garment_type?: string;
  sort?: "best_sellers" | "az" | "za" | "price_desc" | "price_asc";
};

function emptyGarmentBaseUrl(publication: Pick<CatalogPublication, "garment_type" | "garment_model">) {
  const model = (publication.garment_model ?? "").toLowerCase();
  const type = (publication.garment_type ?? "").toLowerCase();
  if (model.includes("long_sleeve")) return EMPTY_LONG_SLEEVE_URL;
  if (model.includes("regular")) return EMPTY_REGULAR_URL;
  if (model.includes("hoodie") || type.includes("hoodie")) return EMPTY_HOODIE_URL;
  return EMPTY_OVERSIZE_URL;
}

function normalizeAssetKey(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function maybeOverlayFromPreview(
  previewUrl: string | null | undefined,
  emptyBaseUrl: string
): string | undefined {
  const key = normalizeAssetKey(previewUrl);
  if (!key) return undefined;
  if (key === normalizeAssetKey(emptyBaseUrl)) return undefined;
  if (key.includes("/tiles/")) return undefined;
  return previewUrl ?? undefined;
}

function defaultFrontPrintArea(publication: CatalogPublication) {
  const key = publication.garment_model ?? publication.garment_type ?? "oversize";
  if (key === "oversize") return { x: 34, y: 25, w: 32, h: 34 };
  if (key === "long_sleeve_oversize") return { x: 34, y: 24, w: 32, h: 34 };
  if (key === "long_sleeve_regular") return { x: 34, y: 25, w: 32, h: 34 };
  if (key === "regular") return { x: 35, y: 26, w: 30, h: 32 };
  if (key === "hoodie") return { x: 32, y: 23, w: 36, h: 36 };
  if (key === "jogger") return { x: 38, y: 29, w: 24, h: 26 };
  return { x: 34, y: 25, w: 32, h: 34 };
}

function defaultBackPrintArea(publication: CatalogPublication) {
  const key = publication.garment_model ?? publication.garment_type ?? "oversize";
  if (key === "oversize") return { x: 32, y: 23, w: 36, h: 36 };
  if (key === "long_sleeve_oversize") return { x: 32, y: 22, w: 36, h: 36 };
  if (key === "long_sleeve_regular") return { x: 32, y: 23, w: 36, h: 36 };
  if (key === "regular") return { x: 33, y: 24, w: 34, h: 34 };
  if (key === "hoodie") return { x: 31, y: 21, w: 38, h: 38 };
  if (key === "jogger") return { x: 38, y: 31, w: 24, h: 26 };
  return { x: 32, y: 23, w: 36, h: 36 };
}

function normalizePublication(publication: CatalogPublication): CatalogPublication {
  const front = defaultFrontPrintArea(publication);
  const back = defaultBackPrintArea(publication);
  const emptyBase = emptyGarmentBaseUrl(publication);

  return {
    ...publication,
    preview_front_url: publication.preview_front_url ?? emptyBase,
    preview_back_url: publication.preview_back_url ?? emptyBase,
    cover_url: publication.cover_url ?? publication.preview_front_url ?? emptyBase,
    front_print_x_pct: publication.front_print_x_pct ?? front.x,
    front_print_y_pct: publication.front_print_y_pct ?? front.y,
    front_print_w_pct: publication.front_print_w_pct ?? front.w,
    front_print_h_pct: publication.front_print_h_pct ?? front.h,
    back_print_x_pct: publication.back_print_x_pct ?? back.x,
    back_print_y_pct: publication.back_print_y_pct ?? back.y,
    back_print_w_pct: publication.back_print_w_pct ?? back.w,
    back_print_h_pct: publication.back_print_h_pct ?? back.h,
  };
}

function buildPath(path: string, query?: Record<string, string | undefined>): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalized}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value && value.length > 0) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  return requestJson<T>(path, {
    ...init,
    cache: init?.cache ?? (IS_DEV ? "no-store" : "force-cache"),
    next: init?.next ?? (IS_DEV ? undefined : { revalidate: CATALOG_REVALIDATE_SECONDS }),
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchCatalogPublications(
  options: ListPublicationsOptions = {}
): Promise<CatalogPublication[]> {
  try {
    const query = {
      category: options.category,
      garment_type: options.garment_type,
      sort: options.sort ?? "best_sellers",
    };
    const path = buildPath("/catalog/publications", query);
    const publications = await fetchJson<CatalogPublication[]>(path);
    const normalized = publications.map(normalizePublication);
    return enrichPublicationsWithVariantPreviews(normalized);
  } catch {
    return [];
  }
}

export async function fetchCatalogPublicationBySlug(
  slug: string
): Promise<CatalogPublicationDetail | null> {
  try {
    const path = buildPath(`/catalog/publications/${encodeURIComponent(slug)}`);
    const detail = await fetchJson<CatalogPublicationDetail>(path);
    return {
      ...detail,
      publication: normalizePublication(detail.publication),
    };
  } catch {
    return null;
  }
}

type ListCollectionsOptions = {
  visible?: boolean;
};

type ListDropsOptions = {
  status?: "preview" | "active" | "ended";
  visible?: boolean;
};

export async function fetchCatalogCollections(
  options: ListCollectionsOptions = {}
): Promise<CatalogCollection[]> {
  try {
    const query = {
      visible:
        typeof options.visible === "boolean"
          ? String(options.visible)
          : undefined,
    };
    const path = buildPath("/catalog/collections", query);
    return await fetchJson<CatalogCollection[]>(path);
  } catch {
    return [];
  }
}

export async function fetchCatalogCollectionBySlug(
  slug: string
): Promise<CatalogCollectionDetail | null> {
  try {
    const path = buildPath(`/catalog/collections/${encodeURIComponent(slug)}`);
    const detail = await fetchJson<CatalogCollectionDetail>(path);
    return {
      ...detail,
      items: detail.items.map(normalizePublication),
    };
  } catch {
    return null;
  }
}

export async function fetchCatalogDrops(
  options: ListDropsOptions = {}
): Promise<CatalogDrop[]> {
  try {
    const query = {
      status: options.status,
      visible:
        typeof options.visible === "boolean"
          ? String(options.visible)
          : undefined,
    };
    const path = buildPath("/catalog/drops", query);
    return await fetchJson<CatalogDrop[]>(path);
  } catch {
    return [];
  }
}

export async function fetchCatalogDropBySlug(
  slug: string
): Promise<CatalogDropDetail | null> {
  try {
    const path = buildPath(`/catalog/drops/${encodeURIComponent(slug)}`);
    const detail = await fetchJson<CatalogDropDetail>(path);
    return {
      ...detail,
      items: detail.items.map(normalizePublication),
    };
  } catch {
    return null;
  }
}

function toVariantPreview(variant: CatalogVariant): CatalogPublicationVariantPreview {
  return {
    id: variant.id,
    code: variant.code,
    label: variant.label,
    front_design_url: variant.front_design_url ?? null,
    back_design_url: variant.back_design_url ?? null,
    sort_rank: variant.sort_rank,
  };
}

async function enrichPublicationsWithVariantPreviews(
  publications: CatalogPublication[]
): Promise<CatalogPublication[]> {
  const pending = publications.map(async (publication) => {
    if ((publication.variants_preview?.length ?? 0) > 0) return publication;

    const detail = await fetchCatalogPublicationBySlug(publication.slug);
    if (!detail) return publication;

    const variantsPreview = detail.variants
      .filter((variant) => variant.is_active)
      .map(toVariantPreview)
      .sort((a, b) => a.sort_rank - b.sort_rank);

    return {
      ...publication,
      default_front_design_url:
        publication.default_front_design_url ??
        detail.design.default_front_design_url ??
        null,
      default_back_design_url:
        publication.default_back_design_url ??
        detail.design.default_back_design_url ??
        null,
      variants_preview: variantsPreview.length
        ? variantsPreview
        : publication.variants_preview,
    };
  });

  return Promise.all(pending);
}

export type ProductCardShape = {
  id: string;
  name: string;
  priceMXN: number;
  href: string;
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
  defaultCartConfig?: {
    typeLabel: string;
    garmentType: string;
    garmentModel: string;
    color: string;
    size: string;
    grammageG: number;
    fit: string;
  };
  badge?: string;
  imageAlt?: string;
};

function inferDefaultCartConfig(publication: CatalogPublication) {
  const model = (publication.garment_model ?? "").toLowerCase();
  const type = (publication.garment_type ?? "").toLowerCase();

  if (model.includes("hoodie") || type.includes("hoodie")) {
    return {
      typeLabel: "Hoodie",
      garmentType: "hoodie",
      garmentModel: "hoodie",
      color: "Negra",
      size: "M",
      grammageG: 300,
      fit: "semi-oversize",
    };
  }

  if (model.includes("long_sleeve")) {
    return {
      typeLabel: "Manga Larga",
      garmentType: "tshirt",
      garmentModel: "long_sleeve_oversize",
      color: "Negra",
      size: "M",
      grammageG: 220,
      fit: "oversize",
    };
  }

  if (model.includes("regular")) {
    return {
      typeLabel: "Regular",
      garmentType: "tshirt",
      garmentModel: "regular",
      color: "Negra",
      size: "M",
      grammageG: 200,
      fit: "regular",
    };
  }

  return {
    typeLabel: "Oversize",
    garmentType: "tshirt",
    garmentModel: "oversize",
    color: "Negra",
    size: "M",
    grammageG: 240,
    fit: "oversize",
  };
}

export function publicationToProductCard(
  publication: CatalogPublication
): ProductCardShape {
  const frontPrintArea = {
    xPct: publication.front_print_x_pct ?? 34,
    yPct: publication.front_print_y_pct ?? 25,
    wPct: publication.front_print_w_pct ?? 32,
    hPct: publication.front_print_h_pct ?? 34,
  };
  const backPrintArea = {
    xPct: publication.back_print_x_pct ?? 32,
    yPct: publication.back_print_y_pct ?? 23,
    wPct: publication.back_print_w_pct ?? 36,
    hPct: publication.back_print_h_pct ?? 36,
  };

  const emptyBase = emptyGarmentBaseUrl(publication);
  const defaultFrontOverlay =
    publication.default_front_design_url ??
    maybeOverlayFromPreview(publication.preview_front_url, emptyBase);
  const defaultBackOverlay =
    publication.default_back_design_url ??
    maybeOverlayFromPreview(publication.preview_back_url, emptyBase);

  const publicationVariants = (publication.variants_preview ?? [])
    .map((variant) => ({
      id: variant.id,
      label: variant.code || variant.label,
      frontOverlaySrc: variant.front_design_url ?? undefined,
      backOverlaySrc: variant.back_design_url ?? undefined,
    }))
    .filter((variant) => variant.frontOverlaySrc || variant.backOverlaySrc);

  const variants = publicationVariants.length
    ? publicationVariants
    : defaultFrontOverlay || defaultBackOverlay
      ? [
          {
            id: `${publication.id}-default`,
            label: "MAIN",
            frontOverlaySrc: defaultFrontOverlay,
            backOverlaySrc: defaultBackOverlay,
          },
        ]
      : undefined;

  return {
    id: publication.id,
    name: publication.title,
    priceMXN: publication.price_mxn,
    href: `/producto/${publication.slug}`,
    imageFrontSrc: emptyBase,
    imageBackSrc: emptyBase,
    frontPrintArea,
    backPrintArea,
    variants,
    defaultCartConfig: inferDefaultCartConfig(publication),
    imageAlt: publication.title,
  };
}
