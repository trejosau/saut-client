import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";
const CATALOG_UPLOAD_DEBUG =
  process.env.CATALOG_UPLOAD_DEBUG === "1" || process.env.NODE_ENV !== "production";

function bytesToMb(value: number): string {
  return (value / (1024 * 1024)).toFixed(2);
}

function sanitizeUploadUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function logCatalogUploadServer(event: string, payload: Record<string, unknown>) {
  if (!CATALOG_UPLOAD_DEBUG) return;
  console.info(`[catalog-upload][api] ${event}`, payload);
}

export type AdminCollection = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  visibility: string;
  cover_url?: string | null;
  updated_at: string;
};

export type AdminDrop = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
  capacity_total?: number | null;
  visibility: string;
  updated_at: string;
};

export type AdminDesign = {
  id: string;
  name: string;
  has_variants: boolean;
  default_front_design_url?: string | null;
  default_back_design_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminDesignVariant = {
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
  created_at: string;
  updated_at: string;
};

export type AdminPublication = {
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
  informative_image_url?: string | null;
  viewer_asset_id?: string | null;
  front_print_x_pct: number;
  front_print_y_pct: number;
  front_print_w_pct: number;
  front_print_h_pct: number;
  back_print_x_pct: number;
  back_print_y_pct: number;
  back_print_w_pct: number;
  back_print_h_pct: number;
  created_at: string;
  updated_at: string;
};

export type AdminPublicationDetail = {
  publication: AdminPublication;
  design: AdminDesign;
  variants: AdminDesignVariant[];
  mockups: AdminPublicationMockup[];
};

export type AdminCollectionDetail = {
  collection: AdminCollection;
  items: AdminPublication[];
};

export type AdminDropDetail = {
  drop: AdminDrop;
  items: AdminPublication[];
};

export type AdminAssetResolve = {
  asset_id: string;
  visibility?: string;
  content_type?: string;
  size_bytes?: number;
  url?: string;
  signed_url?: string | null;
  public_url?: string | null;
  download_url?: string | null;
};

export type AdminPublicationMockup = {
  id: string;
  publication_id: string;
  variant_id?: string | null;
  garment_color?: string | null;
  view_side: "front" | "back";
  mockup_asset_id: string;
  mockup_url?: string | null;
  created_at: string;
};

type CollectionItemPayload = {
  publication_id: string;
  position_index: number;
};

type AdminRequestInit = RequestInit & {
  path: string;
};

type AdminSignUploadResponse = {
  asset_id: string;
  upload_url: string;
  expires_at_unix?: number;
  method?: string;
};

async function adminRequest<T>(init: AdminRequestInit): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    throw new Error("No autenticado para dashboard admin.");
  }

  const response = await fetch(`${API_BASE_URL}${init.path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Admin API error (${response.status})${body ? `: ${body}` : ""}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text().catch(() => "");
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function listAdminCollections() {
  return adminRequest<AdminCollection[]>({
    path: "/admin/catalog/collections",
    method: "GET",
  });
}

export async function listAdminDrops() {
  return adminRequest<AdminDrop[]>({
    path: "/admin/catalog/drops",
    method: "GET",
  });
}

export async function getAdminCollection(collectionId: string) {
  return adminRequest<AdminCollectionDetail>({
    path: `/admin/catalog/collections/${collectionId}`,
    method: "GET",
  });
}

export async function getAdminDrop(dropId: string) {
  return adminRequest<AdminDropDetail>({
    path: `/admin/catalog/drops/${dropId}`,
    method: "GET",
  });
}

export async function createAdminCollection(input: {
  slug: string;
  title: string;
  description?: string;
  visibility: "visible" | "hidden";
}) {
  return adminRequest<AdminCollection>({
    path: "/admin/catalog/collections",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminCollection(
  id: string,
  input: Partial<{
    slug: string;
    title: string;
    description: string | null;
    visibility: "visible" | "hidden";
  }>
) {
  return adminRequest<AdminCollection>({
    path: `/admin/catalog/collections/${id}`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function replaceAdminCollectionItems(
  collectionId: string,
  publicationIds: string[]
) {
  const items: CollectionItemPayload[] = publicationIds.map(
    (publicationId, index) => ({
      publication_id: publicationId,
      position_index: index + 1,
    })
  );

  return adminRequest<CollectionItemPayload[]>({
    path: `/admin/catalog/collections/${collectionId}/items`,
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}

export async function createAdminDrop(input: {
  slug: string;
  title: string;
  description?: string;
  status: "preview" | "active" | "ended";
  starts_at?: string | null;
  ends_at?: string | null;
  capacity_total?: number | null;
  visibility: "visible" | "hidden";
}) {
  return adminRequest<AdminDrop>({
    path: "/admin/catalog/drops",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminDrop(
  id: string,
  input: Partial<{
    slug: string;
    title: string;
    description: string | null;
    status: "preview" | "active" | "ended";
    starts_at: string | null;
    ends_at: string | null;
    capacity_total: number | null;
    visibility: "visible" | "hidden";
  }>
) {
  return adminRequest<AdminDrop>({
    path: `/admin/catalog/drops/${id}`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function replaceAdminDropItems(
  dropId: string,
  publicationIds: string[]
) {
  const items: CollectionItemPayload[] = publicationIds.map(
    (publicationId, index) => ({
      publication_id: publicationId,
      position_index: index + 1,
    })
  );

  return adminRequest<CollectionItemPayload[]>({
    path: `/admin/catalog/drops/${dropId}/items`,
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}

export async function listAdminPublications(params?: {
  q?: string;
  garment_type?: string;
  category?: string;
  visibility?: "visible" | "hidden";
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.garment_type) search.set("garment_type", params.garment_type);
  if (params?.category) search.set("category", params.category);
  if (params?.visibility) search.set("visibility", params.visibility);
  if (typeof params?.is_active === "boolean") {
    search.set("is_active", String(params.is_active));
  }
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const query = search.toString();

  return adminRequest<AdminPublication[]>({
    path: `/admin/catalog/publications${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function getAdminPublication(publicationId: string) {
  return adminRequest<AdminPublicationDetail>({
    path: `/admin/catalog/publications/${publicationId}`,
    method: "GET",
  });
}

export async function createAdminPublication(input: {
  slug: string;
  title: string;
  description?: string;
  garment_type: "tshirt" | "hoodie" | "jogger";
  garment_model?: string;
  design_id: string;
  category: string;
  visibility?: "visible" | "hidden";
  is_active?: boolean;
  is_seasonal?: boolean;
  sort_rank?: number;
  price_mxn?: number;
  cover_asset_id?: string;
  preview_front_asset_id?: string;
  preview_back_asset_id?: string;
  informative_image_id?: string;
  viewer_asset_id?: string;
  front_print_x_pct?: number;
  front_print_y_pct?: number;
  front_print_w_pct?: number;
  front_print_h_pct?: number;
  back_print_x_pct?: number;
  back_print_y_pct?: number;
  back_print_w_pct?: number;
  back_print_h_pct?: number;
}) {
  return adminRequest<AdminPublication>({
    path: "/admin/catalog/publications",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminPublication(
  publicationId: string,
  input: Partial<{
    title: string;
    description: string | null;
    design_id: string;
    category: string;
    visibility: "visible" | "hidden";
    is_active: boolean;
    is_seasonal: boolean;
    sort_rank: number;
    price_mxn: number;
    informative_image_id: string | null;
    front_print_x_pct: number;
    front_print_y_pct: number;
    front_print_w_pct: number;
    front_print_h_pct: number;
    back_print_x_pct: number;
    back_print_y_pct: number;
    back_print_w_pct: number;
    back_print_h_pct: number;
  }>
) {
  return adminRequest<AdminPublication>({
    path: `/admin/catalog/publications/${publicationId}`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function publishAdminPublication(publicationId: string) {
  return adminRequest<AdminPublication>({
    path: `/admin/catalog/publications/${publicationId}/publish`,
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function unpublishAdminPublication(publicationId: string) {
  return adminRequest<AdminPublication>({
    path: `/admin/catalog/publications/${publicationId}/unpublish`,
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function listAdminDesigns(params?: { q?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();

  return adminRequest<AdminDesign[]>({
    path: `/admin/catalog/designs${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function getAdminDesign(designId: string) {
  return adminRequest<AdminDesign>({
    path: `/admin/catalog/designs/${designId}`,
    method: "GET",
  });
}

export async function createAdminDesign(input: {
  name: string;
  has_variants?: boolean;
  default_front_design_url?: string;
  default_back_design_url?: string;
}) {
  return adminRequest<AdminDesign>({
    path: "/admin/catalog/designs",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminDesign(
  designId: string,
  input: Partial<{
    name: string;
    has_variants: boolean;
    default_front_design_url: string | null;
    default_back_design_url: string | null;
  }>
) {
  return adminRequest<AdminDesign>({
    path: `/admin/catalog/designs/${designId}`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function listAdminDesignVariants(params?: {
  design_id?: string;
  is_active?: boolean;
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params?.design_id) search.set("design_id", params.design_id);
  if (typeof params?.is_active === "boolean") {
    search.set("is_active", String(params.is_active));
  }
  if (params?.q) search.set("q", params.q);
  const query = search.toString();

  return adminRequest<AdminDesignVariant[]>({
    path: `/admin/catalog/design-variants${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function getAdminDesignVariant(variantId: string) {
  return adminRequest<AdminDesignVariant>({
    path: `/admin/catalog/design-variants/${variantId}`,
    method: "GET",
  });
}

export async function createAdminDesignVariant(input: {
  design_id: string;
  code: string;
  label: string;
  dtf_asset_id: string;
  public_preview_asset_id?: string;
  front_design_url?: string;
  back_design_url?: string;
  is_active?: boolean;
  sort_rank?: number;
}) {
  return adminRequest<AdminDesignVariant>({
    path: "/admin/catalog/design-variants",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminDesignVariant(
  variantId: string,
  input: Partial<{
    code: string;
    label: string;
    dtf_asset_id: string;
    public_preview_asset_id: string | null;
    front_design_url: string | null;
    back_design_url: string | null;
    is_active: boolean;
    sort_rank: number;
  }>
) {
  return adminRequest<AdminDesignVariant>({
    path: `/admin/catalog/design-variants/${variantId}`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function signAdminAssetUpload(input: {
  file_name?: string;
  content_type?: string;
  visibility?: "public" | "internal";
  category?: "dtf" | "mockup" | "informative";
  ttl_sec?: number;
}) {
  return adminRequest<AdminSignUploadResponse>({
    path: "/admin/assets/sign-upload",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function uploadAdminAssetFile(
  signedUpload: AdminSignUploadResponse,
  file: File
) {
  const rawContentType = file.type?.trim().toLowerCase() || "application/octet-stream";
  const contentType = rawContentType === "image/jpg" ? "image/jpeg" : rawContentType;
  const method = (signedUpload.method ?? "PUT").toUpperCase();
  const body = Buffer.from(await file.arrayBuffer());
  const uploadUrl = sanitizeUploadUrl(signedUpload.upload_url);
  const startedAt = Date.now();

  logCatalogUploadServer("upload-start", {
    file_name: file.name,
    file_size_bytes: file.size,
    file_size_mb: bytesToMb(file.size),
    content_type: contentType,
    method,
    upload_url: uploadUrl,
  });

  const response = await fetch(signedUpload.upload_url, {
    method,
    headers: {
      "Content-Type": contentType,
    },
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[catalog-upload][api] upload-failed", {
      file_name: file.name,
      file_size_bytes: file.size,
      file_size_mb: bytesToMb(file.size),
      content_type: contentType,
      method,
      upload_url: uploadUrl,
      duration_ms: Date.now() - startedAt,
      status: response.status,
      status_text: response.statusText,
      response_content_type: response.headers.get("content-type"),
      response_server: response.headers.get("server"),
      response_via: response.headers.get("via"),
      response_body_preview: text.slice(0, 800),
    });
    throw new Error(`Asset upload failed (${response.status})${text ? `: ${text}` : ""}`);
  }

  logCatalogUploadServer("upload-ok", {
    file_name: file.name,
    file_size_bytes: file.size,
    file_size_mb: bytesToMb(file.size),
    method,
    upload_url: uploadUrl,
    status: response.status,
    duration_ms: Date.now() - startedAt,
  });
}

export async function resolveAdminAsset(
  assetId: string,
  mode: "public" | "internal" = "public"
) {
  return adminRequest<AdminAssetResolve>({
    path: `/admin/assets/${assetId}/resolve?mode=${mode}`,
    method: "GET",
  });
}

export async function listAdminPublicationMockups(publicationId: string) {
  return adminRequest<AdminPublicationMockup[]>({
    path: `/admin/catalog/publications/${publicationId}/mockups`,
    method: "GET",
  });
}

export async function createAdminPublicationMockup(
  publicationId: string,
  input: {
    variant_id?: string;
    garment_color?: string;
    view_side: "front" | "back";
    mockup_asset_id: string;
    mockup_url?: string;
  }
) {
  return adminRequest<AdminPublicationMockup>({
    path: `/admin/catalog/publications/${publicationId}/mockups`,
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createAdminInformativeImage(input: {
  scope_type: "global" | "publication" | "collection" | "drop";
  scope_id?: string;
  asset_id: string;
}) {
  return adminRequest<{
    id: string;
    scope_type: string;
    scope_id?: string | null;
    asset_id: string;
  }>({
    path: "/admin/catalog/informative-images",
    method: "POST",
    body: JSON.stringify(input),
  });
}
