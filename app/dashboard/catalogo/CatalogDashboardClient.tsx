"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Checkbox, CheckboxControl, DashboardModal, FileUpload, RadioControl, SelectField, TextField } from "@/core/design-system";
import { TextAreaField } from "@/core/design-system";
import type { FileUploadValue } from "@/core/design-system/primitives/upload/FileUpload";
import { FormErrorBag } from "@/core/design-system/feedback/FormErrorBag";
import { toFormErrorBag, type FormErrorBag as FormErrorBagState } from "@/core/design-system/feedback/form-errors";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import { cn } from "@/core/lib/utils/cn";
import type {
  AdminCollection,
  AdminDesign,
  AdminDesignVariant,
  AdminDrop,
  AdminPublication,
} from "@/modules/dashboard/catalog/server/api";

type ServerAction = (formData: FormData) => Promise<void>;

type CatalogActions = {
  createCollectionAction: ServerAction;
  createDesignAction: ServerAction;
  createDesignVariantAction: ServerAction;
  createDropAction: ServerAction;
  createInformativeImageOverrideAction: ServerAction;
  createPublicationAction: ServerAction;
  createPublicationMockupAction: ServerAction;
  endDropNowAction: ServerAction;
  publishPublicationAction: ServerAction;
  replaceCollectionItemsAction: ServerAction;
  replaceDropItemsAction: ServerAction;
  unpublishPublicationAction: ServerAction;
  updateCollectionAction: ServerAction;
  updateDesignAction: ServerAction;
  updateDesignVariantAction: ServerAction;
  updateDropAction: ServerAction;
  updatePublicationAction: ServerAction;
};

type CatalogDashboardClientProps = {
  collections: AdminCollection[];
  drops: AdminDrop[];
  publications: AdminPublication[];
  designs: AdminDesign[];
  variants: AdminDesignVariant[];
  collectionItemIdsByCollectionId: Record<string, string[]>;
  dropItemIdsByDropId: Record<string, string[]>;
  actions: CatalogActions;
};

type ModalId =
  | null
  | "create-design"
  | "create-publication"
  | "create-collection"
  | "create-drop"
  | "edit-design"
  | "edit-publication"
  | "edit-collection"
  | "edit-drop";

type PublicationCategoryOption = {
  value: string;
  label: string;
};

type GarmentOption = {
  value: string;
  label: string;
};

type CreatePublicationGarmentType = "tshirt" | "hoodie";

const PUBLICATION_CATEGORY_OPTIONS: PublicationCategoryOption[] = [
  { value: "music_artists", label: "Musica y artistas" },
  { value: "sports", label: "Deportes" },
  { value: "vehicles", label: "Vehiculos" },
  { value: "trends", label: "Tendencias" },
  { value: "duo", label: "Duo" },
  { value: "series_movies_videogames", label: "Series, peliculas y videojuegos" },
  { value: "cities_countries", label: "Ciudades y paises" },
  { value: "amor_amistad", label: "Amor y amistad" },
  { value: "navidad", label: "Navidad" },
  { value: "halloween", label: "Halloween" },
  { value: "dia_de_muertos", label: "Dia de muertos" },
];

const DEFAULT_CREATE_PUBLICATION_GARMENT_TYPE: CreatePublicationGarmentType = "tshirt";

const GARMENT_TYPE_OPTIONS: GarmentOption[] = [
  { value: "tshirt", label: "Playera" },
  { value: "hoodie", label: "Hoodie" },
];

const GARMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  GARMENT_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

const GARMENT_MODEL_OPTIONS_BY_TYPE: Record<CreatePublicationGarmentType, GarmentOption[]> = {
  tshirt: [
    { value: "oversize", label: "Oversize" },
    { value: "long_sleeve_oversize", label: "Manga larga oversize" },
    { value: "regular", label: "Regular" },
  ],
  hoodie: [
    { value: "hoodie_semi_oversize", label: "Hoodie semi-oversize" },
    { value: "hoodie_oversize", label: "Hoodie oversize" },
  ],
};

const DEFAULT_GARMENT_MODEL_BY_TYPE: Record<CreatePublicationGarmentType, string> = {
  tshirt: "oversize",
  hoodie: "hoodie_semi_oversize",
};

type CreateDesignVariantDraft = {
  id: string;
  name: string;
};

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDesignVariantDraft(): CreateDesignVariantDraft {
  return {
    id: createDraftId(),
    name: "",
  };
}

function isSelectedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.name.length > 0;
}

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function money(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function titleCase(input: string): string {
  return input
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function garmentTypeLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  return GARMENT_TYPE_LABELS[normalized] ?? titleCase(value);
}

type DesignSide = "front" | "back";

function asImageUrl(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function initials(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "DS";
  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function variantDisplayName(variant: AdminDesignVariant): string {
  const label = variant.label.trim();
  if (label) return label;
  return variant.code.trim() || "Variante";
}

function designImageBySide(design: AdminDesign | undefined, side: DesignSide): string | null {
  if (!design) return null;
  return side === "front"
    ? asImageUrl(design.default_front_design_url)
    : asImageUrl(design.default_back_design_url);
}

function variantImageBySide(
  variant: AdminDesignVariant,
  design: AdminDesign | undefined,
  side: DesignSide
): string | null {
  const ownImage =
    side === "front" ? asImageUrl(variant.front_design_url) : asImageUrl(variant.back_design_url);
  return ownImage ?? designImageBySide(design, side);
}

type PlannerVariantPreview = {
  id: string;
  code: string;
  label: string;
  frontSrc: string | null;
  backSrc: string | null;
};

function toPlannerVariantPreviews(
  variants: AdminDesignVariant[],
  design: AdminDesign | undefined
): PlannerVariantPreview[] {
  return variants.map((variant) => ({
    id: variant.id,
    code: variant.code || variantDisplayName(variant),
    label: variantDisplayName(variant),
    frontSrc: variantImageBySide(variant, design, "front"),
    backSrc: variantImageBySide(variant, design, "back"),
  }));
}

/** Compact dashboard form controls. The page configures semantics; geometry
 * and focus behavior stay in the shared design-system primitives. */
function CatalogTextField({ wrapperClassName, shellClassName, inputClassName, ...props }: ComponentProps<typeof TextField>) {
  return (
    <TextField
      size="sm"
      {...props}
      wrapperClassName={cn("space-y-1.5", wrapperClassName)}
      shellClassName={cn("", shellClassName)}
      inputClassName={cn("text-[11px]", inputClassName)}
    />
  );
}

function CatalogTextArea({ wrapperClassName, shellClassName, textareaClassName, ...props }: ComponentProps<typeof TextAreaField>) {
  return (
    <TextAreaField
      size="sm"
      {...props}
      wrapperClassName={cn("space-y-1.5", wrapperClassName)}
      shellClassName={cn(" ", shellClassName)}
      textareaClassName={cn("text-[11px]", textareaClassName)}
    />
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-md border border-hairline bg-soft-cloud/80 p-4">
      <p className="text-xs font-black uppercase text-mute">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </article>
  );
}

function ActionButton({
  label,
  onClick,
  primary,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border border-hairline bg-soft-cloud p-4 transition hover:border-info ${primary ? "border-primary bg-primary/10" : ""}`}
    >
      {label}
    </button>
  );
}

const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
const IMAGE_UPLOAD_TRANSPORT_TARGET_BYTES = 1900 * 1024;
const IMAGE_COMPRESSION_QUALITIES = [0.9, 0.8, 0.7, 0.6, 0.5, 0.42];
const IMAGE_MAX_DIMENSION = 2600;
const IMAGE_SCALE_STEPS = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
type ImageOptimizationMode = "informative" | "dtf";

function bytesToMb(value: number): string {
  return (value / (1024 * 1024)).toFixed(2);
}

function logCatalogUploadClient(event: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[catalog-upload][client] ${event}`, payload);
}

function normalizeImageMimeType(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  return normalized;
}

function extensionForImageMimeType(mimeType: string): string {
  const normalized = normalizeImageMimeType(mimeType);
  if (normalized === "image/png") return "png";
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/webp") return "webp";
  return "bin";
}

function isDtfCompatibleMimeType(mimeType: string): boolean {
  const normalized = normalizeImageMimeType(mimeType);
  return normalized === "image/png" || normalized === "image/jpeg" || normalized === "application/pdf";
}

function normalizeOptimizedImageName(fileName: string, mimeType: string): string {
  const base = fileName.replace(/\.[^/.]+$/, "");
  return `${base}-comprimida.${extensionForImageMimeType(mimeType)}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("No se pudo leer la imagen."));
      image.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

type OptimizedFileResult = {
  file: File;
  notice: string | null;
  compressed: boolean;
};

async function optimizeImageFileForCatalog(
  file: File,
  mode: ImageOptimizationMode = "informative"
): Promise<OptimizedFileResult> {
  if (!file.type.startsWith("image/")) {
    return { file, notice: null, compressed: false };
  }

  const normalizedInputMimeType = normalizeImageMimeType(file.type);
  const requiresDtfCompatibleType = mode === "dtf";
  const mustConvertForDtf = requiresDtfCompatibleType && !isDtfCompatibleMimeType(normalizedInputMimeType);
  const targetMimeType =
    mode === "dtf"
      ? normalizedInputMimeType === "image/png" && !mustConvertForDtf
        ? "image/png"
        : "image/jpeg"
      : "image/webp";

  const needsSoftLimitOptimization = file.size > MAX_IMAGE_UPLOAD_BYTES;
  const needsTransportOptimization = file.size > IMAGE_UPLOAD_TRANSPORT_TARGET_BYTES;
  const targetBytes = Math.min(MAX_IMAGE_UPLOAD_BYTES, IMAGE_UPLOAD_TRANSPORT_TARGET_BYTES);

  if (!needsSoftLimitOptimization && !needsTransportOptimization && !mustConvertForDtf) {
    return { file, notice: null, compressed: false };
  }

  const image = await loadImageElement(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return {
      file,
      notice:
        "La imagen es muy grande. No se pudo comprimir en el navegador, se intentara subir igual.",
      compressed: false,
    };
  }

  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const baseScale = longestSide > IMAGE_MAX_DIMENSION ? IMAGE_MAX_DIMENSION / longestSide : 1;

  let bestFile = file;

  for (const scaleStep of IMAGE_SCALE_STEPS) {
    const scale = Math.min(1, baseScale * scaleStep);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of IMAGE_COMPRESSION_QUALITIES) {
      const blob = await canvasToBlob(canvas, targetMimeType, quality);
      if (!blob) continue;

      const candidate = new File([blob], normalizeOptimizedImageName(file.name, targetMimeType), {
        type: targetMimeType,
        lastModified: Date.now(),
      });

      if (candidate.size < bestFile.size) {
        bestFile = candidate;
      }

      if (candidate.size <= targetBytes) {
        const modeNotice =
          mustConvertForDtf && requiresDtfCompatibleType
            ? "Se convirtio automaticamente a formato compatible DTF (JPEG). "
            : "";
        return {
          file: candidate,
          compressed: true,
          notice: needsSoftLimitOptimization
            ? `${modeNotice}La imagen es muy grande y se comprimio para hacer facil su uso. Se subira la version optimizada.`
            : `${modeNotice}La imagen se optimizo para facilitar la subida. Se usara la version comprimida.`,
        };
      }
    }
  }

  if (bestFile !== file) {
    const modeNotice =
      mustConvertForDtf && requiresDtfCompatibleType
        ? "Se convirtio automaticamente a formato compatible DTF (JPEG). "
        : "";
    return {
      file: bestFile,
      compressed: true,
      notice: needsSoftLimitOptimization
        ? `${modeNotice}La imagen es muy grande y se comprimio para hacer facil su uso, pero aun quedo en ${bytesToMb(bestFile.size)} MB. Se permitira subirla.`
        : `${modeNotice}La imagen se optimizo para facilitar la subida, pero aun quedo en ${bytesToMb(bestFile.size)} MB. Se permitira subirla.`,
    };
  }

  return {
    file,
    compressed: false,
    notice:
      "La imagen es muy grande y no se pudo comprimir en el navegador. Se intentara subir igual.",
  };
}

type ImageUploadFieldProps = {
  name: string;
  label: string;
  initialPreviewSrc?: string | null;
  hint?: string;
  required?: boolean;
  className?: string;
  onFileChange?: (file: File | null) => void;
  invalid?: boolean;
  optimizationMode?: ImageOptimizationMode;
};

function ImageUploadField({
  name,
  label,
  initialPreviewSrc,
  hint,
  required,
  className,
  onFileChange,
  invalid,
  optimizationMode = "informative",
}: ImageUploadFieldProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const initialValue = asImageUrl(initialPreviewSrc)
    ? ([{ name: `${label} actual`, type: "image/*", url: asImageUrl(initialPreviewSrc) ?? undefined }] satisfies FileUploadValue[])
    : undefined;

  const processFile = async (file: File) => {
    setNotice(null);
    const optimized = await optimizeImageFileForCatalog(file, optimizationMode);
    setNotice(optimized.notice);
    logCatalogUploadClient("file-processed", {
      input_name: name,
      original_name: file.name,
      original_size_bytes: file.size,
      original_size_mb: bytesToMb(file.size),
      final_name: optimized.file.name,
      final_size_bytes: optimized.file.size,
      final_size_mb: bytesToMb(optimized.file.size),
      compressed: optimized.compressed,
      optimization_mode: optimizationMode,
    });
    return optimized.file;
  };

  return (
    <FileUpload
      key={`${name}-${initialPreviewSrc ?? "empty"}`}
      name={name}
      label={label}
      description={notice ?? hint}
      error={invalid ? "Selecciona una imagen válida." : undefined}
      required={required}
      acceptedTypes={["image/*"]}
      maxSize={MAX_IMAGE_UPLOAD_BYTES}
      defaultValue={initialValue}
      processFile={processFile}
      onProcessingChange={setOptimizing}
      onChange={(files) => onFileChange?.(files[0] ?? null)}
      onError={setNotice}
      className={className}
      dropLabel={optimizing ? "Optimizando imagen…" : "Arrastra una imagen o selecciona para explorar"}
    />
  );
}

function DesignPreviewFlip({
  frontSrc,
  backSrc,
  fallbackLabel,
  compact,
  className,
}: {
  frontSrc: string | null;
  backSrc: string | null;
  fallbackLabel: string;
  compact?: boolean;
  className?: string;
}) {
  const fallbackText = initials(fallbackLabel);
  const containerClassName = [
    "relative overflow-hidden rounded-md border border-hairline bg-white",
    compact ? "max-w-xs" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className="relative w-full h-full relative">
        {frontSrc ? (
          <img src={frontSrc} alt={`${fallbackLabel} frente`} className="w-full h-full object-contain" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-mute">
            <span>{fallbackText}</span>
            <small>Frente</small>
          </div>
        )}
      </div>
      <div className="relative w-full h-full relative">
        {backSrc ? (
          <img src={backSrc} alt={`${fallbackLabel} espalda`} className="w-full h-full object-contain" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-mute">
            <span>{fallbackText}</span>
            <small>Espalda</small>
          </div>
        )}
      </div>
    </div>
  );
}

type SelectDesignCardsProps = {
  designs: AdminDesign[];
  variantsByDesign: Map<string, AdminDesignVariant[]>;
  selectedDesignId: string;
  onSelectDesign: (designId: string) => void;
  compact?: boolean;
};

function SelectDesignCards({
  designs,
  variantsByDesign,
  selectedDesignId,
  onSelectDesign,
  compact,
}: SelectDesignCardsProps) {
  const selectedDesign = designs.find((design) => design.id === selectedDesignId) ?? null;
  const selectedDesignVariants = selectedDesign ? variantsByDesign.get(selectedDesign.id) ?? [] : [];

  return (
    <fieldset className="rounded-md border border-hairline bg-soft-cloud/60 p-4 md:col-span-2">
      <legend className="text-xs font-black uppercase text-ink px-1">Seleccion visual de diseno</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {designs.map((design, index) => {
          const frontSrc = designImageBySide(design, "front");
          const backSrc = designImageBySide(design, "back");
          const variantCount = variantsByDesign.get(design.id)?.length ?? 0;

          return (
            <label key={design.id} className="relative flex cursor-pointer rounded-md border border-hairline bg-soft-cloud p-3 transition hover:border-info">
              <RadioControl
                name="design_id"
                value={design.id}
                required={index === 0}
                checked={selectedDesignId === design.id}
                onChange={() => onSelectDesign(design.id)}
                className="sr-only"
              />
              <span className="space-y-1">
                <DesignPreviewFlip
                  frontSrc={frontSrc}
                  backSrc={backSrc}
                  fallbackLabel={design.name}
                  compact={compact}
                  className={compact ? "cursor-pointer hover:border-info" : undefined}
                />
                <span className="text-xs font-black uppercase text-ink">{design.name}</span>
                <span className="text-xs text-mute">
                  {design.has_variants ? "Diseno con variantes" : "Diseno unico"}
                </span>
                <span className="text-xs text-mute text-xs font-black text-ink">
                  {variantCount} variante{variantCount === 1 ? "" : "s"} activa{variantCount === 1 ? "" : "s"}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {selectedDesign && !compact ? (
        <div className="rounded-md border border-hairline bg-soft-cloud p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-info">Variantes del diseno seleccionado</p>
          <p className="text-sm font-black uppercase text-ink">{selectedDesign.name}</p>
          {selectedDesignVariants.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedDesignVariants.map((variant) => (
                <article key={variant.id} className="flex items-center justify-between rounded-md border border-hairline bg-white p-3">
                  <DesignPreviewFlip
                    frontSrc={variantImageBySide(variant, selectedDesign, "front")}
                    backSrc={variantImageBySide(variant, selectedDesign, "back")}
                    fallbackLabel={`${selectedDesign.name} ${variantDisplayName(variant)}`}
                    compact
                  />
                  <p className="text-xs font-black text-ink">{variantDisplayName(variant)}</p>
                  <p className="text-[11px] text-mute">{variant.code}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mute py-4 text-center">
              Este diseno aun no tiene variantes activas. Puedes publicar con diseno base y despues agregar variantes.
            </p>
          )}
        </div>
      ) : null}
    </fieldset>
  );
}

type PrintArea = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type VariantPrintState = {
  front: PrintArea;
  back: PrintArea;
  confirmed: boolean;
};

type VariantStateMap = Record<string, VariantPrintState>;

type PrintAreaPlannerProps = {
  frontSrc: string | null;
  backSrc: string | null;
  fallbackLabel: string;
  variants?: PlannerVariantPreview[];
  initialFront?: Partial<PrintArea>;
  initialBack?: Partial<PrintArea>;
  onVariantConfirmationChange?: (isReady: boolean) => void;
};

const DEFAULT_FRONT_PRINT: PrintArea = { x: 33, y: 20, w: 34, h: 36 };
const DEFAULT_BACK_PRINT: PrintArea = { x: 33, y: 18, w: 34, h: 38 };
const DEFAULT_PRINT_STAGE_MOCKUP = "/tiles/oversize-negra.webp";
const EMPTY_PLANNER_VARIANTS: PlannerVariantPreview[] = [];
const BASE_PLANNER_VARIANT_ID = "__base__";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizePrintArea(value: Partial<PrintArea> | undefined, fallback: PrintArea): PrintArea {
  return {
    x: round2(clamp(value?.x ?? fallback.x, 0, 100)),
    y: round2(clamp(value?.y ?? fallback.y, 0, 100)),
    w: round2(clamp(value?.w ?? fallback.w, 6, 100)),
    h: round2(clamp(value?.h ?? fallback.h, 6, 100)),
  };
}

type DragState =
  | null
  | {
      variantId: string;
      side: DesignSide;
      mode: "move" | "resize";
      startX: number;
      startY: number;
      startArea: PrintArea;
      rect: DOMRect;
    };

function buildVariantPrintState(
  initialFront: Partial<PrintArea> | undefined,
  initialBack: Partial<PrintArea> | undefined,
  confirmed: boolean
): VariantPrintState {
  return {
    front: normalizePrintArea(initialFront, DEFAULT_FRONT_PRINT),
    back: normalizePrintArea(initialBack, DEFAULT_BACK_PRINT),
    confirmed,
  };
}

function buildVariantStateMap(
  variantIds: string[],
  initialFront: Partial<PrintArea> | undefined,
  initialBack: Partial<PrintArea> | undefined,
  confirmed: boolean
): VariantStateMap {
  const entries = variantIds.map((variantId) => [
    variantId,
    buildVariantPrintState(initialFront, initialBack, confirmed),
  ]);
  return Object.fromEntries(entries) as VariantStateMap;
}

function PrintAreaPlanner({
  frontSrc,
  backSrc,
  fallbackLabel,
  variants,
  initialFront,
  initialBack,
  onVariantConfirmationChange,
}: PrintAreaPlannerProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const plannerVariants = variants ?? EMPTY_PLANNER_VARIANTS;
  const hasExplicitVariants = plannerVariants.length > 0;
  const editableVariants = useMemo(
    () =>
      hasExplicitVariants
        ? plannerVariants
        : [
            {
              id: BASE_PLANNER_VARIANT_ID,
              code: "BASE",
              label: fallbackLabel,
              frontSrc,
              backSrc,
            },
          ],
    [backSrc, fallbackLabel, frontSrc, hasExplicitVariants, plannerVariants]
  );
  const [activeVariantId, setActiveVariantId] = useState<string>(
    editableVariants[0]?.id ?? BASE_PLANNER_VARIANT_ID
  );
  const [variantStates, setVariantStates] = useState<VariantStateMap>(() =>
    buildVariantStateMap(
      editableVariants.map((variant) => variant.id),
      initialFront,
      initialBack,
      !hasExplicitVariants
    )
  );
  const [side, setSide] = useState<DesignSide>("front");
  const [drag, setDrag] = useState<DragState>(null);

  const resolvedActiveVariantId = useMemo(() => {
    if (editableVariants.some((variant) => variant.id === activeVariantId)) {
      return activeVariantId;
    }
    return editableVariants[0]?.id ?? BASE_PLANNER_VARIANT_ID;
  }, [activeVariantId, editableVariants]);

  const activeVariant = useMemo(
    () =>
      editableVariants.find((variant) => variant.id === resolvedActiveVariantId) ??
      editableVariants[0] ??
      null,
    [editableVariants, resolvedActiveVariantId]
  );
  const fallbackState = useMemo(
    () => buildVariantPrintState(initialFront, initialBack, !hasExplicitVariants),
    [hasExplicitVariants, initialBack, initialFront]
  );
  const activeVariantState = variantStates[resolvedActiveVariantId] ?? fallbackState;
  const primaryVariantState =
    variantStates[editableVariants[0]?.id ?? BASE_PLANNER_VARIANT_ID] ?? fallbackState;
  const variantPrintMapJson = useMemo(
    () =>
      hasExplicitVariants
        ? JSON.stringify(
            editableVariants.map((variant) => {
              const state = variantStates[variant.id] ?? fallbackState;
              return {
                variant_id: variant.id,
                front_print_x_pct: state.front.x,
                front_print_y_pct: state.front.y,
                front_print_w_pct: state.front.w,
                front_print_h_pct: state.front.h,
                back_print_x_pct: state.back.x,
                back_print_y_pct: state.back.y,
                back_print_w_pct: state.back.w,
                back_print_h_pct: state.back.h,
              };
            })
          )
        : "",
    [editableVariants, fallbackState, hasExplicitVariants, variantStates]
  );
  const activeFrontSrc = activeVariant?.frontSrc ?? frontSrc;
  const activeBackSrc = activeVariant?.backSrc ?? backSrc;
  const availableSides = useMemo(() => {
    const list: DesignSide[] = [];
    if (activeFrontSrc) list.push("front");
    if (activeBackSrc) list.push("back");
    return list.length > 0 ? list : (["front"] as DesignSide[]);
  }, [activeBackSrc, activeFrontSrc]);
  const effectiveSide = availableSides.includes(side) ? side : availableSides[0];

  useEffect(() => {
    if (!drag) return;
    const onPointerMove = (event: PointerEvent) => {
      const deltaX = ((event.clientX - drag.startX) / drag.rect.width) * 100;
      const deltaY = ((event.clientY - drag.startY) / drag.rect.height) * 100;
      const candidate =
        drag.mode === "move"
          ? {
              ...drag.startArea,
              x: round2(clamp(drag.startArea.x + deltaX, 0, 100 - drag.startArea.w)),
              y: round2(clamp(drag.startArea.y + deltaY, 0, 100 - drag.startArea.h)),
            }
          : {
              ...drag.startArea,
              w: round2(clamp(drag.startArea.w + deltaX, 6, 100 - drag.startArea.x)),
              h: round2(clamp(drag.startArea.h + deltaY, 6, 100 - drag.startArea.y)),
            };
      setVariantStates((previous) => {
        const current = previous[drag.variantId] ?? fallbackState;
        const next: VariantPrintState =
          drag.side === "front" ? { ...current, front: candidate } : { ...current, back: candidate };
        return {
          ...previous,
          [drag.variantId]: next,
        };
      });
    };
    const onPointerUp = () => setDrag(null);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, fallbackState]);

  const allVariantsConfirmed = useMemo(() => {
    if (!hasExplicitVariants) return true;
    return editableVariants.every((variant) => variantStates[variant.id]?.confirmed);
  }, [editableVariants, hasExplicitVariants, variantStates]);

  useEffect(() => {
    onVariantConfirmationChange?.(allVariantsConfirmed);
  }, [allVariantsConfirmed, onVariantConfirmationChange]);

  const activeArea = effectiveSide === "front" ? activeVariantState.front : activeVariantState.back;
  const activeSrc = effectiveSide === "front" ? activeFrontSrc : activeBackSrc;

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, mode: "move" | "resize") => {
    if (!activeSrc) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    setDrag({
      variantId: resolvedActiveVariantId,
      side: effectiveSide,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startArea: activeArea,
      rect,
    });
  };

  const activeVariantConfirmed = Boolean(activeVariant && variantStates[activeVariant.id]?.confirmed);
  const confirmedCount = useMemo(
    () => editableVariants.filter((variant) => variantStates[variant.id]?.confirmed).length,
    [editableVariants, variantStates]
  );

  const confirmActiveVariant = () => {
    if (!activeVariant) return;
    setVariantStates((previous) => {
      const current = previous[activeVariant.id] ?? fallbackState;
      return {
        ...previous,
        [activeVariant.id]: { ...current, confirmed: true },
      };
    });
  };

  return (
    <div className="space-y-4 rounded-md border border-hairline bg-soft-cloud p-4 md:col-span-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black uppercase text-ink">Editor visual de area de impresion</p>
        <div className="relative h-full w-full">
          {availableSides.includes("front") ? (
            <button
              type="button"
              className={`inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed ${effectiveSide === "front" ? "border-info/40 bg-info/12 text-charcoal" : ""}`}
              onClick={() => setSide("front")}
            >
              Frontal
            </button>
          ) : null}
          {availableSides.includes("back") ? (
            <button
              type="button"
              className={`inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed ${effectiveSide === "back" ? "border-info/40 bg-info/12 text-charcoal" : ""}`}
              onClick={() => setSide("back")}
            >
              Trasera
            </button>
          ) : null}
        </div>
      </div>
      {hasExplicitVariants ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {editableVariants.map((variant) => {
            const selected = resolvedActiveVariantId === variant.id;
            const confirmed = Boolean(variantStates[variant.id]?.confirmed);
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setActiveVariantId(variant.id)}
                className={`inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed ${selected ? "border-info/40 bg-info/12 text-charcoal" : ""}`}
                title={variant.label}
              >
                {variant.code}
                {confirmed ? " \u2713" : ""}
              </button>
            );
          })}
          <button
            type="button"
            onClick={confirmActiveVariant}
            className={`inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed ${activeVariantConfirmed ? "border-info/40 bg-info/12 text-charcoal" : ""}`}
            disabled={!activeVariant}
          >
            {activeVariantConfirmed ? "Variante confirmada" : "Confirmar variante"}
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.62)]">
            {confirmedCount}/{editableVariants.length} variantes
          </span>
          <span className="text-[10px] text-[rgba(8,10,13,.62)]">
            Cada variante guarda su area por separado.
          </span>
        </div>
      ) : null}
      <div ref={stageRef} className="relative mx-auto aspect-square max-w-sm rounded-md border border-hairline bg-white p-4">
        <img
          src={DEFAULT_PRINT_STAGE_MOCKUP}
          alt="Mockup negro de playera"
          className="h-full w-full object-contain"
        />
        {activeSrc ? (
          <div
            className="absolute border-2 border-dashed border-info"
            style={{
              left: `${activeArea.x}%`,
              top: `${activeArea.y}%`,
              width: `${activeArea.w}%`,
              height: `${activeArea.h}%`,
            }}
            onPointerDown={(event) => startDrag(event, "move")}
          >
            <img
              src={activeSrc}
              alt={`${fallbackLabel} ${effectiveSide}`}
              className="h-full w-full object-contain"
            />
            <div
              className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-info"
              onPointerDown={(event) => startDrag(event, "resize")}
            />
          </div>
        ) : (
          <div className="grid h-full place-items-center text-xs font-bold text-info">
            <span>{initials(fallbackLabel)}</span>
            <small>No hay PNG disponible para esta vista</small>
          </div>
        )}
      </div>
      <div className="text-xs text-mute">
        <span>X: {activeArea.x.toFixed(2)}%</span>
        <span>Y: {activeArea.y.toFixed(2)}%</span>
        <span>W: {activeArea.w.toFixed(2)}%</span>
        <span>H: {activeArea.h.toFixed(2)}%</span>
        <span>{activeSrc ? "Arrastra para mover y usa el punto para escalar" : "Sin imagen en este lado"}</span>
      </div>
      <input type="hidden" name="front_print_x_pct" value={primaryVariantState.front.x} />
      <input type="hidden" name="front_print_y_pct" value={primaryVariantState.front.y} />
      <input type="hidden" name="front_print_w_pct" value={primaryVariantState.front.w} />
      <input type="hidden" name="front_print_h_pct" value={primaryVariantState.front.h} />
      <input type="hidden" name="back_print_x_pct" value={primaryVariantState.back.x} />
      <input type="hidden" name="back_print_y_pct" value={primaryVariantState.back.y} />
      <input type="hidden" name="back_print_w_pct" value={primaryVariantState.back.w} />
      <input type="hidden" name="back_print_h_pct" value={primaryVariantState.back.h} />
      <input type="hidden" name="all_variants_confirmed" value={allVariantsConfirmed ? "true" : "false"} />
      <input type="hidden" name="variant_print_map_json" value={variantPrintMapJson} />
    </div>
  );
}

export function CatalogDashboardClient({
  collections,
  drops,
  publications,
  designs,
  variants,
  collectionItemIdsByCollectionId,
  dropItemIdsByDropId,
  actions,
}: CatalogDashboardClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [modal, setModal] = useState<ModalId>(null);
  const [activeDesign, setActiveDesign] = useState<AdminDesign | null>(null);
  const [activePublication, setActivePublication] = useState<AdminPublication | null>(null);
  const [activeCollection, setActiveCollection] = useState<AdminCollection | null>(null);
  const [activeDrop, setActiveDrop] = useState<AdminDrop | null>(null);
  const [createDesignVariants, setCreateDesignVariants] = useState<CreateDesignVariantDraft[]>([]);
  const [selectedCreateDesignIdRaw, setSelectedCreateDesignId] = useState<string>("");
  const [selectedEditPublicationDesignIdRaw, setSelectedEditPublicationDesignId] = useState<string>("");
  const [createPublicationGarmentType, setCreatePublicationGarmentType] =
    useState<CreatePublicationGarmentType>(DEFAULT_CREATE_PUBLICATION_GARMENT_TYPE);
  const [createPublicationGarmentModel, setCreatePublicationGarmentModel] = useState<string>(
    DEFAULT_GARMENT_MODEL_BY_TYPE[DEFAULT_CREATE_PUBLICATION_GARMENT_TYPE]
  );
  const [createPrintPlannerReady, setCreatePrintPlannerReady] = useState(true);
  const [editPrintPlannerReady, setEditPrintPlannerReady] = useState(true);
  const [newVariantPanelOpen, setNewVariantPanelOpen] = useState(false);
  const [createDesignFrontSelected, setCreateDesignFrontSelected] = useState(false);
  const [createDesignBackSelected, setCreateDesignBackSelected] = useState(false);
  const [createDesignImageInvalid, setCreateDesignImageInvalid] = useState(false);
  const [modalErrorBag, setModalErrorBag] = useState<FormErrorBagState | null>(null);
  const [modalErrorContext, setModalErrorContext] = useState<ModalId>(null);

  const designById = useMemo(() => new Map(designs.map((design) => [design.id, design])), [designs]);
  const activeVariants = useMemo(() => variants.filter((variant) => variant.is_active), [variants]);
  const selectedCreateDesignId = useMemo(() => {
    if (designs.some((design) => design.id === selectedCreateDesignIdRaw)) {
      return selectedCreateDesignIdRaw;
    }
    return designs[0]?.id ?? "";
  }, [designs, selectedCreateDesignIdRaw]);
  const variantsByDesign = useMemo(() => {
    const grouped = new Map<string, AdminDesignVariant[]>();
    for (const variant of activeVariants) {
      const list = grouped.get(variant.design_id);
      if (list) {
        list.push(variant);
      } else {
        grouped.set(variant.design_id, [variant]);
      }
    }
    for (const list of grouped.values()) {
      list.sort(
        (left, right) =>
          left.sort_rank - right.sort_rank || left.label.localeCompare(right.label, "es-MX")
      );
    }
    return grouped;
  }, [activeVariants]);
  const allVariantsByDesign = useMemo(() => {
    const grouped = new Map<string, AdminDesignVariant[]>();
    for (const variant of variants) {
      const list = grouped.get(variant.design_id);
      if (list) {
        list.push(variant);
      } else {
        grouped.set(variant.design_id, [variant]);
      }
    }
    for (const list of grouped.values()) {
      list.sort(
        (left, right) =>
          left.sort_rank - right.sort_rank || left.label.localeCompare(right.label, "es-MX")
      );
    }
    return grouped;
  }, [variants]);
  const selectedCreateDesign = useMemo(
    () => (selectedCreateDesignId ? designById.get(selectedCreateDesignId) ?? null : null),
    [designById, selectedCreateDesignId]
  );
  const selectedEditPublicationDesignId = useMemo(() => {
    if (activePublication && designById.has(selectedEditPublicationDesignIdRaw)) {
      return selectedEditPublicationDesignIdRaw;
    }
    return activePublication?.design_id ?? "";
  }, [activePublication, designById, selectedEditPublicationDesignIdRaw]);
  const selectedEditPublicationDesign = useMemo(
    () =>
      selectedEditPublicationDesignId
        ? designById.get(selectedEditPublicationDesignId) ?? null
        : null,
    [designById, selectedEditPublicationDesignId]
  );
  const selectedCreatePlannerVariants = useMemo(
    () =>
      selectedCreateDesign
        ? toPlannerVariantPreviews(
            variantsByDesign.get(selectedCreateDesign.id) ?? [],
            selectedCreateDesign
          )
        : [],
    [selectedCreateDesign, variantsByDesign]
  );
  const selectedEditPlannerVariants = useMemo(
    () =>
      selectedEditPublicationDesign
        ? toPlannerVariantPreviews(
            variantsByDesign.get(selectedEditPublicationDesign.id) ?? [],
            selectedEditPublicationDesign
          )
        : [],
    [selectedEditPublicationDesign, variantsByDesign]
  );
  const activeCollectionItemIds = useMemo(() => {
    if (!activeCollection) return new Set<string>();
    return new Set(collectionItemIdsByCollectionId[activeCollection.id] ?? []);
  }, [activeCollection, collectionItemIdsByCollectionId]);
  const activeDropItemIds = useMemo(() => {
    if (!activeDrop) return new Set<string>();
    return new Set(dropItemIdsByDropId[activeDrop.id] ?? []);
  }, [activeDrop, dropItemIdsByDropId]);
  const activeDesignVariants = useMemo(
    () => (activeDesign ? allVariantsByDesign.get(activeDesign.id) ?? [] : []),
    [activeDesign, allVariantsByDesign]
  );
  const createPublicationGarmentModelOptions = useMemo(
    () => GARMENT_MODEL_OPTIONS_BY_TYPE[createPublicationGarmentType],
    [createPublicationGarmentType]
  );
  const createDesignHasAnyBaseImage = createDesignFrontSelected || createDesignBackSelected;

  const addCreateDesignVariant = () => {
    setCreateDesignVariants((previous) => [...previous, createDesignVariantDraft()]);
  };

  const removeCreateDesignVariant = (id: string) => {
    setCreateDesignVariants((previous) => previous.filter((variant) => variant.id !== id));
  };

  const updateCreateDesignVariantName = (id: string, name: string) => {
    setCreateDesignVariants((previous) =>
      previous.map((variant) => (variant.id === id ? { ...variant, name } : variant))
    );
  };

  const handleCreatePublicationGarmentTypeChange = (nextType: CreatePublicationGarmentType) => {
    setCreatePublicationGarmentType(nextType);
    const nextAllowedModels = GARMENT_MODEL_OPTIONS_BY_TYPE[nextType];
    setCreatePublicationGarmentModel((currentModel) =>
      nextAllowedModels.some((option) => option.value === currentModel)
        ? currentModel
        : DEFAULT_GARMENT_MODEL_BY_TYPE[nextType]
    );
  };

  useEffect(() => {
    if (!modal) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        setNewVariantPanelOpen(false);
        setCreateDesignVariants([]);
        setCreatePublicationGarmentType(DEFAULT_CREATE_PUBLICATION_GARMENT_TYPE);
        setCreatePublicationGarmentModel(
          DEFAULT_GARMENT_MODEL_BY_TYPE[DEFAULT_CREATE_PUBLICATION_GARMENT_TYPE]
        );
        setCreateDesignFrontSelected(false);
        setCreateDesignBackSelected(false);
        setCreateDesignImageInvalid(false);
        setModalErrorBag(null);
        setModalErrorContext(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]);

  const closeModal = () => {
    setModal(null);
    setNewVariantPanelOpen(false);
    setCreateDesignVariants([]);
    setCreatePublicationGarmentType(DEFAULT_CREATE_PUBLICATION_GARMENT_TYPE);
    setCreatePublicationGarmentModel(
      DEFAULT_GARMENT_MODEL_BY_TYPE[DEFAULT_CREATE_PUBLICATION_GARMENT_TYPE]
    );
    setCreateDesignFrontSelected(false);
    setCreateDesignBackSelected(false);
    setCreateDesignImageInvalid(false);
    setModalErrorBag(null);
    setModalErrorContext(null);
  };

  useEffect(() => {
    if (modal !== "create-design") return;
    if (createDesignHasAnyBaseImage) {
      toast.success("Listo: hay imagen base para el diseno.");
      return;
    }
    toast.info("Debes subir por lo menos una imagen para crear un diseno utilizable.");
  }, [createDesignHasAnyBaseImage, modal, toast]);

  type ActionToastOptions = {
    successMessage: string;
    fallbackError: string;
    closeOnSuccess?: boolean;
    refreshAfterSuccess?: boolean;
  };

  const pushModalError = (error: unknown, fallbackMessage: string) => {
    const bag = toFormErrorBag(error, fallbackMessage);
    setModalErrorBag(bag);
    setModalErrorContext(modal);
    toast.error(bag.rawMessage);
  };

  const executeCatalogAction = async (
    action: ServerAction,
    formData: FormData,
    options: ActionToastOptions
  ) => {
    setModalErrorBag(null);
    setModalErrorContext(null);
    try {
      await action(formData);
      setModalErrorBag(null);
      setModalErrorContext(null);
      toast.success(options.successMessage);
      if (options.closeOnSuccess) {
        closeModal();
      }
      if (options.refreshAfterSuccess ?? true) {
        router.refresh();
      }
    } catch (error) {
      pushModalError(error, options.fallbackError);
    }
  };

  const submitCatalogForm =
    (handler: (formData: FormData) => Promise<void>) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await handler(formData);
    };

  const handleCreateDesignAction = async (formData: FormData) => {
    const hasFront = isSelectedFile(formData.get("default_front_design_file"));
    const hasBack = isSelectedFile(formData.get("default_back_design_file"));
    setCreateDesignFrontSelected(hasFront);
    setCreateDesignBackSelected(hasBack);

    if (!hasFront && !hasBack) {
      setCreateDesignImageInvalid(true);
      pushModalError(
        new Error("Debes subir por lo menos una imagen base frontal o trasera."),
        "Debes subir por lo menos una imagen base frontal o trasera."
      );
      return;
    }

    setCreateDesignImageInvalid(false);
    const variantCountRaw = Number(String(formData.get("variant_count") ?? "0"));
    const variantCount = Number.isFinite(variantCountRaw) ? Math.max(0, Math.floor(variantCountRaw)) : 0;
    for (let index = 0; index < variantCount; index += 1) {
      const variantName = String(formData.get(`variant_name_${index}`) ?? "").trim();
      if (!variantName) continue;
      const variantFrontFile = formData.get(`variant_front_file_${index}`);
      const variantBackFile = formData.get(`variant_back_file_${index}`);
      const hasVariantFront = isSelectedFile(variantFrontFile);
      const hasVariantBack = isSelectedFile(variantBackFile);
      if (!hasVariantFront && !hasVariantBack) {
        pushModalError(
          new Error(`Variante ${index + 1}: sube frontal o trasera.`),
          `Variante ${index + 1}: sube frontal o trasera.`
        );
        return;
      }
      if (hasVariantFront && !isDtfCompatibleMimeType(variantFrontFile.type)) {
        pushModalError(
          new Error(`Variante ${index + 1}: formato frontal no compatible con DTF. Usa PNG, JPG o PDF.`),
          `Variante ${index + 1}: formato frontal no compatible con DTF. Usa PNG, JPG o PDF.`
        );
        return;
      }
      if (hasVariantBack && !isDtfCompatibleMimeType(variantBackFile.type)) {
        pushModalError(
          new Error(`Variante ${index + 1}: formato trasero no compatible con DTF. Usa PNG, JPG o PDF.`),
          `Variante ${index + 1}: formato trasero no compatible con DTF. Usa PNG, JPG o PDF.`
        );
        return;
      }
    }

    await executeCatalogAction(actions.createDesignAction, formData, {
      successMessage: "Diseno creado correctamente.",
      fallbackError: "No se pudo crear el diseno.",
      closeOnSuccess: true,
    });
  };

  const handleCreatePublicationAction = async (formData: FormData) => {
    await executeCatalogAction(actions.createPublicationAction, formData, {
      successMessage: "Publicacion creada.",
      fallbackError: "No se pudo crear la publicacion.",
      closeOnSuccess: true,
    });
  };

  const handleCreateCollectionAction = async (formData: FormData) => {
    await executeCatalogAction(actions.createCollectionAction, formData, {
      successMessage: "Coleccion creada.",
      fallbackError: "No se pudo crear la coleccion.",
      closeOnSuccess: true,
    });
  };

  const handleCreateDropAction = async (formData: FormData) => {
    await executeCatalogAction(actions.createDropAction, formData, {
      successMessage: "Drop creado.",
      fallbackError: "No se pudo crear el drop.",
      closeOnSuccess: true,
    });
  };

  const handleUpdateDesignAction = async (formData: FormData) => {
    await executeCatalogAction(actions.updateDesignAction, formData, {
      successMessage: "Diseno actualizado.",
      fallbackError: "No se pudo actualizar el diseno.",
    });
  };

  const handleCreateDesignVariantAction = async (formData: FormData) => {
    const frontFile = formData.get("front_design_file");
    const backFile = formData.get("back_design_file");
    const hasFront = isSelectedFile(frontFile);
    const hasBack = isSelectedFile(backFile);
    if (!hasFront && !hasBack) {
      pushModalError(
        new Error("Sube frontal o trasera para crear la variante."),
        "Sube frontal o trasera para crear la variante."
      );
      return;
    }
    if (hasFront && !isDtfCompatibleMimeType(frontFile.type)) {
      pushModalError(
        new Error("Formato frontal no compatible con DTF. Usa PNG, JPG o PDF."),
        "Formato frontal no compatible con DTF. Usa PNG, JPG o PDF."
      );
      return;
    }
    if (hasBack && !isDtfCompatibleMimeType(backFile.type)) {
      pushModalError(
        new Error("Formato trasero no compatible con DTF. Usa PNG, JPG o PDF."),
        "Formato trasero no compatible con DTF. Usa PNG, JPG o PDF."
      );
      return;
    }
    await executeCatalogAction(actions.createDesignVariantAction, formData, {
      successMessage: "Variante creada.",
      fallbackError: "No se pudo crear la variante.",
    });
  };

  const handleUpdateDesignVariantAction = async (formData: FormData) => {
    const frontFile = formData.get("front_design_file");
    const backFile = formData.get("back_design_file");
    if (isSelectedFile(frontFile) && !isDtfCompatibleMimeType(frontFile.type)) {
      pushModalError(
        new Error("Formato frontal no compatible con DTF. Usa PNG, JPG o PDF."),
        "Formato frontal no compatible con DTF. Usa PNG, JPG o PDF."
      );
      return;
    }
    if (isSelectedFile(backFile) && !isDtfCompatibleMimeType(backFile.type)) {
      pushModalError(
        new Error("Formato trasero no compatible con DTF. Usa PNG, JPG o PDF."),
        "Formato trasero no compatible con DTF. Usa PNG, JPG o PDF."
      );
      return;
    }
    await executeCatalogAction(actions.updateDesignVariantAction, formData, {
      successMessage: "Variante actualizada.",
      fallbackError: "No se pudo actualizar la variante.",
    });
  };

  const handleUpdatePublicationAction = async (formData: FormData) => {
    await executeCatalogAction(actions.updatePublicationAction, formData, {
      successMessage: "Publicacion actualizada.",
      fallbackError: "No se pudo actualizar la publicacion.",
    });
  };

  const handlePublishPublicationAction = async (formData: FormData) => {
    await executeCatalogAction(actions.publishPublicationAction, formData, {
      successMessage: "Publicacion publicada.",
      fallbackError: "No se pudo publicar la publicacion.",
      refreshAfterSuccess: true,
    });
  };

  const handleUnpublishPublicationAction = async (formData: FormData) => {
    await executeCatalogAction(actions.unpublishPublicationAction, formData, {
      successMessage: "Publicacion despublicada.",
      fallbackError: "No se pudo despublicar la publicacion.",
      refreshAfterSuccess: true,
    });
  };

  const handleUpdateCollectionAction = async (formData: FormData) => {
    await executeCatalogAction(actions.updateCollectionAction, formData, {
      successMessage: "Coleccion actualizada.",
      fallbackError: "No se pudo actualizar la coleccion.",
    });
  };

  const handleReplaceCollectionItemsAction = async (formData: FormData) => {
    await executeCatalogAction(actions.replaceCollectionItemsAction, formData, {
      successMessage: "Items de coleccion actualizados.",
      fallbackError: "No se pudieron actualizar los items de la coleccion.",
    });
  };

  const handleUpdateDropAction = async (formData: FormData) => {
    await executeCatalogAction(actions.updateDropAction, formData, {
      successMessage: "Drop actualizado.",
      fallbackError: "No se pudo actualizar el drop.",
    });
  };

  const handleReplaceDropItemsAction = async (formData: FormData) => {
    await executeCatalogAction(actions.replaceDropItemsAction, formData, {
      successMessage: "Items del drop actualizados.",
      fallbackError: "No se pudieron actualizar los items del drop.",
    });
  };

  const handleEndDropNowAction = async (formData: FormData) => {
    await executeCatalogAction(actions.endDropNowAction, formData, {
      successMessage: "Drop terminado.",
      fallbackError: "No se pudo terminar el drop.",
    });
  };

  const activeModalErrorBag = modalErrorContext && modalErrorContext === modal ? modalErrorBag : null;

  return (
    <main className="rounded-md border border-hairline bg-soft-cloud/90 mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-4 lg:px-5">
      <section className="rounded-md border border-hairline bg-soft-cloud/80 p-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-black uppercase tracking-[0.03em] text-ink sm:text-[26px]">
              Catalogo interno
            </h1>
            <p className="mt-1 text-[12px] text-[rgba(8,10,13,.68)]">
              Vista compacta para publicar y editar sin espacios muertos.
            </p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
            <StatCard label="Publicaciones" value={publications.length} />
            <StatCard label="Disenos" value={designs.length} />
            <StatCard label="Variantes" value={activeVariants.length} />
          </div>
        </div>
      </section>

      <nav className="flex flex-wrap items-center gap-2 mt-3" aria-label="Navegacion rapida del catalogo">
        <a href="#catalogo-disenos" className="rounded-full border border-hairline bg-soft-cloud px-3 py-1 text-xs font-black uppercase text-ink">
          Disenos
        </a>
        <a href="#catalogo-publicaciones" className="rounded-full border border-hairline bg-soft-cloud px-3 py-1 text-xs font-black uppercase text-ink">
          Publicaciones
        </a>
        <a href="#catalogo-colecciones" className="rounded-full border border-hairline bg-soft-cloud px-3 py-1 text-xs font-black uppercase text-ink">
          Colecciones
        </a>
        <a href="#catalogo-drops" className="rounded-full border border-hairline bg-soft-cloud px-3 py-1 text-xs font-black uppercase text-ink">
          Drops
        </a>
      </nav>

      <section className="mt-2 rounded-[16px] border border-hairline bg-[rgba(255,255,255,.58)] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[rgba(8,10,13,.72)]">
            Acciones rapidas
          </p>
          <p className="text-[10px] text-[rgba(8,10,13,.56)]">Todo abre en modal</p>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <ActionButton
            label="Nuevo diseno"
            onClick={() => {
              setCreateDesignVariants([]);
              setModal("create-design");
            }}
          />
          <ActionButton label="Nueva publicacion" onClick={() => setModal("create-publication")} primary />
          <ActionButton label="Nueva coleccion" onClick={() => setModal("create-collection")} />
          <ActionButton label="Nuevo drop" onClick={() => setModal("create-drop")} />
        </div>
      </section>

      <section id="catalogo-disenos" className="mt-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-black uppercase tracking-[0.12em] text-ink">
            Disenos ({designs.length})
          </h2>
          <p className="text-[11px] text-[rgba(8,10,13,.58)]">Click en card para editar variantes</p>
        </header>
        <div className="max-h-[42vh] overflow-auto pr-1">
          <div className="grid gap-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designs.map((design, index) => {
              const activeCount = variantsByDesign.get(design.id)?.length ?? 0;
              const totalCount = allVariantsByDesign.get(design.id)?.length ?? 0;
              return (
                <button
                  key={design.id}
                  type="button"
                  className="rounded-md border border-hairline bg-soft-cloud/80 p-4 p-3 text-left"
                  style={{ ["--card-delay" as string]: `${index * 22}ms` }}
                  onClick={() => {
                    setActiveDesign(design);
                    setModal("edit-design");
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-[13px] font-black uppercase tracking-[0.08em] text-ink">
                      {design.name}
                    </p>
                    <span className={design.has_variants ? "inline-flex items-center rounded-full border border-hairline bg-hairline-soft px-2.5 py-0.5 text-[10px] font-black uppercase text-ink border-success/30 bg-success/12 text-success" : "inline-flex items-center rounded-full border border-hairline bg-hairline-soft px-2.5 py-0.5 text-[10px] font-black uppercase text-ink"}>
                      {design.has_variants ? "Multi" : "Unico"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <DesignPreviewFlip
                      frontSrc={designImageBySide(design, "front")}
                      backSrc={designImageBySide(design, "back")}
                      fallbackLabel={design.name}
                      compact
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[rgba(8,10,13,.66)]">
                    Variantes activas: {activeCount} / {totalCount}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="catalogo-publicaciones" className="mt-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-black uppercase tracking-[0.12em] text-ink">
            Publicaciones ({publications.length})
          </h2>
          <p className="text-[11px] text-[rgba(8,10,13,.58)]">Click en card para editar</p>
        </header>
        <div className="max-h-[48vh] overflow-auto pr-1">
          <div className="grid gap-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {publications.map((publication, index) => {
              const publicationDesign = designById.get(publication.design_id);

              return (
                <button
                  key={publication.id}
                  type="button"
                  className="rounded-md border border-hairline bg-soft-cloud/80 p-4 p-3 text-left"
                  style={{ ["--card-delay" as string]: `${index * 22}ms` }}
                  onClick={() => {
                    setActivePublication(publication);
                    setSelectedEditPublicationDesignId(publication.design_id);
                    setModal("edit-publication");
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="line-clamp-2 text-[13px] font-black uppercase tracking-[0.08em] text-ink">
                      {publication.title}
                    </p>
                    <span
                      className={
                        publication.is_active
                          ? "inline-flex items-center rounded-full border border-hairline bg-hairline-soft px-2.5 py-0.5 text-[10px] font-black uppercase text-ink border-success/30 bg-success/12 text-success"
                          : "inline-flex items-center rounded-full border border-hairline bg-hairline-soft px-2.5 py-0.5 text-[10px] font-black uppercase text-ink border-hairline bg-soft-cloud text-mute"
                      }
                    >
                      {publication.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[11px] text-[rgba(8,10,13,.72)]">/{publication.slug}</p>
                  <div className="mt-2 grid grid-cols-[84px_1fr] items-start gap-2">
                    <DesignPreviewFlip
                      frontSrc={designImageBySide(publicationDesign, "front")}
                      backSrc={designImageBySide(publicationDesign, "back")}
                      fallbackLabel={publicationDesign?.name ?? publication.title}
                      compact
                      className="aspect-square"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[rgba(8,10,13,.68)]">
                        {titleCase(publication.category)} - {garmentTypeLabel(publication.garment_type)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[rgba(8,10,13,.68)]">
                        Diseno: {publicationDesign?.name ?? "No disponible"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black text-ink">${money(publication.price_mxn)} MXN</p>
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.54)]">
                      Editar
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 xl:grid-cols-2">
        <article id="catalogo-colecciones">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-black uppercase tracking-[0.12em] text-ink">
              Colecciones ({collections.length})
            </h2>
            <p className="text-[11px] text-[rgba(8,10,13,.58)]">Cards editables</p>
          </header>
          <div className="max-h-[30vh] overflow-auto pr-1">
            <div className="grid gap-4 grid gap-2">
              {collections.map((collection, index) => (
                <button
                  key={collection.id}
                  type="button"
                  className="rounded-md border border-hairline bg-soft-cloud/80 p-4 p-3 text-left"
                  style={{ ["--card-delay" as string]: `${index * 22}ms` }}
                  onClick={() => {
                    setActiveCollection(collection);
                    setModal("edit-collection");
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.08em] text-ink">
                      {collection.title}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-hairline bg-hairline-soft px-2.5 py-0.5 text-[10px] font-black uppercase text-ink">{titleCase(collection.visibility)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[rgba(8,10,13,.68)]">/{collection.slug}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-[rgba(8,10,13,.62)]">
                    {collection.description || "Sin descripcion"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </article>

        <article id="catalogo-drops">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-black uppercase tracking-[0.12em] text-ink">
              Drops ({drops.length})
            </h2>
            <p className="text-[11px] text-[rgba(8,10,13,.58)]">Cards editables</p>
          </header>
          <div className="max-h-[30vh] overflow-auto pr-1">
            <div className="grid gap-4 grid gap-2">
              {drops.map((drop, index) => (
                <button
                  key={drop.id}
                  type="button"
                  className="rounded-md border border-hairline bg-soft-cloud/80 p-4 p-3 text-left"
                  style={{ ["--card-delay" as string]: `${index * 22}ms` }}
                  onClick={() => {
                    setActiveDrop(drop);
                    setModal("edit-drop");
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.08em] text-ink">{drop.title}</p>
                    <span className="inline-flex items-center rounded-full border border-hairline bg-hairline-soft px-2.5 py-0.5 text-[10px] font-black uppercase text-ink">{titleCase(drop.status)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[rgba(8,10,13,.68)]">/{drop.slug}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-[rgba(8,10,13,.62)]">
                    {drop.description || "Sin descripcion"}
                  </p>
                  <p className="mt-1 text-[10px] text-[rgba(8,10,13,.62)]">Inicio: {formatDate(drop.starts_at)}</p>
                </button>
              ))}
            </div>
          </div>
        </article>
      </section>

      <DashboardModal
        title="Crear diseno"
        subtitle="Nuevo activo"
        open={modal === "create-design"}
        onClose={closeModal}
      >
        <form onSubmit={submitCatalogForm(handleCreateDesignAction)} className="grid gap-4 sm:grid-cols-2">
          <FormErrorBag bag={activeModalErrorBag} className="md:col-span-2" />
          <CatalogTextField
            name="name"
            label="Nombre del diseno"
            required
            placeholder="Ej. Ronaldo Legacy"
            wrapperClassName="md:col-span-2"
          />
          <input type="hidden" name="has_variants" value="true" />
          <input type="hidden" name="variant_count" value={String(createDesignVariants.length)} />
          <ImageUploadField
            name="default_front_design_file"
            label="Imagen frontal base"
            invalid={createDesignImageInvalid}
            onFileChange={(file) => {
              setCreateDesignFrontSelected(Boolean(file));
              if (file) {
                setCreateDesignImageInvalid(false);
              }
            }}
          />
          <ImageUploadField
            name="default_back_design_file"
            label="Imagen trasera base"
            invalid={createDesignImageInvalid}
            onFileChange={(file) => {
              setCreateDesignBackSelected(Boolean(file));
              if (file) {
                setCreateDesignImageInvalid(false);
              }
            }}
          />
          <section className="md:col-span-2 rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/78 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.76)]">
                  Variantes ({createDesignVariants.length})
                </p>
                <p className="text-[11px] text-[rgba(8,10,13,.6)]">
                  Agrega variantes con frontal y/o trasera. Minimo una imagen por variante.
                </p>
              </div>
              <button
                type="button"
                onClick={addCreateDesignVariant}
                className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed border-info/40 bg-info/12 text-charcoal"
              >
                Agregar variante
              </button>
            </div>

            {createDesignVariants.length === 0 ? (
              <p className="mt-3 text-[11px] text-[rgba(8,10,13,.62)]">
                Si no agregas variantes ahora, podras crearlas despues desde la card del diseno.
              </p>
            ) : (
              <div
                className={`mt-3 grid gap-3 ${
                  createDesignVariants.length >= 4 ? "space-y-2" : ""
                }`}
              >
                {createDesignVariants.map((variant, index) => (
                  <article
                    key={variant.id}
                    className="rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/84 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.72)]">
                        Variante {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeCreateDesignVariant(variant.id)}
                        className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed border-sale/40 bg-sale/12 text-sale-deep"
                      >
                        Quitar
                      </button>
                    </div>
                    <CatalogTextField
                      name={`variant_name_${index}`}
                      label="Nombre de la variante"
                      required
                      value={variant.name}
                      onChange={(event) => updateCreateDesignVariantName(variant.id, event.target.value)}
                      placeholder="Ej. Roja 200g"
                      wrapperClassName="mt-2"
                    />
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <ImageUploadField
                        name={`variant_front_file_${index}`}
                        label="Imagen frontal"
                        hint="Opcional. Puedes dejarla vacia si subes trasera."
                        optimizationMode="dtf"
                      />
                      <ImageUploadField
                        name={`variant_back_file_${index}`}
                        label="Imagen trasera"
                        hint="Opcional. Puedes dejarla vacia si subes frontal."
                        optimizationMode="dtf"
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 md:col-span-2">
            Guardar diseno
          </button>
        </form>
      </DashboardModal>

      <DashboardModal
        title="Crear publicacion"
        subtitle="Nuevo item"
        open={modal === "create-publication"}
        onClose={closeModal}
        wide
      >
        <form
          onSubmit={submitCatalogForm(handleCreatePublicationAction)}
          className="grid gap-6 lg:grid-cols-12"
        >
          <div className="lg:col-span-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 grid gap-2 sm:grid-cols-2">
              <FormErrorBag bag={activeModalErrorBag} className="md:col-span-2" />
              <CatalogTextField name="title" label="Titulo" required wrapperClassName="md:col-span-2" />
              <CatalogTextArea name="description" label="Descripcion" rows={2} required wrapperClassName="md:col-span-2" />
              {designs.length > 0 ? (
                <SelectDesignCards
                  designs={designs}
                  variantsByDesign={variantsByDesign}
                  selectedDesignId={selectedCreateDesignId}
                  onSelectDesign={setSelectedCreateDesignId}
                  compact
                />
              ) : (
                <p className="text-xs font-bold text-mute md:col-span-2">
                  No hay disenos creados aun. Crea al menos un diseno para publicar.
                </p>
              )}
              <CatalogTextField name="price_mxn" label="Precio MXN" type="number" min={1} required wrapperClassName="md:col-span-2" />
              <SelectField
                name="garment_type"
                label="Tipo"
                size="sm"
                required
                options={GARMENT_TYPE_OPTIONS}
                value={createPublicationGarmentType}
                onChange={(event) =>
                  handleCreatePublicationGarmentTypeChange(
                    event.target.value as CreatePublicationGarmentType
                  )
                }
                shellClassName="h-[32px] rounded-[9px] px-[9px]"
                selectClassName="text-[11px]"
                wrapperClassName="space-y-1.5"
              />
              <SelectField
                name="garment_model"
                label="Modelo"
                size="sm"
                required
                options={createPublicationGarmentModelOptions}
                value={createPublicationGarmentModel}
                onChange={(event) => setCreatePublicationGarmentModel(event.target.value)}
                shellClassName="h-[32px] rounded-[9px] px-[9px]"
                selectClassName="text-[11px]"
                wrapperClassName="space-y-1.5"
              />
              <SelectField
                name="category"
                label="Categoria"
                size="sm"
                required
                defaultValue={PUBLICATION_CATEGORY_OPTIONS[0]?.value}
                options={PUBLICATION_CATEGORY_OPTIONS}
                shellClassName="h-[32px] rounded-[9px] px-[9px]"
                selectClassName="text-[11px]"
                wrapperClassName="space-y-1.5"
              />
              <Checkbox
                name="is_active"
                value="true"
                defaultChecked={false}
                size="sm"
                label="Publicacion activa"
                wrapperClassName="md:col-span-2"
              />
              <ImageUploadField
                name="informative_image_file"
                label="Imagen informativa (opcional)"
                hint="Si no subes una imagen, se mantiene la default."
                className="md:col-span-2"
              />
              <button
                type="submit"
                disabled={designs.length === 0 || !createPrintPlannerReady}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 inline-flex min-h-11 items-center justify-center rounded-full border border-info bg-info px-6 text-xs font-black uppercase text-white shadow-sm transition hover:bg-info/90 md:col-span-2"
              >
                Crear publicacion
              </button>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <PrintAreaPlanner
              key={`create-publication-${selectedCreateDesignId}`}
              frontSrc={designImageBySide(selectedCreateDesign ?? undefined, "front")}
              backSrc={designImageBySide(selectedCreateDesign ?? undefined, "back")}
              fallbackLabel={selectedCreateDesign?.name ?? "Nueva publicacion"}
              variants={selectedCreatePlannerVariants}
              onVariantConfirmationChange={setCreatePrintPlannerReady}
            />
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        title="Crear coleccion"
        subtitle="Nuevo agrupador"
        open={modal === "create-collection"}
        onClose={closeModal}
      >
        <form onSubmit={submitCatalogForm(handleCreateCollectionAction)} className="grid gap-4 sm:grid-cols-2">
          <FormErrorBag bag={activeModalErrorBag} className="md:col-span-2" />
          <CatalogTextField name="title" label="Titulo" required />
          <CatalogTextArea name="description" label="Descripcion" rows={2} wrapperClassName="md:col-span-2" />
          <SelectField
            name="visibility"
            label="Visibilidad"
            size="sm"
            defaultValue="visible"
            options={[{ value: "visible", label: "Visible" }, { value: "hidden", label: "Hidden" }]}
            wrapperClassName="md:col-span-2"

            selectClassName="text-[11px]"
          />
          <section className="md:col-span-2 rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/78 p-3">
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.72)]">
              Items de la coleccion
            </p>
            <p className="mt-1 text-[11px] text-[rgba(8,10,13,.6)]">
              Selecciona aqui las publicaciones que van a pertenecer a la coleccion.
            </p>
            <div className="mt-3 max-h-60 space-y-2 overflow-auto rounded-[12px] border border-hairline bg-white/70 p-3">
              {publications.map((publication) => {
                const publicationDesign = designById.get(publication.design_id);
                return (
                  <label
                    key={`create-collection-${publication.id}`}
                    className="flex items-start gap-3 rounded-md border border-hairline bg-soft-cloud p-3 cursor-pointer hover:border-info border-info/40 bg-info/5"
                  >
                    <CheckboxControl name="publication_ids" value={publication.id} size="sm" />
                    <span className="min-w-0 flex-1">
                      <DesignPreviewFlip
                        frontSrc={designImageBySide(publicationDesign, "front")}
                        backSrc={designImageBySide(publicationDesign, "back")}
                        fallbackLabel={publicationDesign?.name ?? publication.title}
                        compact
                        className="cursor-pointer hover:border-info"
                      />
                      <span className="text-xs text-ink">
                        <span className="text-xs font-black text-ink">{publication.title}</span>
                        <small className="text-[11px] text-mute">/{publication.slug}</small>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 md:col-span-2">
            Guardar coleccion
          </button>
        </form>
      </DashboardModal>

      <DashboardModal
        title="Crear drop"
        subtitle="Nuevo calendario"
        open={modal === "create-drop"}
        onClose={closeModal}
      >
        <form onSubmit={submitCatalogForm(handleCreateDropAction)} className="grid gap-4 sm:grid-cols-2">
          <FormErrorBag bag={activeModalErrorBag} className="md:col-span-2" />
          <CatalogTextField name="title" label="Titulo" required />
          <CatalogTextArea name="description" label="Descripcion" rows={2} wrapperClassName="md:col-span-2" />
          <SelectField name="status" label="Status" size="sm" defaultValue="preview" options={[{ value: "preview", label: "Preview" }, { value: "active", label: "Active" }, { value: "ended", label: "Ended" }]}  selectClassName="text-[11px]" />
          <SelectField name="visibility" label="Visibilidad" size="sm" defaultValue="visible" options={[{ value: "visible", label: "Visible" }, { value: "hidden", label: "Hidden" }]}  selectClassName="text-[11px]" />
          <CatalogTextField name="starts_at" label="Inicio" type="datetime-local" />
          <CatalogTextField name="ends_at" label="Fin" type="datetime-local" />
          <CatalogTextField name="capacity_total" label="Cupo total (opcional)" type="number" min={1} />
          <section className="md:col-span-2 rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/78 p-3">
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.72)]">
              Items del drop
            </p>
            <p className="mt-1 text-[11px] text-[rgba(8,10,13,.6)]">
              Selecciona aqui las publicaciones que van en este drop.
            </p>
            <div className="mt-3 max-h-60 space-y-2 overflow-auto rounded-[12px] border border-hairline bg-white/70 p-3">
              {publications.map((publication) => {
                const publicationDesign = designById.get(publication.design_id);
                return (
                  <label
                    key={`create-drop-${publication.id}`}
                    className="flex items-start gap-3 rounded-md border border-hairline bg-soft-cloud p-3 cursor-pointer hover:border-info border-info/40 bg-info/5"
                  >
                    <CheckboxControl name="publication_ids" value={publication.id} size="sm" />
                    <span className="min-w-0 flex-1">
                      <DesignPreviewFlip
                        frontSrc={designImageBySide(publicationDesign, "front")}
                        backSrc={designImageBySide(publicationDesign, "back")}
                        fallbackLabel={publicationDesign?.name ?? publication.title}
                        compact
                        className="cursor-pointer hover:border-info"
                      />
                      <span className="text-xs text-ink">
                        <span className="text-xs font-black text-ink">{publication.title}</span>
                        <small className="text-[11px] text-mute">/{publication.slug}</small>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 inline-flex min-h-11 items-center justify-center rounded-full border border-info bg-info px-6 text-xs font-black uppercase text-white shadow-sm transition hover:bg-info/90 md:col-span-2">
            Guardar drop
          </button>
        </form>
      </DashboardModal>

      <DashboardModal
        title={activeDesign ? activeDesign.name : "Editar diseno"}
        subtitle="Gestion de variantes e imagenes"
        open={modal === "edit-design" && !!activeDesign}
        onClose={closeModal}
        wide
      >
        {activeDesign ? (
          <>
            <form onSubmit={submitCatalogForm(handleUpdateDesignAction)} className="grid gap-4 sm:grid-cols-2">
              <FormErrorBag bag={activeModalErrorBag} className="md:col-span-2" />
              <input type="hidden" name="design_id" value={activeDesign.id} />
              <input type="hidden" name="has_variants" value={(() => {
                const activeCount = activeDesignVariants.filter((variant) => variant.is_active).length;
                if (activeCount === 1) return "false";
                return "true";
              })()} />
              <CatalogTextField name="name" label="Nombre" defaultValue={activeDesign.name} wrapperClassName="md:col-span-2" />
              <div className="md:col-span-2">
                <DesignPreviewFlip
                  frontSrc={designImageBySide(activeDesign, "front")}
                  backSrc={designImageBySide(activeDesign, "back")}
                  fallbackLabel={activeDesign.name}
                  compact
                  className="aspect-square"
                />
              </div>
              <ImageUploadField
                name="default_front_design_file"
                label="Reemplazar imagen frontal"
                initialPreviewSrc={designImageBySide(activeDesign, "front")}
              />
              <ImageUploadField
                name="default_back_design_file"
                label="Reemplazar imagen trasera"
                initialPreviewSrc={designImageBySide(activeDesign, "back")}
              />
              <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 inline-flex min-h-11 items-center justify-center rounded-full border border-info bg-info px-6 text-xs font-black uppercase text-white shadow-sm transition hover:bg-info/90 md:col-span-2">
                Guardar diseno
              </button>
            </form>

            <section className="mt-5">
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.68)]">
                Variantes actuales ({activeDesignVariants.length})
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {activeDesignVariants.map((variant) => (
                  <form
                    key={variant.id}
                    onSubmit={submitCatalogForm(handleUpdateDesignVariantAction)}
                    className="rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/80 p-3"
                  >
                    <input type="hidden" name="variant_id" value={variant.id} />
                    <input type="hidden" name="current_code" value={variant.code} />
                    <input type="hidden" name="current_label" value={variant.label} />
                    <div className="mb-2">
                      <DesignPreviewFlip
                        frontSrc={variantImageBySide(variant, activeDesign, "front")}
                        backSrc={variantImageBySide(variant, activeDesign, "back")}
                        fallbackLabel={`${activeDesign.name} ${variantDisplayName(variant)}`}
                        compact
                      />
                    </div>
                    <div className="grid gap-2">
                      <CatalogTextField name="name" label="Nombre" defaultValue={variantDisplayName(variant)} />
                      <div className="flex items-center gap-2">
                        {variant.front_design_url ? (
                          <a
                            href={variant.front_design_url}
                            download={`${activeDesign.name}-${variantDisplayName(variant)}-frontal.png`}
                            className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Descargar frontal PNG
                          </a>
                        ) : (
                          <span className="text-xs text-mute">Sin frontal disponible</span>
                        )}
                        {variant.back_design_url ? (
                          <a
                            href={variant.back_design_url}
                            download={`${activeDesign.name}-${variantDisplayName(variant)}-trasera.png`}
                            className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Descargar trasera PNG
                          </a>
                        ) : (
                          <span className="text-xs text-mute">Sin trasera disponible</span>
                        )}
                      </div>
                      <ImageUploadField
                        name="front_design_file"
                        label="Nueva frontal (archivo)"
                        initialPreviewSrc={variantImageBySide(variant, activeDesign, "front")}
                        optimizationMode="dtf"
                      />
                      <ImageUploadField
                        name="back_design_file"
                        label="Nueva trasera (archivo)"
                        initialPreviewSrc={variantImageBySide(variant, activeDesign, "back")}
                        optimizationMode="dtf"
                      />
                      <Checkbox name="is_active" value="true" defaultChecked={variant.is_active} size="sm" label="Activa (desmarca para quitarla)" />
                      <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90">
                        Guardar variante
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-[14px] border border-[rgba(8,10,13,.14)] bg-white/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.68)]">
                  Nueva variante
                </p>
                <button
                  type="button"
                  onClick={() => setNewVariantPanelOpen((previous) => !previous)}
                  className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {newVariantPanelOpen ? "Cerrar" : "Agregar variante"}
                </button>
              </div>
              {newVariantPanelOpen ? (
                <form
                  onSubmit={submitCatalogForm(handleCreateDesignVariantAction)}
                  className="mt-3 grid gap-2"
                >
                  <input type="hidden" name="design_id" value={activeDesign.id} />
                  <CatalogTextField name="name" label="Nombre" required />
                  <div className="grid gap-2 md:grid-cols-2">
                    <ImageUploadField
                      name="front_design_file"
                      label="Frontal"
                      hint="Opcional. Puedes dejarla vacia si subes trasera."
                      optimizationMode="dtf"
                    />
                    <ImageUploadField
                      name="back_design_file"
                      label="Trasera"
                      hint="Opcional. Puedes dejarla vacia si subes frontal."
                      optimizationMode="dtf"
                    />
                  </div>
                  <Checkbox name="is_active" value="true" defaultChecked size="sm" label="Activa" />
                  <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90">
                    Crear variante
                  </button>
                </form>
              ) : null}
            </section>
          </>
        ) : null}
      </DashboardModal>

      <DashboardModal
        title={activePublication ? activePublication.title : "Editar publicacion"}
        subtitle={activePublication ? `/${activePublication.slug}` : undefined}
        open={modal === "edit-publication" && !!activePublication}
        onClose={closeModal}
      >
        {activePublication ? (
          <>
            <form onSubmit={submitCatalogForm(handleUpdatePublicationAction)} className="grid gap-4 sm:grid-cols-2">
              <FormErrorBag bag={activeModalErrorBag} className="md:col-span-2" />
              <input type="hidden" name="publication_id" value={activePublication.id} />
              <CatalogTextField name="title" label="Titulo" defaultValue={activePublication.title} wrapperClassName="md:col-span-2" />
              <CatalogTextField name="price_mxn" label="Precio MXN" type="number" min={0} defaultValue={activePublication.price_mxn} />
              <CatalogTextArea name="description" label="Descripcion" rows={2} defaultValue={activePublication.description ?? ""} wrapperClassName="md:col-span-2" />
              <SelectField
                name="category"
                label="Categoria"
                size="sm"
                defaultValue={activePublication.category}
                options={[
                  ...(PUBLICATION_CATEGORY_OPTIONS.some((option) => option.value === activePublication.category)
                    ? []
                    : [{ value: activePublication.category, label: titleCase(activePublication.category) }]),
                  ...PUBLICATION_CATEGORY_OPTIONS,
                ]}
                wrapperClassName="md:col-span-2"

                selectClassName="text-[11px]"
              />
              {designs.length > 0 ? (
                <SelectDesignCards
                  designs={designs}
                  variantsByDesign={variantsByDesign}
                  selectedDesignId={selectedEditPublicationDesignId}
                  onSelectDesign={setSelectedEditPublicationDesignId}
                  compact
                />
              ) : null}
              <PrintAreaPlanner
                key={`edit-publication-${activePublication.id}-${selectedEditPublicationDesignId}`}
                frontSrc={designImageBySide(selectedEditPublicationDesign ?? undefined, "front")}
                backSrc={designImageBySide(selectedEditPublicationDesign ?? undefined, "back")}
                fallbackLabel={selectedEditPublicationDesign?.name ?? activePublication.title}
                variants={selectedEditPlannerVariants}
                initialFront={{
                  x: activePublication.front_print_x_pct,
                  y: activePublication.front_print_y_pct,
                  w: activePublication.front_print_w_pct,
                  h: activePublication.front_print_h_pct,
                }}
                initialBack={{
                  x: activePublication.back_print_x_pct,
                  y: activePublication.back_print_y_pct,
                  w: activePublication.back_print_w_pct,
                  h: activePublication.back_print_h_pct,
                }}
                onVariantConfirmationChange={setEditPrintPlannerReady}
              />
              <SelectField name="visibility" label="Visibilidad" size="sm" defaultValue={activePublication.visibility} options={[{ value: "visible", label: "Visible" }, { value: "hidden", label: "Hidden" }]}  selectClassName="text-[11px]" />
              <input
                type="hidden"
                name="informative_image_id"
                value={activePublication.informative_image_id ?? ""}
              />
              <ImageUploadField
                name="informative_image_file"
                label="Imagen informativa (opcional)"
                initialPreviewSrc={activePublication.informative_image_url}
                hint="Si no subes nada, se conserva la imagen actual o la default."
              />
              <Checkbox name="is_active" value="true" defaultChecked={activePublication.is_active} size="sm" label="Activa" />
              <button type="submit" disabled={!editPrintPlannerReady} className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 md:col-span-2">
                Guardar cambios
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <form onSubmit={submitCatalogForm(handlePublishPublicationAction)}>
                <input type="hidden" name="publication_id" value={activePublication.id} />
                <button type="submit" className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed">Publish</button>
              </form>
              <form onSubmit={submitCatalogForm(handleUnpublishPublicationAction)}>
                <input type="hidden" name="publication_id" value={activePublication.id} />
                <button type="submit" className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed border-sale/40 bg-sale/12 text-sale-deep">
                  Unpublish
                </button>
              </form>
              <Link
                href={`/producto/${activePublication.slug}`}
                target="_blank"
                className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                Ver cliente
              </Link>
            </div>
          </>
        ) : null}
      </DashboardModal>

      <DashboardModal
        title={activeCollection ? activeCollection.title : "Editar coleccion"}
        subtitle="Configurar metadata e items"
        open={modal === "edit-collection" && !!activeCollection}
        onClose={closeModal}
        wide
      >
        {activeCollection ? (
          <>
            <form onSubmit={submitCatalogForm(handleUpdateCollectionAction)} className="grid gap-4 sm:grid-cols-2">
              <FormErrorBag bag={activeModalErrorBag} className="md:col-span-2" />
              <input type="hidden" name="collection_id" value={activeCollection.id} />
              <CatalogTextField name="title" label="Titulo" defaultValue={activeCollection.title} wrapperClassName="md:col-span-2" />
              <CatalogTextArea name="description" label="Descripcion" rows={2} defaultValue={activeCollection.description ?? ""} wrapperClassName="md:col-span-2" />
              <SelectField name="visibility" label="Visibilidad" size="sm" defaultValue={activeCollection.visibility} options={[{ value: "visible", label: "Visible" }, { value: "hidden", label: "Hidden" }]} wrapperClassName="md:col-span-2"  selectClassName="text-[11px]" />
              <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 md:col-span-2">
                Guardar coleccion
              </button>
            </form>

            <form
              key={`collection-items-${activeCollection.id}`}
              onSubmit={submitCatalogForm(handleReplaceCollectionItemsAction)}
              className="mt-4"
            >
              <input type="hidden" name="collection_id" value={activeCollection.id} />
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.68)]">
                Publicaciones de la coleccion
              </p>
              <div className="mt-3 max-h-60 space-y-2 overflow-auto rounded-[14px] border border-hairline bg-white/70 p-3">
                {publications.map((publication) => {
                  const publicationDesign = designById.get(publication.design_id);
                  return (
                    <label
                      key={`collection-${activeCollection.id}-${publication.id}`}
                      className="flex items-start gap-3 rounded-md border border-hairline bg-soft-cloud p-3 cursor-pointer hover:border-info border-info/40 bg-info/5"
                    >
                      <CheckboxControl
                        name="publication_ids"
                        value={publication.id}
                        defaultChecked={activeCollectionItemIds.has(publication.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <DesignPreviewFlip
                          frontSrc={designImageBySide(publicationDesign, "front")}
                          backSrc={designImageBySide(publicationDesign, "back")}
                          fallbackLabel={publicationDesign?.name ?? publication.title}
                          compact
                          className="cursor-pointer hover:border-info"
                        />
                        <span className="text-xs text-ink">
                          <span className="text-xs font-black text-ink">{publication.title}</span>
                          <small className="text-[11px] text-mute">/{publication.slug}</small>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 mt-3 w-full">
                Reemplazar items
              </button>
            </form>

            <div className="mt-4">
              <Link
                href={`/colecciones/${activeCollection.slug}`}
                target="_blank"
                className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                Ver coleccion cliente
              </Link>
            </div>
          </>
        ) : null}
      </DashboardModal>

      <DashboardModal
        title={activeDrop ? activeDrop.title : "Editar drop"}
        subtitle="Configurar status y items"
        open={modal === "edit-drop" && !!activeDrop}
        onClose={closeModal}
        wide
      >
        {activeDrop ? (
          <>
            <form onSubmit={submitCatalogForm(handleUpdateDropAction)} className="grid gap-4 sm:grid-cols-2">
              <FormErrorBag bag={activeModalErrorBag} className="md:col-span-2" />
              <input type="hidden" name="drop_id" value={activeDrop.id} />
              <CatalogTextField name="title" label="Titulo" defaultValue={activeDrop.title} wrapperClassName="md:col-span-2" />
              <SelectField name="status" label="Status" size="sm" defaultValue={activeDrop.status} options={[{ value: "preview", label: "Preview" }, { value: "active", label: "Active" }, { value: "ended", label: "Ended" }]}  selectClassName="text-[11px]" />
              <SelectField name="visibility" label="Visibilidad" size="sm" defaultValue={activeDrop.visibility} options={[{ value: "visible", label: "Visible" }, { value: "hidden", label: "Hidden" }]}  selectClassName="text-[11px]" />
              <CatalogTextField name="starts_at" label="Inicio" type="datetime-local" defaultValue={toDateTimeLocalValue(activeDrop.starts_at)} />
              <CatalogTextField name="ends_at" label="Fin" type="datetime-local" defaultValue={toDateTimeLocalValue(activeDrop.ends_at)} />
              <CatalogTextField name="capacity_total" label="Cupo total" type="number" min={1} defaultValue={activeDrop.capacity_total ?? ""} />
              <CatalogTextArea name="description" label="Descripcion" rows={2} defaultValue={activeDrop.description ?? ""} wrapperClassName="md:col-span-2" />
              <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 inline-flex min-h-11 items-center justify-center rounded-full border border-info bg-info px-6 text-xs font-black uppercase text-white shadow-sm transition hover:bg-info/90 md:col-span-2">
                Guardar drop
              </button>
            </form>

            <form
              key={`drop-items-${activeDrop.id}`}
              onSubmit={submitCatalogForm(handleReplaceDropItemsAction)}
              className="mt-4"
            >
              <input type="hidden" name="drop_id" value={activeDrop.id} />
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.68)]">
                Publicaciones del drop
              </p>
              <div className="mt-3 max-h-60 space-y-2 overflow-auto rounded-[14px] border border-hairline bg-white/70 p-3">
                {publications.map((publication) => {
                  const publicationDesign = designById.get(publication.design_id);
                  return (
                    <label
                      key={`drop-${activeDrop.id}-${publication.id}`}
                      className="flex items-start gap-3 rounded-md border border-hairline bg-soft-cloud p-3 cursor-pointer hover:border-info border-info/40 bg-info/5"
                    >
                      <CheckboxControl
                        name="publication_ids"
                        value={publication.id}
                        defaultChecked={activeDropItemIds.has(publication.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <DesignPreviewFlip
                          frontSrc={designImageBySide(publicationDesign, "front")}
                          backSrc={designImageBySide(publicationDesign, "back")}
                          fallbackLabel={publicationDesign?.name ?? publication.title}
                          compact
                          className="cursor-pointer hover:border-info"
                        />
                        <span className="text-xs text-ink">
                          <span className="text-xs font-black text-ink">{publication.title}</span>
                          <small className="text-[11px] text-mute">/{publication.slug}</small>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-6 text-xs font-black uppercase text-ink shadow-sm transition hover:bg-primary/90 mt-3 w-full">
                Reemplazar items
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <form onSubmit={submitCatalogForm(handleEndDropNowAction)}>
                <input type="hidden" name="drop_id" value={activeDrop.id} />
                <button type="submit" className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed border-sale/40 bg-sale/12 text-sale-deep">
                  Terminar ahora
                </button>
              </form>
              <Link
                href={`/drops/${activeDrop.slug}`}
                target="_blank"
                className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                Ver drop cliente
              </Link>
            </div>
          </>
        ) : null}
      </DashboardModal>
    </main>
  );
}
