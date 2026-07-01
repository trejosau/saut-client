"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import {
  createAdminDesign,
  createAdminDesignVariant,
  createAdminInformativeImage,
  createAdminPublication,
  createAdminPublicationMockup,
  listAdminDesignVariants,
  createAdminCollection,
  createAdminDrop,
  resolveAdminAsset,
  signAdminAssetUpload,
  updateAdminDesign,
  updateAdminDesignVariant,
  publishAdminPublication,
  replaceAdminCollectionItems,
  replaceAdminDropItems,
  uploadAdminAssetFile,
  unpublishAdminPublication,
  updateAdminPublication,
  updateAdminCollection,
  updateAdminDrop,
} from "@/modules/dashboard/catalog/server/api";
import { createInventoryEntry } from "@/modules/dashboard/inventory/server/api";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalString(value: FormDataEntryValue | null): string | undefined {
  const parsed = asString(value);
  return parsed.length > 0 ? parsed : undefined;
}

function asVisibility(value: FormDataEntryValue | null): "visible" | "hidden" {
  return asString(value).toLowerCase() === "hidden" ? "hidden" : "visible";
}

function asStatus(
  value: FormDataEntryValue | null
): "preview" | "active" | "ended" {
  const normalized = asString(value).toLowerCase();
  if (normalized === "ended") return "ended";
  if (normalized === "active") return "active";
  return "preview";
}

function parseDateTimeAsIso(value: FormDataEntryValue | null): string | null {
  const raw = asString(value);
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha invalida.");
  }

  return date.toISOString();
}

function parseCapacity(value: FormDataEntryValue | null): number | null | undefined {
  const raw = asString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error("capacity_total debe ser entero.");
  }
  if (parsed <= 0) return null;
  return parsed;
}

function parsePublicationIds(formData: FormData): string[] {
  const entries = formData.getAll("publication_ids");
  if (entries.length === 0) return [];

  const values = entries
    .map((entry) => asString(entry))
    .filter((entry) => entry.length > 0);

  if (values.length === 0) return [];

  const parsed = values.flatMap((raw) =>
    raw
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  );

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const id of parsed) {
    if (seen.has(id)) continue;
    seen.add(id);
    deduped.push(id);
  }
  return deduped;
}

function asBoolean(value: FormDataEntryValue | null): boolean {
  const normalized = asString(value).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function ensureVariantPlannerConfirmation(formData: FormData) {
  const isConfirmed = asBoolean(formData.get("all_variants_confirmed"));
  if (!isConfirmed) {
    throw new Error(
      "Confirma el area de impresion de todas las variantes antes de guardar la publicacion."
    );
  }
}

function asInteger(value: FormDataEntryValue | null, field: string): number {
  const raw = asString(value);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${field} debe ser entero.`);
  }
  return parsed;
}

function asNumberOptional(value: FormDataEntryValue | null): number | undefined {
  const raw = asString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error("Numero invalido.");
  }
  return parsed;
}

function asRequiredPositiveNumber(value: FormDataEntryValue | null, field: string): number {
  const raw = asString(value);
  if (!raw) {
    throw new Error(`${field} es obligatorio.`);
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} invalido.`);
  }
  if (parsed <= 0) {
    throw new Error(`${field} debe ser mayor a 0.`);
  }
  return parsed;
}

function asFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File)) return null;
  if (!value.name || value.size <= 0) return null;
  return value;
}

function asNullableString(value: FormDataEntryValue | null): string | null | undefined {
  if (value === null) return undefined;
  const parsed = asString(value);
  if (!parsed) return null;
  return parsed;
}

function normalizeVariantCode(input: string): string {
  const normalized = input
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  return normalized || "VARIANTE";
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Error desconocido.";
}

function normalizeContentType(contentType: string): string {
  const normalized = contentType.trim().toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  return normalized;
}

function extensionFromContentType(contentType: string): string | null {
  if (contentType === "application/pdf") return "pdf";
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return null;
}

function extensionFromFileName(fileName: string): string | null {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match ? match[1] : null;
}

function buildUploadFileName(prefix: string, file: File, contentType: string): string {
  const extension =
    extensionFromContentType(contentType) ?? extensionFromFileName(file.name) ?? "bin";
  return `${prefix}-${randomUUID()}.${extension}`;
}

function resolveImageUploadContentType(file: File): string {
  const contentType = normalizeContentType(file.type || "image/png");
  if (!contentType.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen para este campo.");
  }
  return contentType;
}

function resolveDtfUploadContentType(file: File): "application/pdf" | "image/png" | "image/jpeg" {
  const contentType = normalizeContentType(file.type || "image/png");
  if (contentType === "application/pdf") return contentType;
  if (contentType === "image/png") return contentType;
  if (contentType === "image/jpeg") return contentType;
  throw new Error(
    `Formato DTF no compatible para "${file.name}". Usa PDF, PNG o JPG.`
  );
}

const IMAGE_SOFT_LIMIT_BYTES = 20 * 1024 * 1024;
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
  console.info(`[catalog-upload][action] ${event}`, payload);
}

const SEASONAL_CATEGORIES = new Set<string>([
  "seasons",
  "amor_amistad",
  "navidad",
  "halloween",
  "dia_de_muertos",
]);

type GarmentType = "tshirt" | "hoodie";
type GarmentModel =
  | "oversize"
  | "regular"
  | "long_sleeve_oversize"
  | "hoodie_semi_oversize"
  | "hoodie_oversize";

const DEFAULT_PUBLICATION_CATEGORY = "music_artists";
const MAX_PUBLICATION_SLUG_LENGTH = 80;
const ALLOWED_GARMENT_MODELS = new Set<GarmentModel>([
  "oversize",
  "regular",
  "long_sleeve_oversize",
  "hoodie_semi_oversize",
  "hoodie_oversize",
]);

const DEFAULT_GARMENT_MODEL_BY_TYPE: Record<GarmentType, GarmentModel> = {
  tshirt: "oversize",
  hoodie: "hoodie_semi_oversize",
};

const ALLOWED_GARMENT_MODELS_BY_TYPE: Record<GarmentType, Set<GarmentModel>> = {
  tshirt: new Set<GarmentModel>(["oversize", "regular", "long_sleeve_oversize"]),
  hoodie: new Set<GarmentModel>(["hoodie_semi_oversize", "hoodie_oversize"]),
};

function asCategory(value: FormDataEntryValue | null): string {
  return asString(value).toLowerCase();
}

function isSeasonalCategory(category: string): boolean {
  return SEASONAL_CATEGORIES.has(category);
}

function asGarmentType(value: FormDataEntryValue | null): GarmentType {
  const normalized = asString(value).toLowerCase();
  if (normalized === "hoodie") return "hoodie";
  return "tshirt";
}

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function resolvePublicationSlug(rawSlug: string, title: string): string {
  const slug = normalizeSlug(rawSlug).slice(0, MAX_PUBLICATION_SLUG_LENGTH).replace(/-+$/g, "");
  if (slug) return slug;

  const suffix = randomUUID().slice(0, 8);
  const maxBaseLength = Math.max(1, MAX_PUBLICATION_SLUG_LENGTH - suffix.length - 1);
  const titleSlug = normalizeSlug(title).slice(0, maxBaseLength).replace(/-+$/g, "") || "publicacion";
  return `${titleSlug}-${suffix}`;
}

function resolveGarmentModel(raw: string | undefined, garmentType: GarmentType): GarmentModel {
  const normalized = raw?.trim().toLowerCase();
  if (
    normalized &&
    ALLOWED_GARMENT_MODELS.has(normalized as GarmentModel) &&
    ALLOWED_GARMENT_MODELS_BY_TYPE[garmentType].has(normalized as GarmentModel)
  ) {
    return normalized as GarmentModel;
  }
  return DEFAULT_GARMENT_MODEL_BY_TYPE[garmentType];
}

async function uploadImageForCatalog(file: File, category: "mockup" | "informative") {
  const contentType = resolveImageUploadContentType(file);
  const uploadFileName = buildUploadFileName(category, file, contentType);
  logCatalogUploadServer("prepare-image-upload", {
    category,
    file_name: file.name,
    upload_file_name: uploadFileName,
    file_size_bytes: file.size,
    file_size_mb: bytesToMb(file.size),
    content_type: contentType,
  });
  if (file.size > IMAGE_SOFT_LIMIT_BYTES) {
    console.warn("[catalog-upload][action] image-over-soft-limit", {
      category,
      file_name: file.name,
      file_size_bytes: file.size,
      file_size_mb: bytesToMb(file.size),
      soft_limit_mb: bytesToMb(IMAGE_SOFT_LIMIT_BYTES),
    });
  }

  let signed: Awaited<ReturnType<typeof signAdminAssetUpload>>;
  try {
    signed = await signAdminAssetUpload({
      file_name: uploadFileName,
      content_type: contentType,
      visibility: "public",
      category,
      ttl_sec: 900,
    });
  } catch (error) {
    throw new Error(
      `No se pudo firmar la subida de "${file.name}" (${category}): ${formatError(error)}`
    );
  }

  logCatalogUploadServer("signed-image-upload", {
    category,
    file_name: file.name,
    upload_file_name: uploadFileName,
    asset_id: signed.asset_id,
    upload_url: sanitizeUploadUrl(signed.upload_url),
    method: signed.method ?? "PUT",
  });

  try {
    await uploadAdminAssetFile(signed, file);
  } catch (error) {
    const uploadError = formatError(error);
    console.error("[catalog-upload][action] image-upload-error", {
      category,
      file_name: file.name,
      upload_file_name: uploadFileName,
      asset_id: signed.asset_id,
      upload_url: sanitizeUploadUrl(signed.upload_url),
      file_size_bytes: file.size,
      file_size_mb: bytesToMb(file.size),
      error: uploadError,
    });
    if (uploadError.includes("Asset upload failed (413)")) {
      throw new Error(
        `No se pudo subir "${file.name}" al storage (${category}): el servicio de assets rechazo el payload (413). Revisa el limite de body en http://localhost:8080/assets/{asset_id}/upload`
      );
    }
    throw new Error(
      `No se pudo subir "${file.name}" al storage (${category}): ${uploadError}`
    );
  }

  let resolved: Awaited<ReturnType<typeof resolveAdminAsset>>;
  try {
    resolved = await resolveAdminAsset(signed.asset_id, "public");
  } catch (error) {
    throw new Error(
      `No se pudo resolver la URL publica de "${file.name}" (${category}): ${formatError(error)}`
    );
  }

  const url =
    resolved.public_url ??
    resolved.url ??
    resolved.signed_url ??
    resolved.download_url ??
    null;
  if (!url) {
    throw new Error("No se pudo resolver la URL del asset subido.");
  }
  logCatalogUploadServer("resolved-image-upload", {
    category,
    file_name: file.name,
    upload_file_name: uploadFileName,
    asset_id: signed.asset_id,
    resolved_url: url,
  });
  return {
    assetId: signed.asset_id,
    url,
  };
}

async function uploadDtfAssetForCatalog(file: File) {
  const contentType = resolveDtfUploadContentType(file);
  const uploadFileName = buildUploadFileName("dtf", file, contentType);
  logCatalogUploadServer("prepare-dtf-upload", {
    file_name: file.name,
    upload_file_name: uploadFileName,
    file_size_bytes: file.size,
    file_size_mb: bytesToMb(file.size),
    content_type: contentType,
  });

  let signed: Awaited<ReturnType<typeof signAdminAssetUpload>>;
  try {
    signed = await signAdminAssetUpload({
      file_name: uploadFileName,
      content_type: contentType,
      visibility: "internal",
      category: "dtf",
      ttl_sec: 900,
    });
  } catch (error) {
    throw new Error(
      `No se pudo firmar la subida de "${file.name}" (dtf): ${formatError(error)}`
    );
  }

  logCatalogUploadServer("signed-dtf-upload", {
    file_name: file.name,
    upload_file_name: uploadFileName,
    asset_id: signed.asset_id,
    upload_url: sanitizeUploadUrl(signed.upload_url),
    method: signed.method ?? "PUT",
  });

  try {
    await uploadAdminAssetFile(signed, file);
  } catch (error) {
    console.error("[catalog-upload][action] dtf-upload-error", {
      file_name: file.name,
      upload_file_name: uploadFileName,
      asset_id: signed.asset_id,
      upload_url: sanitizeUploadUrl(signed.upload_url),
      file_size_bytes: file.size,
      file_size_mb: bytesToMb(file.size),
      error: formatError(error),
    });
    throw new Error(`No se pudo subir "${file.name}" al storage (dtf): ${formatError(error)}`);
  }

  return {
    assetId: signed.asset_id,
  };
}

function revalidateCatalogPages() {
  revalidatePath("/dashboard/catalogo");
  revalidatePath("/catalogo");
  revalidatePath("/drops");
  revalidatePath("/colecciones");
}

export async function createDesignAction(formData: FormData) {
  const name = asString(formData.get("name"));
  if (!name) {
    throw new Error("name es obligatorio.");
  }

  const defaultFrontFile = asFile(formData.get("default_front_design_file"));
  const defaultBackFile = asFile(formData.get("default_back_design_file"));
  const defaultFrontUrl = asOptionalString(formData.get("default_front_design_url"));
  const defaultBackUrl = asOptionalString(formData.get("default_back_design_url"));
  if (!defaultFrontFile && !defaultBackFile && !defaultFrontUrl && !defaultBackUrl) {
    throw new Error(
      "Debes subir al menos una imagen base frontal o trasera para crear el diseno."
    );
  }
  const defaultFrontUpload = defaultFrontFile
    ? await uploadImageForCatalog(defaultFrontFile, "informative")
    : null;
  const defaultBackUpload = defaultBackFile
    ? await uploadImageForCatalog(defaultBackFile, "informative")
    : null;

  let createdDesign: Awaited<ReturnType<typeof createAdminDesign>>;
  try {
    // Regla backend B3: siempre crear el diseno con has_variants=true.
    createdDesign = await createAdminDesign({
      name,
      has_variants: true,
      default_front_design_url: defaultFrontUpload?.url ?? defaultFrontUrl,
      default_back_design_url: defaultBackUpload?.url ?? defaultBackUrl,
    });
  } catch (error) {
    throw new Error(`No se pudo crear el diseno: ${formatError(error)}`);
  }

  const variantCount = Number(asString(formData.get("variant_count")) || "0");
  let createdVariantCount = 0;
  if (Number.isFinite(variantCount) && variantCount > 0) {
    for (let index = 0; index < variantCount; index += 1) {
      const name =
        asString(formData.get(`variant_name_${index}`)) ||
        asString(formData.get(`variant_label_${index}`)) ||
        asString(formData.get(`variant_code_${index}`));
      if (!name) continue;
      const code = normalizeVariantCode(name);
      const label = name;

      if (!code || !label) {
        throw new Error(`Variante ${index + 1}: nombre obligatorio.`);
      }

      const frontFile = asFile(formData.get(`variant_front_file_${index}`));
      const backFile = asFile(formData.get(`variant_back_file_${index}`));
      const frontDtfUpload = frontFile ? await uploadDtfAssetForCatalog(frontFile) : null;
      const backDtfUpload = backFile ? await uploadDtfAssetForCatalog(backFile) : null;
      const frontPreviewUpload = frontFile
        ? await uploadImageForCatalog(frontFile, "informative")
        : null;
      const backPreviewUpload = backFile
        ? await uploadImageForCatalog(backFile, "informative")
        : null;
      const dtfAssetId = frontDtfUpload?.assetId ?? backDtfUpload?.assetId ?? null;

      if (!dtfAssetId) {
        throw new Error(`Variante ${index + 1}: sube frontal o trasera para generar el DTF.`);
      }

      await createAdminDesignVariant({
        design_id: createdDesign.id,
        code,
        label,
        dtf_asset_id: dtfAssetId,
        public_preview_asset_id:
          frontPreviewUpload?.assetId ?? backPreviewUpload?.assetId ?? undefined,
        front_design_url: frontPreviewUpload?.url,
        back_design_url: backPreviewUpload?.url,
        is_active: true,
      });
      createdVariantCount += 1;
    }
  }

  // Si quedo exactamente una variante activa, lo pasamos a diseno unico.
  if (createdVariantCount === 1) {
    try {
      await updateAdminDesign(createdDesign.id, { has_variants: false });
    } catch (error) {
      throw new Error(
        `Se creo el diseno, pero no se pudo aplicar modo unico (B3): ${formatError(error)}`
      );
    }
  }

  revalidateCatalogPages();
}

export async function createDesignVariantAction(formData: FormData) {
  const designId = asString(formData.get("design_id"));
  const variantName =
    asString(formData.get("name")) ||
    asString(formData.get("label")) ||
    asString(formData.get("code"));
  const code = normalizeVariantCode(variantName);
  const label = variantName;
  const frontFile = asFile(formData.get("front_design_file"));
  const backFile = asFile(formData.get("back_design_file"));
  const frontDtfUpload = frontFile ? await uploadDtfAssetForCatalog(frontFile) : null;
  const backDtfUpload = backFile ? await uploadDtfAssetForCatalog(backFile) : null;
  const frontPreviewUpload = frontFile ? await uploadImageForCatalog(frontFile, "informative") : null;
  const backPreviewUpload = backFile ? await uploadImageForCatalog(backFile, "informative") : null;
  const dtfAssetId = frontDtfUpload?.assetId ?? backDtfUpload?.assetId ?? "";
  if (!designId || !code || !label || !dtfAssetId) {
    throw new Error("design_id, nombre y PNG frontal/trasero son obligatorios.");
  }

  // Al crear una nueva variante, garantizamos que el diseno pase a multi-variante.
  await updateAdminDesign(designId, { has_variants: true });

  await createAdminDesignVariant({
    design_id: designId,
    code,
    label,
    dtf_asset_id: dtfAssetId,
    public_preview_asset_id:
      frontPreviewUpload?.assetId ?? backPreviewUpload?.assetId ?? undefined,
    front_design_url:
      frontPreviewUpload?.url ?? asOptionalString(formData.get("front_design_url")),
    back_design_url:
      backPreviewUpload?.url ?? asOptionalString(formData.get("back_design_url")),
    is_active: !asString(formData.get("is_active")) || asBoolean(formData.get("is_active")),
  });
  revalidateCatalogPages();
}

export async function updateDesignAction(formData: FormData) {
  const designId = asString(formData.get("design_id"));
  if (!designId) {
    throw new Error("design_id es obligatorio.");
  }

  const frontFile = asFile(formData.get("default_front_design_file"));
  const backFile = asFile(formData.get("default_back_design_file"));
  const frontUpload = frontFile ? await uploadImageForCatalog(frontFile, "informative") : null;
  const backUpload = backFile ? await uploadImageForCatalog(backFile, "informative") : null;

  await updateAdminDesign(designId, {
    name: asOptionalString(formData.get("name")),
    has_variants: asBoolean(formData.get("has_variants")),
    default_front_design_url:
      frontUpload?.url ??
      asNullableString(formData.get("default_front_design_url")) ??
      undefined,
    default_back_design_url:
      backUpload?.url ??
      asNullableString(formData.get("default_back_design_url")) ??
      undefined,
  });
  revalidateCatalogPages();
}

export async function updateDesignVariantAction(formData: FormData) {
  const variantId = asString(formData.get("variant_id"));
  if (!variantId) {
    throw new Error("variant_id es obligatorio.");
  }

  const variantName = asOptionalString(formData.get("name"));
  const currentCode = asOptionalString(formData.get("current_code"));
  const currentLabel = asOptionalString(formData.get("current_label"));
  const shouldRename = Boolean(
    variantName && variantName !== (currentLabel ?? currentCode ?? "")
  );
  const frontFile = asFile(formData.get("front_design_file"));
  const backFile = asFile(formData.get("back_design_file"));
  const frontDtfUpload = frontFile ? await uploadDtfAssetForCatalog(frontFile) : null;
  const backDtfUpload = backFile ? await uploadDtfAssetForCatalog(backFile) : null;
  const frontPreviewUpload = frontFile ? await uploadImageForCatalog(frontFile, "informative") : null;
  const backPreviewUpload = backFile ? await uploadImageForCatalog(backFile, "informative") : null;

  const dtfAssetId = frontDtfUpload?.assetId ?? backDtfUpload?.assetId;

  await updateAdminDesignVariant(variantId, {
    code: shouldRename
      ? normalizeVariantCode(variantName ?? "")
      : currentCode ?? asOptionalString(formData.get("code")),
    label: shouldRename
      ? variantName
      : currentLabel ?? asOptionalString(formData.get("label")),
    dtf_asset_id: dtfAssetId,
    public_preview_asset_id:
      frontPreviewUpload?.assetId ?? backPreviewUpload?.assetId ?? undefined,
    front_design_url:
      frontPreviewUpload?.url ??
      asNullableString(formData.get("front_design_url")) ??
      undefined,
    back_design_url:
      backPreviewUpload?.url ??
      asNullableString(formData.get("back_design_url")) ??
      undefined,
    is_active: asBoolean(formData.get("is_active")),
  });
  revalidateCatalogPages();
}

export async function createPublicationAction(formData: FormData) {
  const title = asString(formData.get("title"));
  const designId = asString(formData.get("design_id"));
  if (!title || !designId) {
    throw new Error("title y design_id son obligatorios.");
  }
  ensureVariantPlannerConfirmation(formData);

  const slug = resolvePublicationSlug(asString(formData.get("slug")), title);
  const garmentType = asGarmentType(formData.get("garment_type"));
  const garmentModel = resolveGarmentModel(
    asOptionalString(formData.get("garment_model")),
    garmentType
  );
  const publicationGarmentModel =
    garmentType === "tshirt" ? garmentModel : undefined;
  const category = asCategory(formData.get("category")) || DEFAULT_PUBLICATION_CATEGORY;
  const priceMxn = asRequiredPositiveNumber(formData.get("price_mxn"), "price_mxn");
  const requestedIsActive = asBoolean(formData.get("is_active"));

  const informativeFile = asFile(formData.get("informative_image_file"));
  const informativeUpload = informativeFile
    ? await uploadImageForCatalog(informativeFile, "informative")
    : null;
  const informativeImageIdInput = asOptionalString(formData.get("informative_image_id"));

  let previewFrontAssetId = asOptionalString(formData.get("preview_front_asset_id"));
  let previewBackAssetId = asOptionalString(formData.get("preview_back_asset_id"));

  if (!previewFrontAssetId || !previewBackAssetId) {
    const variants = await listAdminDesignVariants({ design_id: designId, is_active: true });
    const designPreviewAssetId = variants.find((variant) => variant.public_preview_asset_id)
      ?.public_preview_asset_id;
    if (!previewFrontAssetId) {
      previewFrontAssetId = designPreviewAssetId ?? informativeUpload?.assetId;
    }
    if (!previewBackAssetId) {
      previewBackAssetId = designPreviewAssetId ?? informativeUpload?.assetId;
    }
  }

  const canActivate = Boolean(previewFrontAssetId && previewBackAssetId);
  const isActive = requestedIsActive && canActivate;
  const visibility: "visible" | "hidden" = isActive ? "visible" : "hidden";

  const publication = await createAdminPublication({
    slug,
    title,
    description: asOptionalString(formData.get("description")),
    garment_type: garmentType,
    garment_model: publicationGarmentModel,
    design_id: designId,
    category,
    visibility,
    is_active: isActive,
    is_seasonal: isSeasonalCategory(category),
    price_mxn: priceMxn,
    cover_asset_id: asOptionalString(formData.get("cover_asset_id")),
    preview_front_asset_id: previewFrontAssetId,
    preview_back_asset_id: previewBackAssetId,
    informative_image_id: informativeImageIdInput,
    viewer_asset_id: asOptionalString(formData.get("viewer_asset_id")),
    front_print_x_pct: asNumberOptional(formData.get("front_print_x_pct")),
    front_print_y_pct: asNumberOptional(formData.get("front_print_y_pct")),
    front_print_w_pct: asNumberOptional(formData.get("front_print_w_pct")),
    front_print_h_pct: asNumberOptional(formData.get("front_print_h_pct")),
    back_print_x_pct: asNumberOptional(formData.get("back_print_x_pct")),
    back_print_y_pct: asNumberOptional(formData.get("back_print_y_pct")),
    back_print_w_pct: asNumberOptional(formData.get("back_print_w_pct")),
    back_print_h_pct: asNumberOptional(formData.get("back_print_h_pct")),
  });

  if (informativeUpload?.assetId) {
    const createdInformativeImage = await createAdminInformativeImage({
      scope_type: "publication",
      scope_id: publication.id,
      asset_id: informativeUpload.assetId,
    });
    await updateAdminPublication(publication.id, {
      informative_image_id: createdInformativeImage.id,
    });
  }

  const initialQtyRaw = asString(formData.get("initial_stock_qty"));
  if (initialQtyRaw) {
    const quantity = asInteger(formData.get("initial_stock_qty"), "initial_stock_qty");
    if (quantity > 0) {
      await createInventoryEntry({
        garment_type: garmentType,
        garment_model: asOptionalString(formData.get("stock_garment_model")),
        color: asString(formData.get("stock_color")),
        size: asString(formData.get("stock_size")),
        grammage_g: asInteger(formData.get("stock_grammage_g"), "stock_grammage_g"),
        fit: asOptionalString(formData.get("stock_fit")),
        quantity,
        supplier_cost_mxn: asOptionalString(formData.get("supplier_cost_mxn")),
        supplier_name: asOptionalString(formData.get("supplier_name")),
        source_ref: `publication:${publication.id}`,
        reason: "initial_stock_from_publication",
      });
    }
  }

  revalidateCatalogPages();
  revalidatePath("/dashboard/inventario");
}

export async function updatePublicationAction(formData: FormData) {
  const publicationId = asString(formData.get("publication_id"));
  if (!publicationId) {
    throw new Error("publication_id es obligatorio.");
  }
  ensureVariantPlannerConfirmation(formData);

  const designId = asOptionalString(formData.get("design_id"));
  const category = asOptionalString(formData.get("category"))?.toLowerCase();
  const informativeFile = asFile(formData.get("informative_image_file"));
  const informativeUpload = informativeFile
    ? await uploadImageForCatalog(informativeFile, "informative")
    : null;
  const informativeImageIdInput = asNullableString(formData.get("informative_image_id"));
  const informativeImageId = informativeUpload?.assetId
    ? (
        await createAdminInformativeImage({
          scope_type: "publication",
          scope_id: publicationId,
          asset_id: informativeUpload.assetId,
        })
      ).id
    : (informativeImageIdInput === undefined ? undefined : informativeImageIdInput);

  await updateAdminPublication(publicationId, {
    title: asOptionalString(formData.get("title")),
    description: asOptionalString(formData.get("description")) ?? null,
    design_id: designId,
    category,
    visibility: asVisibility(formData.get("visibility")),
    is_active: asBoolean(formData.get("is_active")),
    is_seasonal: category ? isSeasonalCategory(category) : undefined,
    price_mxn: asNumberOptional(formData.get("price_mxn")),
    informative_image_id: informativeImageId,
    front_print_x_pct: asNumberOptional(formData.get("front_print_x_pct")),
    front_print_y_pct: asNumberOptional(formData.get("front_print_y_pct")),
    front_print_w_pct: asNumberOptional(formData.get("front_print_w_pct")),
    front_print_h_pct: asNumberOptional(formData.get("front_print_h_pct")),
    back_print_x_pct: asNumberOptional(formData.get("back_print_x_pct")),
    back_print_y_pct: asNumberOptional(formData.get("back_print_y_pct")),
    back_print_w_pct: asNumberOptional(formData.get("back_print_w_pct")),
    back_print_h_pct: asNumberOptional(formData.get("back_print_h_pct")),
  });

  revalidateCatalogPages();
}

export async function publishPublicationAction(formData: FormData) {
  const publicationId = asString(formData.get("publication_id"));
  if (!publicationId) throw new Error("publication_id es obligatorio.");
  await publishAdminPublication(publicationId);
  revalidateCatalogPages();
}

export async function unpublishPublicationAction(formData: FormData) {
  const publicationId = asString(formData.get("publication_id"));
  if (!publicationId) throw new Error("publication_id es obligatorio.");
  await unpublishAdminPublication(publicationId);
  revalidateCatalogPages();
}

export async function createPublicationMockupAction(formData: FormData) {
  const publicationId = asString(formData.get("publication_id"));
  const viewSide = asString(formData.get("view_side")).toLowerCase();
  const mockupAssetId = asString(formData.get("mockup_asset_id"));
  if (!publicationId || !viewSide || !mockupAssetId) {
    throw new Error("publication_id, view_side y mockup_asset_id son obligatorios.");
  }

  await createAdminPublicationMockup(publicationId, {
    variant_id: asOptionalString(formData.get("variant_id")),
    garment_color: asOptionalString(formData.get("garment_color")),
    view_side: viewSide === "back" ? "back" : "front",
    mockup_asset_id: mockupAssetId,
    mockup_url: asOptionalString(formData.get("mockup_url")),
  });
  revalidateCatalogPages();
}

export async function createInformativeImageOverrideAction(formData: FormData) {
  const assetId = asString(formData.get("asset_id"));
  if (!assetId) throw new Error("asset_id es obligatorio.");

  await createAdminInformativeImage({
    scope_type: (asString(formData.get("scope_type")) || "publication") as
      | "global"
      | "publication"
      | "collection"
      | "drop",
    scope_id: asOptionalString(formData.get("scope_id")),
    asset_id: assetId,
  });
  revalidateCatalogPages();
}

export async function createCollectionAction(formData: FormData) {
  const title = asString(formData.get("title"));
  if (!title) {
    throw new Error("title es obligatorio.");
  }
  const slug = resolvePublicationSlug(asString(formData.get("slug")), title);

  const collection = await createAdminCollection({
    slug,
    title,
    description: asOptionalString(formData.get("description")),
    visibility: asVisibility(formData.get("visibility")),
  });
  const publicationIds = parsePublicationIds(formData);
  if (publicationIds.length > 0) {
    await replaceAdminCollectionItems(collection.id, publicationIds);
  }
  revalidateCatalogPages();
}

export async function updateCollectionAction(formData: FormData) {
  const id = asString(formData.get("collection_id"));
  if (!id) throw new Error("collection_id es obligatorio.");

  await updateAdminCollection(id, {
    title: asOptionalString(formData.get("title")),
    description: asOptionalString(formData.get("description")) ?? null,
    visibility: asVisibility(formData.get("visibility")),
  });
  revalidateCatalogPages();
}

export async function replaceCollectionItemsAction(formData: FormData) {
  const id = asString(formData.get("collection_id"));
  if (!id) throw new Error("collection_id es obligatorio.");

  const publicationIds = parsePublicationIds(formData);
  await replaceAdminCollectionItems(id, publicationIds);
  revalidateCatalogPages();
}

export async function createDropAction(formData: FormData) {
  const title = asString(formData.get("title"));
  if (!title) {
    throw new Error("title es obligatorio.");
  }
  const slug = resolvePublicationSlug(asString(formData.get("slug")), title);

  const status = asStatus(formData.get("status"));
  const startsAt = parseDateTimeAsIso(formData.get("starts_at"));
  let endsAt = parseDateTimeAsIso(formData.get("ends_at"));

  if ((status === "preview" || status === "active") && !startsAt) {
    throw new Error("starts_at es obligatorio para preview/active.");
  }
  if (status === "ended" && !endsAt) {
    endsAt = new Date().toISOString();
  }

  const drop = await createAdminDrop({
    slug,
    title,
    description: asOptionalString(formData.get("description")),
    status,
    starts_at: startsAt,
    ends_at: endsAt,
    capacity_total: parseCapacity(formData.get("capacity_total")),
    visibility: asVisibility(formData.get("visibility")),
  });
  const publicationIds = parsePublicationIds(formData);
  if (publicationIds.length > 0) {
    await replaceAdminDropItems(drop.id, publicationIds);
  }
  revalidateCatalogPages();
}

export async function updateDropAction(formData: FormData) {
  const id = asString(formData.get("drop_id"));
  if (!id) throw new Error("drop_id es obligatorio.");

  const status = asStatus(formData.get("status"));
  const startsAt = parseDateTimeAsIso(formData.get("starts_at"));
  let endsAt = parseDateTimeAsIso(formData.get("ends_at"));

  if ((status === "preview" || status === "active") && !startsAt) {
    throw new Error("starts_at es obligatorio para preview/active.");
  }
  if (status === "ended" && !endsAt) {
    endsAt = new Date().toISOString();
  }

  await updateAdminDrop(id, {
    title: asOptionalString(formData.get("title")),
    description: asOptionalString(formData.get("description")) ?? null,
    status,
    starts_at: startsAt,
    ends_at: endsAt,
    capacity_total: parseCapacity(formData.get("capacity_total")),
    visibility: asVisibility(formData.get("visibility")),
  });
  revalidateCatalogPages();
}

export async function endDropNowAction(formData: FormData) {
  const id = asString(formData.get("drop_id"));
  if (!id) throw new Error("drop_id es obligatorio.");

  await updateAdminDrop(id, {
    status: "ended",
    ends_at: new Date().toISOString(),
  });
  revalidateCatalogPages();
}

export async function replaceDropItemsAction(formData: FormData) {
  const id = asString(formData.get("drop_id"));
  if (!id) throw new Error("drop_id es obligatorio.");

  const publicationIds = parsePublicationIds(formData);
  await replaceAdminDropItems(id, publicationIds);
  revalidateCatalogPages();
}
