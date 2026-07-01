"use client";
/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import {
  startTransition,
  type FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button, SelectField, TextField } from "@/core/design-system";
import { FormErrorBag } from "@/core/design-system/feedback/FormErrorBag";
import {
  toFormErrorBag,
  type FormErrorBag as FormErrorBagState,
} from "@/core/design-system/feedback/form-errors";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import {
  type GlobalStockPreset,
  GLOBAL_STOCK_PRESETS,
  resolveGlobalStockPreset,
} from "@/modules/dashboard/inventory/constants/global-stock";
import type {
  InventoryItem,
  InventoryMovement,
} from "@/modules/dashboard/inventory/server/api";

type ServerAction = (formData: FormData) => Promise<void>;

type InventoryActions = {
  createInventoryEntryAction: ServerAction;
  adjustInventoryQuantityAction: ServerAction;
};

type InventoryDashboardClientProps = {
  items: InventoryItem[];
  totalItems: number;
  movements: InventoryMovement[];
  totalMovements: number;
  actions: InventoryActions;
};

type ModalId = null | "create-entry" | "all-movements";
type WarningTab = "out" | "low";
type DrawerTab = "overview" | "history";
type InventoryStatus = "ok" | "low" | "out";
type SortMode = "critical" | "low" | "recent" | "stock" | "az";

type InventoryRow = {
  item: InventoryItem;
  preset: GlobalStockPreset | null;
  productName: string;
  typeLabel: string;
  fitLabel: string;
  sizeLabel: string;
  status: InventoryStatus;
  movements: InventoryMovement[];
  lastMovement: InventoryMovement | null;
  searchText: string;
};

type SizeCell = {
  size: string;
  quantity: number;
  row: InventoryRow | null;
};

type InventorySummary = {
  key: string;
  preset: GlobalStockPreset;
  productName: string;
  typeLabel: string;
  fitLabel: string;
  colorLabel: string;
  grammageLabel: string;
  totalQuantity: number;
  status: InventoryStatus;
  activeRowCount: number;
  sizeCells: SizeCell[];
  lastMovement: InventoryMovement | null;
  primaryRow: InventoryRow | null;
  searchText: string;
};

type CreateEntryDraft = {
  key: string;
  presetId: string;
  size: string;
  quantity: string;
};

type ExecuteActionOptions = {
  successMessage: string;
  fallbackError: string;
  pendingKey?: string;
  setErrorBag?: (bag: FormErrorBagState | null) => void;
  onSuccess?: () => void;
};

type ModalShellProps = {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  panelClassName?: string;
  children: React.ReactNode;
};

type KpiCardProps = {
  label: string;
  value: string | number;
  note: string;
  tone?: "default" | "danger" | "amber" | "blue";
};

type StatusBadgeProps = {
  status: InventoryStatus;
  compact?: boolean;
};

const PRESET_CATEGORY_ORDER: GlobalStockPreset["category"][] = [
  "Oversize",
  "Manga Larga Oversize",
  "Hoodie",
  "Regular",
];

const WARNING_RED_MAX = 0;
const WARNING_AMBER_MAX = 8;

const STOCK_SIZE_OPTIONS = [
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "2xl", label: "2XL" },
];

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "critical", label: "0 stock primero" },
  { value: "low", label: "Bajo stock" },
  { value: "recent", label: "Ultimo movimiento" },
  { value: "stock", label: "Mayor stock" },
  { value: "az", label: "Producto A-Z" },
];

const SIZE_ORDER_INDEX = new Map(
  STOCK_SIZE_OPTIONS.map((option, index) => [option.label.toUpperCase(), index])
);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatToken(value?: string | null): string {
  const normalized = (value ?? "").replace(/[_-]+/g, " ").trim();
  if (!normalized) return "";

  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function movementTypeLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "entry") return "Alta";
  if (normalized === "purchase") return "Compra";
  if (normalized === "merma") return "Merma";
  if (normalized === "adjustment") return "Ajuste";
  return formatToken(normalized) || "Movimiento";
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string): string {
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function movementTimestamp(movement: InventoryMovement | null): number {
  return movement ? new Date(movement.created_at).getTime() : 0;
}

function getStatus(quantity: number): InventoryStatus {
  if (quantity <= WARNING_RED_MAX) return "out";
  if (quantity <= WARNING_AMBER_MAX) return "low";
  return "ok";
}

function statusMeta(status: InventoryStatus) {
  if (status === "out") {
    return {
      label: "0 stock",
      shortLabel: "0 stock",
      className:
        "border-[rgba(165,34,53,.24)] bg-[rgba(165,34,53,.10)] text-[rgb(125,24,38)]",
      dotClassName: "bg-[rgb(165,34,53)]",
      panelClassName:
        "border-[rgba(165,34,53,.16)] bg-[linear-gradient(180deg,rgba(255,245,247,.98),rgba(255,255,255,.98))]",
    };
  }

  if (status === "low") {
    return {
      label: "Bajo stock",
      shortLabel: "Bajo",
      className:
        "border-[rgba(189,132,16,.24)] bg-[rgba(189,132,16,.12)] text-[rgb(133,96,13)]",
      dotClassName: "bg-[rgb(189,132,16)]",
      panelClassName:
        "border-[rgba(189,132,16,.18)] bg-[linear-gradient(180deg,rgba(255,250,239,.98),rgba(255,255,255,.98))]",
    };
  }

  return {
    label: "OK",
    shortLabel: "OK",
    className:
      "border-[rgba(32,136,80,.22)] bg-[rgba(32,136,80,.11)] text-[rgb(28,105,64)]",
    dotClassName: "bg-[rgb(32,136,80)]",
    panelClassName:
      "border-[rgba(32,136,80,.16)] bg-[linear-gradient(180deg,rgba(244,252,247,.98),rgba(255,255,255,.98))]",
  };
}

function compareSize(left: string, right: string): number {
  const leftRank = SIZE_ORDER_INDEX.get(left.toUpperCase()) ?? Number.POSITIVE_INFINITY;
  const rightRank = SIZE_ORDER_INDEX.get(right.toUpperCase()) ?? Number.POSITIVE_INFINITY;
  if (leftRank !== rightRank) return leftRank - rightRank;
  return left.localeCompare(right, "es-MX");
}

function createDraft(presetId: string, size = "m"): CreateEntryDraft {
  return {
    key: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    presetId,
    size,
    quantity: "1",
  };
}

function typeSortRank(typeLabel: string): number {
  const exactIndex = PRESET_CATEGORY_ORDER.indexOf(typeLabel as GlobalStockPreset["category"]);
  return exactIndex === -1 ? Number.POSITIVE_INFINITY : exactIndex;
}

function productNameFrom(item: InventoryItem, preset: GlobalStockPreset | null): string {
  if (preset) return preset.product;

  const typeLabel = formatToken(item.garment_type);
  const modelLabel = formatToken(item.garment_model);
  return [typeLabel, modelLabel].filter(Boolean).join(" ");
}

function typeLabelFrom(item: InventoryItem, preset: GlobalStockPreset | null): string {
  if (preset) return preset.category;

  const typeLabel = formatToken(item.garment_type);
  const modelLabel = formatToken(item.garment_model);
  return [typeLabel, modelLabel].filter(Boolean).join(" / ") || "Sin clasificar";
}

function fitLabelFrom(item: InventoryItem, preset: GlobalStockPreset | null): string {
  if (preset) return formatToken(preset.fit);
  return formatToken(item.fit) || "Sin fit";
}

function itemLabel(item: InventoryItem, preset: GlobalStockPreset | null): string {
  return [
    productNameFrom(item, preset),
    item.color,
    item.size.toUpperCase(),
    `${item.grammage_g}g`,
    fitLabelFrom(item, preset),
  ]
    .filter(Boolean)
    .join(" / ");
}

function signedQuantity(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function summarizeVisibleSizes(sizeCells: SizeCell[]): string {
  return sizeCells.map((cell) => `${cell.size}(${cell.quantity})`).join(" / ");
}

function compareSummaries(left: InventorySummary, right: InventorySummary, sortBy: SortMode): number {
  const criticalRank = { out: 0, low: 1, ok: 2 };
  const lowRank = { low: 0, out: 1, ok: 2 };

  if (sortBy === "critical") {
    const byStatus = criticalRank[left.status] - criticalRank[right.status];
    if (byStatus !== 0) return byStatus;
    if (left.totalQuantity !== right.totalQuantity) return left.totalQuantity - right.totalQuantity;
    const byMovement = movementTimestamp(right.lastMovement) - movementTimestamp(left.lastMovement);
    if (byMovement !== 0) return byMovement;
  }

  if (sortBy === "low") {
    const byStatus = lowRank[left.status] - lowRank[right.status];
    if (byStatus !== 0) return byStatus;
    if (left.totalQuantity !== right.totalQuantity) return left.totalQuantity - right.totalQuantity;
  }

  if (sortBy === "recent") {
    const byMovement = movementTimestamp(right.lastMovement) - movementTimestamp(left.lastMovement);
    if (byMovement !== 0) return byMovement;
  }

  if (sortBy === "stock" && left.totalQuantity !== right.totalQuantity) {
    return right.totalQuantity - left.totalQuantity;
  }

  const byType = typeSortRank(left.typeLabel) - typeSortRank(right.typeLabel);
  if (byType !== 0) return byType;

  const byProduct = left.productName.localeCompare(right.productName, "es-MX");
  if (byProduct !== 0) return byProduct;

  return left.preset.grammageG - right.preset.grammageG;
}

function sizeOptionsFor(value?: string): Array<{ value: string; label: string }> {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return STOCK_SIZE_OPTIONS;

  const exists = STOCK_SIZE_OPTIONS.some((option) => option.value === normalized);
  if (exists) return STOCK_SIZE_OPTIONS;

  return [...STOCK_SIZE_OPTIONS, { value: normalized, label: normalized.toUpperCase() }];
}

function ModalShell({
  title,
  subtitle,
  open,
  onClose,
  panelClassName,
  children,
}: ModalShellProps) {
  if (!open) return null;

  return (
    <div className="dashboard-modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="dashboard-modal-backdrop"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
      <article className={["dashboard-modal-panel", panelClassName ?? ""].filter(Boolean).join(" ")}>
        <header className="dashboard-modal-header">
          <div>
            {subtitle ? <p className="dashboard-modal-subtitle">{subtitle}</p> : null}
            <h3 className="dashboard-modal-title">{title}</h3>
          </div>
          <button type="button" className="dashboard-modal-close" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <div className="dashboard-modal-content">{children}</div>
      </article>
    </div>
  );
}

function KpiCard({ label, value, note, tone = "default" }: KpiCardProps) {
  const toneClass =
    tone === "danger"
      ? "border-[rgba(165,34,53,.16)] bg-[linear-gradient(180deg,rgba(255,244,246,.96),rgba(255,255,255,.96))]"
      : tone === "amber"
        ? "border-[rgba(189,132,16,.18)] bg-[linear-gradient(180deg,rgba(255,251,242,.96),rgba(255,255,255,.96))]"
        : tone === "blue"
          ? "border-[rgba(5,122,168,.18)] bg-[linear-gradient(180deg,rgba(242,249,253,.96),rgba(255,255,255,.96))]"
          : "border-[rgba(18,47,92,.12)] bg-[linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,251,255,.92))]";

  return (
    <article className={`rounded-[16px] border px-3 py-2.5 shadow-[0_10px_24px_rgba(18,47,92,.05)] ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-black leading-none text-(--text)">{value}</p>
      <p className="mt-1 text-[11px] text-[rgba(8,10,13,.58)]">{note}</p>
    </article>
  );
}

function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex min-h-[22px] items-center gap-1 rounded-full border px-2.5 text-[10px] font-black uppercase tracking-[0.1em] ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} aria-hidden="true" />
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
}

export function InventoryDashboardClient(props: InventoryDashboardClientProps) {
  const { items, totalItems, movements, totalMovements, actions } = props;
  const router = useRouter();
  const toast = useToast();

  const [modal, setModal] = useState<ModalId>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [filterType, setFilterType] = useState("all");
  const [filterGrammage, setFilterGrammage] = useState("all");
  const [filterColor, setFilterColor] = useState("all");
  const [filterStatus, setFilterStatus] = useState<InventoryStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortMode>("critical");
  const [warningTab, setWarningTab] = useState<WarningTab>("out");
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");
  const [drawerQuantity, setDrawerQuantity] = useState("");
  const [drawerReason, setDrawerReason] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalCatalogQuery, setModalCatalogQuery] = useState("");
  const [drafts, setDrafts] = useState<CreateEntryDraft[]>([]);
  const [modalErrorBag, setModalErrorBag] = useState<FormErrorBagState | null>(null);
  const [drawerErrorBag, setDrawerErrorBag] = useState<FormErrorBagState | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  const presetById = useMemo(
    () => new Map(GLOBAL_STOCK_PRESETS.map((preset) => [preset.id, preset])),
    []
  );

  const sortedMovements = useMemo(
    () =>
      [...movements].sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      ),
    [movements]
  );

  const movementsByItem = useMemo(() => {
    const grouped = new Map<string, InventoryMovement[]>();

    for (const movement of sortedMovements) {
      const list = grouped.get(movement.inventory_item_id);
      if (list) {
        list.push(movement);
      } else {
        grouped.set(movement.inventory_item_id, [movement]);
      }
    }

    return grouped;
  }, [sortedMovements]);

  const rows = useMemo<InventoryRow[]>(() => {
    return items.map((item) => {
      const preset = resolveGlobalStockPreset({
        garmentType: item.garment_type,
        garmentModel: item.garment_model,
        color: item.color,
        grammageG: item.grammage_g,
        fit: item.fit,
      });
      const rowMovements = movementsByItem.get(item.id) ?? [];
      const productName = productNameFrom(item, preset);
      const typeLabel = typeLabelFrom(item, preset);
      const fitLabel = fitLabelFrom(item, preset);
      const sizeLabel = item.size.trim().toUpperCase() || "-";
      const status = getStatus(item.quantity);

      return {
        item,
        preset,
        productName,
        typeLabel,
        fitLabel,
        sizeLabel,
        status,
        movements: rowMovements,
        lastMovement: rowMovements[0] ?? null,
        searchText: normalizeText(
          [
            productName,
            typeLabel,
            fitLabel,
            item.color,
            sizeLabel,
            item.grammage_g,
            movementTypeLabel(rowMovements[0]?.movement_type ?? ""),
          ].join(" ")
        ),
      };
    });
  }, [items, movementsByItem]);

  const rowById = useMemo(() => new Map(rows.map((row) => [row.item.id, row])), [rows]);

  const rowsByPresetId = useMemo(() => {
    const grouped = new Map<string, InventoryRow[]>();

    for (const row of rows) {
      if (!row.preset) continue;
      const list = grouped.get(row.preset.id);
      if (list) {
        list.push(row);
      } else {
        grouped.set(row.preset.id, [row]);
      }
    }

    return grouped;
  }, [rows]);

  const presetSummaries = useMemo<InventorySummary[]>(() => {
    return GLOBAL_STOCK_PRESETS.map((preset) => {
      const presetRows = [...(rowsByPresetId.get(preset.id) ?? [])].sort((left, right) =>
        compareSize(left.sizeLabel, right.sizeLabel)
      );
      const rowBySize = new Map(presetRows.map((row) => [row.sizeLabel, row]));
      const sizeLabels = Array.from(
        new Set([
          ...STOCK_SIZE_OPTIONS.map((option) => option.label),
          ...presetRows.map((row) => row.sizeLabel),
        ])
      ).sort(compareSize);

      const sizeCells = sizeLabels.map((size) => {
        const row = rowBySize.get(size) ?? null;
        return {
          size,
          quantity: Math.max(0, row?.item.quantity ?? 0),
          row,
        };
      });

      const totalQuantity = sizeCells.reduce((accumulator, cell) => accumulator + cell.quantity, 0);
      const lastMovement =
        [...presetRows].sort(
          (left, right) => movementTimestamp(right.lastMovement) - movementTimestamp(left.lastMovement)
        )[0]?.lastMovement ?? null;
      const primaryRow =
        [...presetRows].sort((left, right) => {
          if (left.item.quantity !== right.item.quantity) return left.item.quantity - right.item.quantity;
          return compareSize(left.sizeLabel, right.sizeLabel);
        })[0] ?? null;

      return {
        key: preset.id,
        preset,
        productName: preset.product,
        typeLabel: preset.category,
        fitLabel: formatToken(preset.fit),
        colorLabel: preset.color,
        grammageLabel: `${preset.grammageG}g`,
        totalQuantity,
        status: getStatus(totalQuantity),
        activeRowCount: presetRows.length,
        sizeCells,
        lastMovement,
        primaryRow,
        searchText: normalizeText(
          [
            preset.category,
            preset.product,
            preset.color,
            preset.grammageG,
            preset.fit,
            summarizeVisibleSizes(sizeCells),
          ].join(" ")
        ),
      };
    });
  }, [rowsByPresetId]);

  const summaryById = useMemo(
    () => new Map(presetSummaries.map((summary) => [summary.preset.id, summary])),
    [presetSummaries]
  );

  const selectedRow = selectedItemId ? rowById.get(selectedItemId) ?? null : null;
  const selectedSummary =
    selectedRow?.preset ? summaryById.get(selectedRow.preset.id) ?? null : null;

  const totalUnits = useMemo(
    () => presetSummaries.reduce((accumulator, summary) => accumulator + summary.totalQuantity, 0),
    [presetSummaries]
  );

  const totalOutOfStock = useMemo(
    () => presetSummaries.filter((summary) => summary.status === "out").length,
    [presetSummaries]
  );

  const totalLowStock = useMemo(
    () => presetSummaries.filter((summary) => summary.status === "low").length,
    [presetSummaries]
  );

  const movementCounters = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;

    let todayCount = 0;
    let weekCount = 0;

    for (const movement of sortedMovements) {
      const timestamp = new Date(movement.created_at).getTime();
      if (timestamp >= today.getTime()) todayCount += 1;
      if (timestamp >= weekStart) weekCount += 1;
    }

    return { todayCount, weekCount };
  }, [sortedMovements]);

  const typeFilterOptions = useMemo(
    () => [
      { value: "all", label: "Todos los tipos" },
      ...Array.from(new Set(presetSummaries.map((summary) => summary.typeLabel)))
        .sort((left, right) => {
          const leftRank = typeSortRank(left);
          const rightRank = typeSortRank(right);
          if (leftRank !== rightRank) return leftRank - rightRank;
          return left.localeCompare(right, "es-MX");
        })
        .map((label) => ({ value: label, label })),
    ],
    [presetSummaries]
  );

  const grammageFilterOptions = useMemo(
    () => [
      { value: "all", label: "Todos los gramajes" },
      ...Array.from(new Set(presetSummaries.map((summary) => String(summary.preset.grammageG))))
        .sort((left, right) => Number(right) - Number(left))
        .map((value) => ({ value, label: `${value}g` })),
    ],
    [presetSummaries]
  );

  const colorFilterOptions = useMemo(
    () => [
      { value: "all", label: "Todos los colores" },
      ...Array.from(new Set(presetSummaries.map((summary) => summary.colorLabel)))
        .sort((left, right) => left.localeCompare(right, "es-MX"))
        .map((value) => ({ value, label: value })),
    ],
    [presetSummaries]
  );

  const visibleSummaries = useMemo(() => {
    const query = normalizeText(deferredSearchQuery);

    return presetSummaries
      .filter((summary) => {
        if (filterType !== "all" && summary.typeLabel !== filterType) return false;
        if (filterGrammage !== "all" && String(summary.preset.grammageG) !== filterGrammage) {
          return false;
        }
        if (filterColor !== "all" && summary.colorLabel !== filterColor) return false;
        if (filterStatus !== "all" && summary.status !== filterStatus) return false;
        if (query && !summary.searchText.includes(query)) return false;
        return true;
      })
      .sort((left, right) => compareSummaries(left, right, sortBy));
  }, [
    deferredSearchQuery,
    filterColor,
    filterGrammage,
    filterStatus,
    filterType,
    presetSummaries,
    sortBy,
  ]);

  const visibleUnits = useMemo(
    () => visibleSummaries.reduce((accumulator, summary) => accumulator + summary.totalQuantity, 0),
    [visibleSummaries]
  );

  const visibleWarningCount = useMemo(
    () => visibleSummaries.filter((summary) => summary.status !== "ok").length,
    [visibleSummaries]
  );

  const modalPresetOptions = useMemo(() => {
    const query = normalizeText(modalCatalogQuery);
    return presetSummaries
      .filter((summary) => !query || summary.searchText.includes(query))
      .sort((left, right) => compareSummaries(left, right, "az"));
  }, [modalCatalogQuery, presetSummaries]);

  const warningSummaries = useMemo(
    () =>
      presetSummaries
        .filter((summary) => summary.status !== "ok")
        .sort((left, right) => compareSummaries(left, right, "critical")),
    [presetSummaries]
  );

  const outWarnings = useMemo(
    () => warningSummaries.filter((summary) => summary.status === "out"),
    [warningSummaries]
  );

  const lowWarnings = useMemo(
    () => warningSummaries.filter((summary) => summary.status === "low"),
    [warningSummaries]
  );

  const drawerNotes = useMemo(() => {
    if (!selectedRow) return [];
    return selectedRow.movements
      .filter((movement) => movement.reason || movement.source_ref)
      .slice(0, 4);
  }, [selectedRow]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    filterType !== "all" ||
    filterGrammage !== "all" ||
    filterColor !== "all" ||
    filterStatus !== "all";

  const overlayOpen = modal !== null || !!selectedRow;
  const modalBusy = pendingActionKey === "modal:create";

  useEffect(() => {
    if (!selectedRow) {
      setDrawerQuantity("");
      setDrawerReason("");
      setDrawerErrorBag(null);
      return;
    }

    setDrawerQuantity(String(selectedRow.item.quantity));
    setDrawerReason("");
    setDrawerErrorBag(null);
  }, [selectedRow]);

  useEffect(() => {
    if (!overlayOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [overlayOpen]);

  const closeModal = () => {
    setDrafts([]);
    setModalReason("");
    setModalCatalogQuery("");
    setModalErrorBag(null);
    setModal(null);
  };

  const closeDrawer = () => {
    setSelectedItemId(null);
    setDrawerTab("overview");
    setDrawerErrorBag(null);
    setDrawerReason("");
  };

  useEffect(() => {
    if (!overlayOpen) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (modal) {
        closeModal();
        return;
      }
      closeDrawer();
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [modal, overlayOpen]);

  const openCreateEntry = (presetId?: string, size = "m") => {
    const nextPresetId = presetId ?? GLOBAL_STOCK_PRESETS[0]?.id ?? "";
    if (!nextPresetId) return;
    setDrafts([createDraft(nextPresetId, size)]);
    setModalReason("");
    setModalCatalogQuery("");
    setModalErrorBag(null);
    setModal("create-entry");
  };

  const appendDraft = (presetId: string, size = "m") => {
    setDrafts((current) => [...current, createDraft(presetId, size)]);
  };

  const updateDraft = (draftKey: string, patch: Partial<CreateEntryDraft>) => {
    setDrafts((current) =>
      current.map((draft) => (draft.key === draftKey ? { ...draft, ...patch } : draft))
    );
  };

  const removeDraft = (draftKey: string) => {
    setDrafts((current) => current.filter((draft) => draft.key !== draftKey));
  };

  const openRowDrawer = (row: InventoryRow, nextTab: DrawerTab = "overview") => {
    setSelectedItemId(row.item.id);
    setDrawerTab(nextTab);
    setDrawerErrorBag(null);
  };

  const executeInventoryAction = async (
    action: ServerAction,
    formData: FormData,
    options: ExecuteActionOptions
  ) => {
    if (options.pendingKey) setPendingActionKey(options.pendingKey);
    options.setErrorBag?.(null);

    try {
      await action(formData);
      options.setErrorBag?.(null);
      toast.success(options.successMessage);
      options.onSuccess?.();
      startTransition(() => router.refresh());
    } catch (error) {
      const bag = toFormErrorBag(error, options.fallbackError);
      options.setErrorBag?.(bag);
      toast.error(bag.rawMessage);
    } finally {
      if (options.pendingKey) {
        setPendingActionKey((current) => (current === options.pendingKey ? null : current));
      }
    }
  };

  const handleCreateInventoryEntryAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (drafts.length === 0) {
      setModalErrorBag(toFormErrorBag(new Error("Debes agregar al menos una prenda.")));
      return;
    }

    const formData = new FormData();

    for (const draft of drafts) {
      const preset = presetById.get(draft.presetId);
      const quantity = Number(draft.quantity);

      if (!preset) {
        setModalErrorBag(toFormErrorBag(new Error("Hay una prenda invalida en la captura.")));
        return;
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        setModalErrorBag(toFormErrorBag(new Error("Cada cantidad debe ser mayor a 0.")));
        return;
      }

      formData.append("garment_type", preset.garmentType);
      formData.append("garment_model", preset.garmentModel);
      formData.append("color", preset.color);
      formData.append("size", draft.size);
      formData.append("grammage_g", String(preset.grammageG));
      formData.append("fit", preset.fit);
      formData.append("quantity", String(quantity));
    }

    if (modalReason.trim()) formData.set("reason", modalReason.trim());

    await executeInventoryAction(actions.createInventoryEntryAction, formData, {
      successMessage: "Entrada masiva registrada.",
      fallbackError: "No se pudo registrar la entrada de inventario.",
      pendingKey: "modal:create",
      setErrorBag: setModalErrorBag,
      onSuccess: closeModal,
    });
  };

  const handleDrawerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRow) return;

    const nextQuantity = Number(drawerQuantity);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      setDrawerErrorBag(toFormErrorBag(new Error("new_quantity invalido.")));
      return;
    }

    if (nextQuantity < selectedRow.item.quantity && !drawerReason.trim()) {
      setDrawerErrorBag(
        toFormErrorBag(new Error("reason es obligatorio cuando el ajuste reduce stock."))
      );
      return;
    }

    const formData = new FormData();
    formData.set("inventory_item_id", selectedRow.item.id);
    formData.set("new_quantity", String(nextQuantity));
    if (drawerReason.trim()) formData.set("reason", drawerReason.trim());

    await executeInventoryAction(actions.adjustInventoryQuantityAction, formData, {
      successMessage: "Cantidad de inventario actualizada.",
      fallbackError: "No se pudo actualizar la cantidad de inventario.",
      pendingKey: `drawer:${selectedRow.item.id}`,
      setErrorBag: setDrawerErrorBag,
      onSuccess: () => {
        setDrawerReason("");
      },
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterGrammage("all");
    setFilterColor("all");
    setFilterStatus("all");
  };

  const renderWarningList = (entries: InventorySummary[], emptyMessage: string) => {
    if (entries.length === 0) {
      return (
        <div className="rounded-[16px] border border-[rgba(18,47,92,.10)] bg-white/84 px-3 py-4 text-[12px] text-[rgba(8,10,13,.58)]">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((summary) => (
          <article
            key={summary.key}
            className={`rounded-[16px] border px-3 py-3 shadow-[0_8px_20px_rgba(18,47,92,.05)] ${statusMeta(summary.status).panelClassName}`}
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] border border-[rgba(18,47,92,.10)] bg-white/90">
                <img
                  src={summary.preset.imageSrc}
                  alt={summary.productName}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-black text-(--text)">{summary.productName}</p>
                    <p className="truncate text-[11px] text-[rgba(8,10,13,.58)]">
                      {summary.colorLabel} / {summary.grammageLabel} / {summary.fitLabel}
                    </p>
                  </div>
                  <StatusBadge status={summary.status} compact />
                </div>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[rgba(8,10,13,.62)]">
                  <span>{summary.totalQuantity} prendas</span>
                  <span>{summary.activeRowCount} tallas activas</span>
                </div>

                <p className="mt-2 text-[10px] text-[rgba(8,10,13,.54)]">
                  {summarizeVisibleSizes(summary.sizeCells)}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {summary.primaryRow ? (
                    <button
                      type="button"
                      className="rounded-full border border-[rgba(18,47,92,.12)] bg-white/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-(--text) transition hover:border-[rgba(5,122,168,.3)] hover:bg-[rgba(242,248,255,.96)]"
                      onClick={() => openRowDrawer(summary.primaryRow!, "overview")}
                    >
                      Ver detalle
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-full border border-[rgba(18,47,92,.10)] bg-[rgba(255,255,255,.8)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.66)] transition hover:border-[rgba(255,217,66,.56)] hover:bg-[rgba(255,249,228,.96)]"
                    onClick={() => openCreateEntry(summary.preset.id)}
                  >
                    Alta
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderSummaryCard = (summary: InventorySummary) => (
    <article
      key={summary.key}
      className={`rounded-[22px] border p-3 shadow-[0_14px_32px_rgba(18,47,92,.05)] ${statusMeta(summary.status).panelClassName}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-[110px] w-full shrink-0 overflow-hidden rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 sm:w-[110px]">
          <img
            src={summary.preset.imageSrc}
            alt={summary.productName}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgba(8,10,13,.48)]">
                {summary.typeLabel}
              </p>
              <h3 className="mt-1 text-[15px] font-black leading-tight text-(--text)">
                {summary.productName}
              </h3>
              <p className="mt-1 text-[11px] text-[rgba(8,10,13,.62)]">
                {summary.colorLabel} / {summary.grammageLabel} / {summary.fitLabel}
              </p>
            </div>

            <div className="shrink-0 sm:text-right">
              <StatusBadge status={summary.status} />
              <p className="mt-2 text-[26px] font-black leading-none text-(--text)">
                {summary.totalQuantity}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[rgba(8,10,13,.48)]">
                stock total
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            {summary.sizeCells.map((cell) => (
              <button
                key={`${summary.key}-${cell.size}`}
                type="button"
                className={`rounded-[12px] border px-2.5 py-2 text-left transition hover:border-[rgba(5,122,168,.28)] hover:bg-white ${
                  statusMeta(getStatus(cell.quantity)).className
                }`}
                onClick={() => {
                  if (cell.row) {
                    openRowDrawer(cell.row, "overview");
                    return;
                  }
                  openCreateEntry(summary.preset.id, cell.size.toLowerCase());
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                    {cell.size}
                  </span>
                  <span className="text-[13px] font-black">{cell.quantity}</span>
                </div>
                <p className="mt-1 text-[9px] uppercase tracking-[0.08em] opacity-75">
                  {cell.row ? "Detalle" : "Alta"}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {summary.primaryRow ? (
              <button
                type="button"
                className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-(--text) transition hover:border-[rgba(5,122,168,.3)] hover:bg-[rgba(242,248,255,.96)]"
                onClick={() => openRowDrawer(summary.primaryRow!, "overview")}
              >
                Ver detalle
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-full border border-[rgba(18,47,92,.10)] bg-[rgba(255,255,255,.8)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.66)] transition hover:border-[rgba(255,217,66,.56)] hover:bg-[rgba(255,249,228,.96)]"
              onClick={() => openCreateEntry(summary.preset.id)}
            >
              Alta manual
            </button>
            <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(8,10,13,.48)]">
              {summary.activeRowCount > 0
                ? `${summary.activeRowCount} tallas cargadas`
                : "0 stock visible"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <main className="dashboard-modern-shell w-full px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <section className="rounded-[24px] border border-[rgba(18,47,92,.12)] bg-[linear-gradient(180deg,rgba(255,255,255,.9),rgba(249,251,255,.78))] px-4 py-4 shadow-[0_18px_42px_rgba(18,47,92,.06)] sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgba(8,10,13,.46)]">
              Dashboard / Inventario / Catalogo stock
            </p>
            <h1 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-(--text) sm:text-[32px]">
              Inventario Operacion
            </h1>
            <p className="mt-1 max-w-[740px] text-[13px] text-[rgba(8,10,13,.62)]">
              Catalogo total por prenda con imagen, tallas visibles y 0 stock mostrado sin ocultar nada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              shadow="none"
              caps={false}
              className="h-[38px] rounded-full border border-[rgba(18,47,92,.12)] bg-white/88 px-4 text-[12px] font-semibold text-(--text)"
              onClick={() => setModal("all-movements")}
            >
              Ver movimientos
            </Button>
            <Button
              variant="primary"
              size="sm"
              shadow="none"
              caps={false}
              className="h-[38px] rounded-full px-4 text-[12px] font-semibold"
              onClick={() => openCreateEntry()}
            >
              Alta manual
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Catalogo base" value={GLOBAL_STOCK_PRESETS.length} note="prendas totales" tone="blue" />
          <KpiCard label="Registros" value={totalItems} note="tallas cargadas" />
          <KpiCard label="Total prendas" value={totalUnits} note="stock visible" />
          <KpiCard label="0 stock" value={totalOutOfStock} note="prioridad roja" tone="danger" />
          <KpiCard label="Bajo stock" value={totalLowStock} note="umbral <= 8" tone="amber" />
          <KpiCard label="Movs 7d" value={movementCounters.weekCount} note="ritmo semanal" />
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:h-[calc(100dvh-240px)] xl:grid-cols-12">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-[rgba(18,47,92,.12)] bg-[rgba(255,255,255,.82)] shadow-[0_18px_42px_rgba(18,47,92,.05)] xl:col-span-9">
          <div className="sticky top-3 z-20 border-b border-[rgba(18,47,92,.08)] bg-[rgba(252,253,255,.92)] px-3 py-3 backdrop-blur sm:px-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 xl:flex-row xl:items-end">
                <div className="min-w-0 flex-1">
                  <TextField
                    size="sm"
                    label="Buscar prenda"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Producto, color, gramaje o fit"
                    shellClassName="h-[38px] rounded-[12px] px-[10px] shadow-none"
                    inputClassName="text-[12px]"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 xl:gap-2">
                  <SelectField
                    size="sm"
                    label="Tipo"
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    options={typeFilterOptions}
                    shellClassName="h-[38px] rounded-[12px] px-[10px] shadow-none"
                    selectClassName="text-[12px]"
                  />
                  <SelectField
                    size="sm"
                    label="Gramaje"
                    value={filterGrammage}
                    onChange={(event) => setFilterGrammage(event.target.value)}
                    options={grammageFilterOptions}
                    shellClassName="h-[38px] rounded-[12px] px-[10px] shadow-none"
                    selectClassName="text-[12px]"
                  />
                  <SelectField
                    size="sm"
                    label="Color"
                    value={filterColor}
                    onChange={(event) => setFilterColor(event.target.value)}
                    options={colorFilterOptions}
                    shellClassName="h-[38px] rounded-[12px] px-[10px] shadow-none"
                    selectClassName="text-[12px]"
                  />
                  <SelectField
                    size="sm"
                    label="Ordenar"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortMode)}
                    options={SORT_OPTIONS}
                    shellClassName="h-[38px] rounded-[12px] px-[10px] shadow-none"
                    selectClassName="text-[12px]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "all", label: "Todos" },
                    { value: "out", label: "0 stock" },
                    { value: "low", label: "Bajo stock" },
                    { value: "ok", label: "OK" },
                  ].map((option) => {
                    const active = filterStatus === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                          active
                            ? "border-[rgba(8,10,13,.18)] bg-(--saut-black) text-white"
                            : "border-[rgba(18,47,92,.12)] bg-white/88 text-[rgba(8,10,13,.62)] hover:bg-[rgba(8,10,13,.04)]"
                        }`}
                        onClick={() => setFilterStatus(option.value as InventoryStatus | "all")}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-[rgba(8,10,13,.58)]">
                  {visibleSummaries.length} prendas visibles / {visibleUnits} en stock / {visibleWarningCount} alertas visibles
                </p>
              </div>

              {hasActiveFilters ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {searchQuery.trim() ? (
                    <button
                      type="button"
                      className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.62)]"
                      onClick={() => setSearchQuery("")}
                    >
                      Buscar: {searchQuery} x
                    </button>
                  ) : null}
                  {filterType !== "all" ? (
                    <button
                      type="button"
                      className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.62)]"
                      onClick={() => setFilterType("all")}
                    >
                      Tipo: {filterType} x
                    </button>
                  ) : null}
                  {filterGrammage !== "all" ? (
                    <button
                      type="button"
                      className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.62)]"
                      onClick={() => setFilterGrammage("all")}
                    >
                      {filterGrammage}g x
                    </button>
                  ) : null}
                  {filterColor !== "all" ? (
                    <button
                      type="button"
                      className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.62)]"
                      onClick={() => setFilterColor("all")}
                    >
                      {filterColor} x
                    </button>
                  ) : null}
                  {filterStatus !== "all" ? (
                    <button
                      type="button"
                      className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.62)]"
                      onClick={() => setFilterStatus("all")}
                    >
                      Estado: {statusMeta(filterStatus).label} x
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-full border border-[rgba(165,34,53,.16)] bg-[rgba(255,247,248,.96)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[rgb(125,24,38)]"
                    onClick={resetFilters}
                  >
                    Limpiar todo
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {visibleSummaries.length === 0 ? (
              <div className="grid min-h-[300px] place-items-center px-6 py-10 text-center">
                <div>
                  <p className="text-[13px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.52)]">
                    Sin resultados
                  </p>
                  <p className="mt-2 text-[13px] text-[rgba(8,10,13,.58)]">
                    Ajusta filtros o limpia la busqueda para volver a ver prendas disponibles.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    shadow="none"
                    caps={false}
                    className="mt-4 h-[38px] rounded-full border border-[rgba(18,47,92,.12)] bg-white/88 px-4 text-[12px] font-semibold"
                    onClick={resetFilters}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {visibleSummaries.map((summary) => renderSummaryCard(summary))}
              </div>
            )}
          </div>
        </section>

        <aside className="hidden min-h-0 xl:col-span-3 xl:flex xl:flex-col">
          <section className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-[rgba(18,47,92,.12)] bg-[rgba(255,255,255,.82)] p-3.5 shadow-[0_18px_42px_rgba(18,47,92,.05)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.14em] text-(--text)">Advertencias</h2>
                <p className="mt-1 text-[11px] text-[rgba(8,10,13,.58)]">0 stock y bajo stock en un solo panel.</p>
              </div>
              <p className="text-[11px] font-semibold text-[rgba(8,10,13,.54)]">
                {outWarnings.length + lowWarnings.length}
              </p>
            </div>

            <div className="mt-3 inline-flex rounded-full border border-[rgba(18,47,92,.12)] bg-[rgba(246,249,255,.9)] p-1">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                  warningTab === "out"
                    ? "bg-[rgb(165,34,53)] text-white"
                    : "text-[rgba(8,10,13,.56)] hover:bg-white"
                }`}
                onClick={() => setWarningTab("out")}
              >
                0 stock ({outWarnings.length})
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                  warningTab === "low"
                    ? "bg-[rgb(189,132,16)] text-white"
                    : "text-[rgba(8,10,13,.56)] hover:bg-white"
                }`}
                onClick={() => setWarningTab("low")}
              >
                Bajo ({lowWarnings.length})
              </button>
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
              {warningTab === "out"
                ? renderWarningList(outWarnings, "No hay prendas en 0 stock.")
                : renderWarningList(lowWarnings, "No hay prendas con bajo stock.")}
            </div>

            <div className="mt-3 border-t border-[rgba(18,47,92,.08)] pt-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.62)] transition hover:border-[rgba(5,122,168,.3)] hover:bg-[rgba(242,248,255,.98)]"
                  onClick={() => setModal("all-movements")}
                >
                  Ver movimientos
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-4 grid gap-3 xl:hidden">
        <details className="overflow-hidden rounded-[20px] border border-[rgba(18,47,92,.12)] bg-[rgba(255,255,255,.84)] shadow-[0_12px_28px_rgba(18,47,92,.05)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-(--text)">
            Advertencias ({outWarnings.length + lowWarnings.length})
          </summary>
          <div className="border-t border-[rgba(18,47,92,.08)] px-3 pb-3 pt-3">
            <div className="mb-3 inline-flex rounded-full border border-[rgba(18,47,92,.12)] bg-[rgba(246,249,255,.9)] p-1">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                  warningTab === "out"
                    ? "bg-[rgb(165,34,53)] text-white"
                    : "text-[rgba(8,10,13,.56)] hover:bg-white"
                }`}
                onClick={() => setWarningTab("out")}
              >
                0 stock ({outWarnings.length})
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                  warningTab === "low"
                    ? "bg-[rgb(189,132,16)] text-white"
                    : "text-[rgba(8,10,13,.56)] hover:bg-white"
                }`}
                onClick={() => setWarningTab("low")}
              >
                Bajo ({lowWarnings.length})
              </button>
            </div>
            {warningTab === "out"
              ? renderWarningList(outWarnings, "No hay prendas en 0 stock.")
              : renderWarningList(lowWarnings, "No hay prendas con bajo stock.")}
          </div>
        </details>

        <div className="rounded-[20px] border border-[rgba(18,47,92,.12)] bg-[rgba(255,255,255,.84)] px-3 py-3 shadow-[0_12px_28px_rgba(18,47,92,.05)]">
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.62)] transition hover:border-[rgba(5,122,168,.3)] hover:bg-[rgba(242,248,255,.98)]"
              onClick={() => setModal("all-movements")}
            >
              Ver movimientos
            </button>
          </div>
        </div>
      </div>
      <ModalShell
        title="Alta manual"
        subtitle="Carga varias prendas en una sola operacion"
        open={modal === "create-entry"}
        onClose={closeModal}
        panelClassName="dashboard-modal-panel--wide"
      >
        <form onSubmit={handleCreateInventoryEntryAction} className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
          <div className="space-y-3">
            <FormErrorBag bag={modalErrorBag} />

            <section className="rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-(--text)">
                    Captura
                  </h3>
                  <p className="mt-1 text-[11px] text-[rgba(8,10,13,.58)]">
                    Agrega varias prendas y tallas en la misma operacion.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                    Lineas
                  </p>
                  <p className="mt-1 text-[18px] font-black text-(--text)">{drafts.length}</p>
                </div>
              </div>

              {drafts.length === 0 ? (
                <div className="mt-3 rounded-[14px] border border-dashed border-[rgba(18,47,92,.14)] bg-[rgba(247,250,255,.78)] px-4 py-6 text-center text-[12px] text-[rgba(8,10,13,.58)]">
                  Agrega prendas desde el catalogo de la derecha.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {drafts.map((draft) => {
                    const preset = presetById.get(draft.presetId);
                    if (!preset) return null;

                    const summary = summaryById.get(preset.id) ?? null;
                    const selectedSize = draft.size.trim().toUpperCase();
                    const currentCell =
                      summary?.sizeCells.find((cell) => cell.size === selectedSize) ?? null;

                    return (
                      <article
                        key={draft.key}
                        className="rounded-[16px] border border-[rgba(18,47,92,.10)] bg-[rgba(248,250,255,.92)] p-3"
                      >
                        <div className="flex gap-3">
                          <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[14px] border border-[rgba(18,47,92,.10)] bg-white">
                            <img
                              src={preset.imageSrc}
                              alt={preset.product}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-black text-(--text)">
                                  {preset.product}
                                </p>
                                <p className="mt-1 text-[11px] text-[rgba(8,10,13,.58)]">
                                  {preset.category} / {preset.color} / {preset.grammageG}g
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[rgba(8,10,13,.48)]">
                                  stock actual {currentCell?.quantity ?? 0}
                                </p>
                              </div>

                              <button
                                type="button"
                                className="rounded-full border border-[rgba(165,34,53,.16)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[rgb(125,24,38)]"
                                onClick={() => removeDraft(draft.key)}
                              >
                                Quitar
                              </button>
                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <SelectField
                                size="sm"
                                label="Talla"
                                value={draft.size}
                                onChange={(event) =>
                                  updateDraft(draft.key, { size: event.target.value })
                                }
                                options={sizeOptionsFor(draft.size)}
                                shellClassName="h-[40px] rounded-[12px] px-[10px] shadow-none"
                                selectClassName="text-[12px]"
                              />
                              <TextField
                                size="sm"
                                label="Cantidad"
                                type="number"
                                min={1}
                                value={draft.quantity}
                                onChange={(event) =>
                                  updateDraft(draft.key, { quantity: event.target.value })
                                }
                                shellClassName="h-[40px] rounded-[12px] px-[10px] shadow-none"
                                inputClassName="text-[12px]"
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 p-3">
              <TextField
                size="sm"
                label="Motivo"
                value={modalReason}
                onChange={(event) => setModalReason(event.target.value)}
                placeholder="entrada, proveedor, ajuste inicial"
                shellClassName="h-[40px] rounded-[12px] px-[10px] shadow-none"
                inputClassName="text-[12px]"
              />
            </section>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                shadow="none"
                caps={false}
                isLoading={modalBusy}
                className="h-[40px] rounded-full px-4 text-[12px] font-semibold"
              >
                Registrar entrada
              </Button>
            </div>
          </div>

          <aside className="space-y-3">
            <section className="rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 p-3">
              <TextField
                size="sm"
                label="Buscar prenda"
                value={modalCatalogQuery}
                onChange={(event) => setModalCatalogQuery(event.target.value)}
                placeholder="Producto, color o gramaje"
                shellClassName="h-[40px] rounded-[12px] px-[10px] shadow-none"
                inputClassName="text-[12px]"
              />

              <div className="mt-3 max-h-[62vh] space-y-2 overflow-auto pr-1">
                {modalPresetOptions.map((summary) => {
                  const addedCount = drafts.filter((draft) => draft.presetId === summary.preset.id).length;
                  return (
                    <article
                      key={`catalog-${summary.key}`}
                      className="rounded-[16px] border border-[rgba(18,47,92,.10)] bg-[rgba(248,250,255,.92)] p-3"
                    >
                      <div className="flex gap-3">
                        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[14px] border border-[rgba(18,47,92,.10)] bg-white">
                          <img
                            src={summary.preset.imageSrc}
                            alt={summary.productName}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-black text-(--text)">
                                {summary.productName}
                              </p>
                              <p className="mt-1 text-[11px] text-[rgba(8,10,13,.58)]">
                                {summary.colorLabel} / {summary.grammageLabel} / {summary.fitLabel}
                              </p>
                            </div>
                            <StatusBadge status={summary.status} compact />
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[rgba(8,10,13,.58)]">
                            <span>{summary.totalQuantity} prendas</span>
                            <span>{summary.activeRowCount} tallas</span>
                            {addedCount > 0 ? <span>{addedCount} en captura</span> : null}
                          </div>

                          <p className="mt-2 text-[10px] text-[rgba(8,10,13,.48)]">
                            {summarizeVisibleSizes(summary.sizeCells)}
                          </p>

                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-(--text) transition hover:border-[rgba(5,122,168,.3)] hover:bg-[rgba(242,248,255,.96)]"
                              onClick={() =>
                                appendDraft(
                                  summary.preset.id,
                                  summary.primaryRow?.sizeLabel.toLowerCase() ?? "m"
                                )
                              }
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </aside>
        </form>
      </ModalShell>

      <ModalShell
        title="Todos los movimientos"
        subtitle={`${totalMovements} movimientos cargados`}
        open={modal === "all-movements"}
        onClose={closeModal}
        panelClassName="dashboard-modal-panel--wide"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[14px] border border-[rgba(18,47,92,.10)] bg-white/88 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
              Hoy
            </p>
            <p className="mt-1 text-[18px] font-black text-(--text)">{movementCounters.todayCount}</p>
          </div>
          <div className="rounded-[14px] border border-[rgba(18,47,92,.10)] bg-white/88 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
              Ultimos 7 dias
            </p>
            <p className="mt-1 text-[18px] font-black text-(--text)">{movementCounters.weekCount}</p>
          </div>
          <div className="rounded-[14px] border border-[rgba(18,47,92,.10)] bg-white/88 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
              Total
            </p>
            <p className="mt-1 text-[18px] font-black text-(--text)">{totalMovements}</p>
          </div>
        </div>

        <div className="mt-4 max-h-[58vh] space-y-2 overflow-auto pr-1">
          {sortedMovements.map((movement) => {
            const row = rowById.get(movement.inventory_item_id) ?? null;
            return (
              <button
                key={movement.id}
                type="button"
                className="w-full rounded-[16px] border border-[rgba(18,47,92,.10)] bg-white/90 px-3 py-3 text-left shadow-[0_8px_20px_rgba(18,47,92,.04)] transition hover:border-[rgba(5,122,168,.24)] hover:bg-[rgba(245,250,255,.98)]"
                onClick={() => {
                  closeModal();
                  if (row) openRowDrawer(row, "history");
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
                    {movementTypeLabel(movement.movement_type)}
                  </p>
                  <p className="text-[10px] text-[rgba(8,10,13,.46)]">
                    {formatDateTime(movement.created_at)}
                  </p>
                </div>

                <p className="mt-1 text-[12px] font-semibold text-(--text)">
                  {row ? itemLabel(row.item, row.preset) : "Prenda no disponible"}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[rgba(8,10,13,.58)]">
                  <span>Qty {signedQuantity(movement.quantity)}</span>
                  <span>{movement.actor || "sistema"}</span>
                  {movement.reason ? <span>{movement.reason}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </ModalShell>
      {selectedRow ? (
        <div className="fixed inset-0 z-[68]" aria-hidden={false}>
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(8,10,13,.46)] backdrop-blur-[2px]"
            onClick={closeDrawer}
            aria-label="Cerrar panel de detalle"
          />

          <aside
            id="inventory-drawer"
            className="absolute inset-0 flex flex-col bg-[rgba(249,251,255,.98)] sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[460px] sm:rounded-[26px] sm:border sm:border-[rgba(18,47,92,.14)] sm:shadow-[0_24px_60px_rgba(8,10,13,.22)]"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de prenda ${selectedRow.productName}`}
          >
            <header className="border-b border-[rgba(18,47,92,.08)] px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[16px] border border-[rgba(18,47,92,.10)] bg-white">
                    {selectedSummary ? (
                      <img
                        src={selectedSummary.preset.imageSrc}
                        alt={selectedRow.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.44)]">
                        Item
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgba(8,10,13,.46)]">
                      Detalle de prenda
                    </p>
                    <h2 className="mt-2 text-[20px] font-black leading-tight text-(--text)">
                      {selectedRow.productName}
                    </h2>
                    <p className="mt-1 text-[12px] text-[rgba(8,10,13,.58)]">
                      {selectedRow.typeLabel} / {selectedRow.item.color} / {selectedRow.sizeLabel} / {selectedRow.item.grammage_g}g
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.62)]"
                  onClick={closeDrawer}
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedRow.status} />
                <span className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.58)]">
                  {selectedRow.movements.length} movimientos
                </span>
                <span className="rounded-full border border-[rgba(18,47,92,.12)] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.58)]">
                  actualizado {formatDateOnly(selectedRow.item.updated_at)}
                </span>
              </div>
            </header>

            <div className="flex-1 overflow-auto px-4 py-4 sm:px-5">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-[16px] border border-[rgba(18,47,92,.10)] bg-white/90 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                    Stock actual
                  </p>
                  <p className="mt-1 text-[22px] font-black leading-none text-(--text)">
                    {selectedRow.item.quantity}
                  </p>
                </div>
                <div className="rounded-[16px] border border-[rgba(18,47,92,.10)] bg-white/90 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                    Talla
                  </p>
                  <p className="mt-1 text-[18px] font-black leading-none text-(--text)">
                    {selectedRow.sizeLabel}
                  </p>
                </div>
                <div className="rounded-[16px] border border-[rgba(18,47,92,.10)] bg-white/90 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                    Ultimo mov.
                  </p>
                  <p className="mt-1 text-[12px] font-black text-(--text)">
                    {selectedRow.lastMovement
                      ? movementTypeLabel(selectedRow.lastMovement.movement_type)
                      : "Sin movimientos"}
                  </p>
                  <p className="mt-1 text-[10px] text-[rgba(8,10,13,.48)]">
                    {selectedRow.lastMovement
                      ? formatDateTime(selectedRow.lastMovement.created_at)
                      : "Sin actividad"}
                  </p>
                </div>
              </div>

              <div className="mt-4 inline-flex rounded-full border border-[rgba(18,47,92,.12)] bg-[rgba(246,249,255,.9)] p-1">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                    drawerTab === "overview"
                      ? "bg-(--saut-black) text-white"
                      : "text-[rgba(8,10,13,.58)] hover:bg-white"
                  }`}
                  onClick={() => setDrawerTab("overview")}
                >
                  Resumen
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                    drawerTab === "history"
                      ? "bg-(--saut-black) text-white"
                      : "text-[rgba(8,10,13,.58)] hover:bg-white"
                  }`}
                  onClick={() => setDrawerTab("history")}
                >
                  Historial
                </button>
              </div>

              {drawerTab === "overview" ? (
                <div className="mt-4 space-y-4">
                  <section className="rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 p-3">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-(--text)">
                      Datos de la prenda
                    </h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-[12px] bg-[rgba(246,249,255,.94)] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                          Tipo
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-(--text)">{selectedRow.typeLabel}</p>
                      </div>
                      <div className="rounded-[12px] bg-[rgba(246,249,255,.94)] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                          Fit
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-(--text)">{selectedRow.fitLabel}</p>
                      </div>
                      <div className="rounded-[12px] bg-[rgba(246,249,255,.94)] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                          Color
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-(--text)">{selectedRow.item.color}</p>
                      </div>
                      <div className="rounded-[12px] bg-[rgba(246,249,255,.94)] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                          Gramaje
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-(--text)">{selectedRow.item.grammage_g}g</p>
                      </div>
                      <div className="rounded-[12px] bg-[rgba(246,249,255,.94)] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                          Creado
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-(--text)">
                          {formatDateOnly(selectedRow.item.created_at)}
                        </p>
                      </div>
                      <div className="rounded-[12px] bg-[rgba(246,249,255,.94)] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.48)]">
                          Actualizado
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-(--text)">
                          {formatDateOnly(selectedRow.item.updated_at)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {selectedSummary ? (
                    <section className="rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-(--text)">
                          Tallas de la prenda
                        </h3>
                        <span className="rounded-full border border-[rgba(18,47,92,.12)] bg-[rgba(247,250,255,.9)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
                          {selectedSummary.totalQuantity} total
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {selectedSummary.sizeCells.map((cell) => (
                          <button
                            key={`drawer-size-${cell.size}`}
                            type="button"
                            className={`rounded-[12px] border px-3 py-2 text-left transition hover:border-[rgba(5,122,168,.24)] hover:bg-[rgba(242,248,255,.98)] ${
                              statusMeta(getStatus(cell.quantity)).className
                            }`}
                            onClick={() => {
                              if (cell.row) {
                                openRowDrawer(cell.row, drawerTab);
                                return;
                              }
                              openCreateEntry(selectedSummary.preset.id, cell.size.toLowerCase());
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                                {cell.size}
                              </span>
                              <span className="text-[13px] font-black">{cell.quantity}</span>
                            </div>
                            <p className="mt-1 text-[9px] uppercase tracking-[0.08em] opacity-75">
                              {cell.row ? "Abrir" : "Alta"}
                            </p>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section className="rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 p-3">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-(--text)">
                      Set exacto
                    </h3>
                    <p className="mt-1 text-[11px] text-[rgba(8,10,13,.58)]">
                      Ajusta la cantidad final. Si reduces stock, el motivo es obligatorio.
                    </p>

                    <form onSubmit={handleDrawerSubmit} className="mt-3 grid gap-3">
                      <FormErrorBag bag={drawerErrorBag} />
                      <TextField
                        size="sm"
                        label="Cantidad final"
                        name="new_quantity"
                        type="number"
                        min={0}
                        value={drawerQuantity}
                        onChange={(event) => setDrawerQuantity(event.target.value)}
                        shellClassName="h-[40px] rounded-[12px] px-[10px] shadow-none"
                        inputClassName="text-[12px]"
                      />
                      <TextField
                        size="sm"
                        label="Motivo"
                        name="reason"
                        value={drawerReason}
                        onChange={(event) => setDrawerReason(event.target.value)}
                        placeholder="obligatorio si reduces stock"
                        shellClassName="h-[40px] rounded-[12px] px-[10px] shadow-none"
                        inputClassName="text-[12px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          variant="blue"
                          size="sm"
                          shadow="none"
                          caps={false}
                          isLoading={pendingActionKey === `drawer:${selectedRow.item.id}`}
                          className="h-[40px] rounded-full px-4 text-[12px] font-semibold"
                        >
                          Guardar ajuste
                        </Button>
                      </div>
                    </form>
                  </section>

                  <section className="rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 p-3">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-(--text)">
                      Notas operativas
                    </h3>
                    {drawerNotes.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {drawerNotes.map((movement) => (
                          <article
                            key={`${movement.id}-note`}
                            className="rounded-[12px] border border-[rgba(18,47,92,.08)] bg-[rgba(247,250,255,.9)] px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.52)]">
                                {movementTypeLabel(movement.movement_type)}
                              </p>
                              <p className="text-[10px] text-[rgba(8,10,13,.46)]">
                                {formatDateTime(movement.created_at)}
                              </p>
                            </div>
                            <p className="mt-1 text-[12px] text-(--text)">
                              {movement.reason || movement.source_ref || "Sin nota adicional"}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-[12px] text-[rgba(8,10,13,.58)]">
                        Sin notas registradas para esta prenda.
                      </p>
                    )}
                  </section>
                </div>
              ) : (
                <section className="mt-4 rounded-[18px] border border-[rgba(18,47,92,.10)] bg-white/90 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-(--text)">
                      Historial de la prenda
                    </h3>
                    <span className="rounded-full border border-[rgba(18,47,92,.12)] bg-[rgba(247,250,255,.9)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
                      {selectedRow.movements.length} eventos
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedRow.movements.length > 0 ? (
                      selectedRow.movements.map((movement) => (
                        <article
                          key={movement.id}
                          className="rounded-[14px] border border-[rgba(18,47,92,.08)] bg-[rgba(247,250,255,.92)] px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
                              {movementTypeLabel(movement.movement_type)}
                            </p>
                            <p className="text-[10px] text-[rgba(8,10,13,.46)]">
                              {formatDateTime(movement.created_at)}
                            </p>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[rgba(8,10,13,.58)]">
                            <span>Qty {signedQuantity(movement.quantity)}</span>
                            <span>{movement.actor || "sistema"}</span>
                            {movement.source_ref ? <span>{movement.source_ref}</span> : null}
                          </div>

                          {movement.reason ? (
                            <p className="mt-2 text-[12px] text-(--text)">{movement.reason}</p>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <p className="text-[12px] text-[rgba(8,10,13,.58)]">
                        Esta prenda aun no tiene movimientos registrados.
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
