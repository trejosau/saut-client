import { redirect } from "next/navigation";

import {
  registerMermaAction,
  updateOrderStatusAction,
  updateWorkOrderChecklistAction,
} from "./actions";
import {
  type OrderItemVisual,
  PedidosDashboardClient,
} from "./PedidosDashboardClient";
import { ensureDashboardModuleAccess } from "@/modules/dashboard/auth/server/access";
import {
  getAdminDesign,
  getAdminDesignVariant,
  getAdminPublication,
  resolveAdminAsset,
} from "@/modules/dashboard/catalog/server/api";
import {
  getAdminOrder,
  listAdminOrders,
  type WorkOrder,
} from "@/modules/dashboard/orders/server/api";

type DashboardPedidosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstQueryValue(input: string | string[] | undefined): string {
  if (Array.isArray(input)) return input[0]?.trim() ?? "";
  return input?.trim() ?? "";
}

function parseDateTimeQuery(value: string): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function normalizeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return undefined;
}

function pickAssetUrl(value?: {
  download_url?: string | null;
  signed_url?: string | null;
  public_url?: string | null;
  url?: string;
}): string | undefined {
  return (
    normalizeUrl(value?.download_url) ??
    normalizeUrl(value?.signed_url) ??
    normalizeUrl(value?.public_url) ??
    normalizeUrl(value?.url)
  );
}

function collectSnapshotUrls(
  value: unknown,
  urls: Set<string>,
  depth = 0
): void {
  if (depth > 8 || value === null || value === undefined) return;

  if (typeof value === "string") {
    const maybeUrl = normalizeUrl(value);
    if (maybeUrl) urls.add(maybeUrl);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSnapshotUrls(item, urls, depth + 1);
    }
    return;
  }

  if (!isRecord(value)) return;
  for (const entry of Object.values(value)) {
    collectSnapshotUrls(entry, urls, depth + 1);
  }
}

function collectSnapshotAssetIds(
  value: unknown,
  assetIds: Set<string>,
  keyHint = "",
  depth = 0
): void {
  if (depth > 8 || value === null || value === undefined) return;

  if (typeof value === "string") {
    if (isUuid(value.trim()) && keyHint.toLowerCase().includes("asset")) {
      assetIds.add(value.trim());
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSnapshotAssetIds(item, assetIds, keyHint, depth + 1);
    }
    return;
  }

  if (!isRecord(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    collectSnapshotAssetIds(entry, assetIds, key, depth + 1);
  }
}

function printableLabel(contentType: string | null | undefined, url?: string): string {
  const hint = `${contentType ?? ""} ${url ?? ""}`.toLowerCase();
  if (hint.includes("pdf")) return "Abrir archivo de impresion (PDF)";
  if (hint.includes("png")) return "Abrir archivo de impresion (PNG)";
  if (hint.includes("jpg") || hint.includes("jpeg")) {
    return "Abrir archivo de impresion (JPG)";
  }
  return "Abrir archivo de impresion";
}

async function safeMapById<T>(
  ids: Iterable<string>,
  loader: (id: string) => Promise<T>
): Promise<Map<string, T>> {
  const resolved = await Promise.all(
    Array.from(ids).map(async (id) => {
      try {
        return [id, await loader(id)] as const;
      } catch {
        return null;
      }
    })
  );

  const map = new Map<string, T>();
  for (const entry of resolved) {
    if (!entry) continue;
    map.set(entry[0], entry[1]);
  }
  return map;
}

export default async function DashboardPedidosPage({ searchParams }: DashboardPedidosPageProps) {
  const access = await ensureDashboardModuleAccess("pedidos");
  if (!access) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const q = firstQueryValue(resolvedSearchParams.q);
  const status = firstQueryValue(resolvedSearchParams.status).toLowerCase();
  const shippingMethod = firstQueryValue(resolvedSearchParams.shipping_method).toLowerCase();
  const from = firstQueryValue(resolvedSearchParams.from);
  const to = firstQueryValue(resolvedSearchParams.to);

  const ordersResponse = await listAdminOrders({
    limit: 36,
    offset: 0,
    q: q || undefined,
    status: status && status !== "all" ? status : undefined,
    shipping_method: shippingMethod && shippingMethod !== "all" ? shippingMethod : undefined,
  });

  const parsedFrom = parseDateTimeQuery(from);
  const parsedTo = parseDateTimeQuery(to);
  const fromBound = parsedFrom !== null && parsedTo !== null ? Math.min(parsedFrom, parsedTo) : parsedFrom;
  const toBound = parsedFrom !== null && parsedTo !== null ? Math.max(parsedFrom, parsedTo) : parsedTo;

  const filteredOrders = ordersResponse.items.filter((order) => {
    if (fromBound === null && toBound === null) return true;

    const createdAt = new Date(order.created_at).getTime();
    if (Number.isNaN(createdAt)) return true;
    if (fromBound !== null && createdAt < fromBound) return false;
    if (toBound !== null && createdAt > toBound) return false;
    return true;
  });

  const workOrdersByOrderId: Record<string, WorkOrder[]> = {};
  const detailed = await Promise.all(
    filteredOrders.map(async (order) => {
      try {
        return await getAdminOrder(order.id);
      } catch {
        return null;
      }
    })
  );

  for (const order of filteredOrders) {
    workOrdersByOrderId[order.id] = [];
  }

  for (const item of detailed) {
    if (!item) continue;
    workOrdersByOrderId[item.order.id] = item.work_orders;
  }

  const workOrders: WorkOrder[] = detailed
    .flatMap((item) => (item ? item.work_orders : []))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const shippingMethodOptions = Array.from(
    new Set(filteredOrders.map((order) => order.shipping_method).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right, "es-MX"));

  const publicationIds = new Set<string>();
  const designVariantIds = new Set<string>();
  const snapshotAssetIds = new Set<string>();

  for (const order of filteredOrders) {
    for (const item of order.items) {
      if (item.publication_id) publicationIds.add(item.publication_id);
      if (item.design_variant_id) designVariantIds.add(item.design_variant_id);
      collectSnapshotAssetIds(item.snapshot, snapshotAssetIds);
    }
  }

  const publicationById = await safeMapById(publicationIds, getAdminPublication);
  const designVariantById = await safeMapById(designVariantIds, getAdminDesignVariant);

  const designIds = new Set<string>();
  for (const detail of publicationById.values()) {
    designIds.add(detail.publication.design_id);
  }
  for (const variant of designVariantById.values()) {
    designIds.add(variant.design_id);
  }
  const designById = await safeMapById(designIds, getAdminDesign);

  const assetIds = new Set<string>();
  for (const detail of publicationById.values()) {
    const publication = detail.publication;
    if (publication.preview_front_asset_id) assetIds.add(publication.preview_front_asset_id);
    if (publication.preview_back_asset_id) assetIds.add(publication.preview_back_asset_id);
    if (publication.informative_image_id) assetIds.add(publication.informative_image_id);
  }
  for (const variant of designVariantById.values()) {
    assetIds.add(variant.dtf_asset_id);
    if (variant.public_preview_asset_id) assetIds.add(variant.public_preview_asset_id);
  }
  for (const assetId of snapshotAssetIds) {
    assetIds.add(assetId);
  }

  const resolvedAssetById = await safeMapById(assetIds, (assetId) =>
    resolveAdminAsset(assetId, "internal")
  );

  const orderItemVisualById: Record<string, OrderItemVisual> = {};
  for (const order of filteredOrders) {
    for (const item of order.items) {
      const publicationDetail = item.publication_id
        ? publicationById.get(item.publication_id)
        : undefined;
      const publication = publicationDetail?.publication;
      const variant = item.design_variant_id
        ? designVariantById.get(item.design_variant_id)
        : undefined;
      const design = variant
        ? designById.get(variant.design_id)
        : publicationDetail?.design ??
          (publication ? designById.get(publication.design_id) : undefined);

      const snapshotUrlsSet = new Set<string>();
      collectSnapshotUrls(item.snapshot, snapshotUrlsSet);
      const snapshotUrls = Array.from(snapshotUrlsSet);

      const snapshotFrontUrl = snapshotUrls.find((url) =>
        /front|frontal/i.test(url)
      );
      const snapshotBackUrl = snapshotUrls.find((url) => /back|traser/i.test(url));
      const snapshotAnyUrl = snapshotUrls[0];

      const publicationPreviewFront = publication?.preview_front_asset_id
        ? pickAssetUrl(resolvedAssetById.get(publication.preview_front_asset_id))
        : undefined;
      const publicationPreviewBack = publication?.preview_back_asset_id
        ? pickAssetUrl(resolvedAssetById.get(publication.preview_back_asset_id))
        : undefined;
      const publicationInfo = publication?.informative_image_url;
      const variantPreview = variant?.public_preview_asset_id
        ? pickAssetUrl(resolvedAssetById.get(variant.public_preview_asset_id))
        : undefined;

      const frontDesignUrl =
        normalizeUrl(variant?.front_design_url) ??
        normalizeUrl(design?.default_front_design_url) ??
        normalizeUrl(snapshotFrontUrl) ??
        normalizeUrl(snapshotAnyUrl);
      const backDesignUrl =
        normalizeUrl(variant?.back_design_url) ??
        normalizeUrl(design?.default_back_design_url) ??
        normalizeUrl(snapshotBackUrl);

      const previewImageUrl =
        normalizeUrl(variantPreview) ??
        normalizeUrl(publicationPreviewFront) ??
        normalizeUrl(publicationPreviewBack) ??
        normalizeUrl(publicationInfo) ??
        normalizeUrl(snapshotFrontUrl) ??
        normalizeUrl(snapshotAnyUrl) ??
        frontDesignUrl ??
        backDesignUrl;

      const printableAsset = variant
        ? resolvedAssetById.get(variant.dtf_asset_id)
        : undefined;
      const printableAssetUrl =
        pickAssetUrl(printableAsset) ??
        snapshotUrls.find((url) => /\.(pdf|png|jpe?g)(?:\?|$)/i.test(url));

      const subtitleParts: string[] = [];
      if (design?.name) subtitleParts.push(design.name);
      if (variant?.label) subtitleParts.push(variant.label);
      if (item.publication_slug) subtitleParts.push(item.publication_slug);

      orderItemVisualById[item.id] = {
        title:
          publication?.title ??
          design?.name ??
          item.publication_slug ??
          `${item.garment_type} ${item.garment_model}`,
        subtitle: subtitleParts.join(" | ") || undefined,
        previewImageUrl,
        frontDesignUrl,
        backDesignUrl,
        printableAssetUrl,
        printableAssetLabel: printableAssetUrl
          ? printableLabel(printableAsset?.content_type, printableAssetUrl)
          : undefined,
      };
    }
  }

  const filtersKey = [q, status || "all", shippingMethod || "all", from, to].join("|");

  return (
    <PedidosDashboardClient
      key={filtersKey}
      orders={filteredOrders}
      ordersTotal={filteredOrders.length}
      workOrders={workOrders}
      workOrdersByOrderId={workOrdersByOrderId}
      orderItemVisualById={orderItemVisualById}
      shippingMethodOptions={shippingMethodOptions}
      filters={{
        q,
        status: status || "all",
        shippingMethod: shippingMethod || "all",
        from,
        to,
      }}
      actions={{
        updateOrderStatusAction,
        updateWorkOrderChecklistAction,
        registerMermaAction,
      }}
    />
  );
}
