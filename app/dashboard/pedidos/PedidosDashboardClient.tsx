"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button, Checkbox, DashboardModal, SelectField, TextField, type SelectOption } from "@/core/design-system";
import { FormErrorBag } from "@/core/design-system/feedback/FormErrorBag";
import {
  toFormErrorBag,
  type FormErrorBag as FormErrorBagState,
} from "@/core/design-system/feedback/form-errors";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import type { Order, WorkOrder } from "@/modules/dashboard/orders/server/api";

type ServerAction = (formData: FormData) => Promise<void>;

type PedidosActions = {
  updateOrderStatusAction: ServerAction;
  updateWorkOrderChecklistAction: ServerAction;
  registerMermaAction: ServerAction;
};

type PedidosFilters = {
  q: string;
  status: string;
  shippingMethod: string;
  from: string;
  to: string;
};

export type OrderItemVisual = {
  title: string;
  subtitle?: string;
  previewImageUrl?: string;
  frontDesignUrl?: string;
  backDesignUrl?: string;
  printableAssetUrl?: string;
  printableAssetLabel?: string;
};

type PedidosDashboardClientProps = {
  orders: Order[];
  ordersTotal: number;
  workOrders: WorkOrder[];
  workOrdersByOrderId: Record<string, WorkOrder[]>;
  orderItemVisualById: Record<string, OrderItemVisual>;
  shippingMethodOptions: string[];
  filters: PedidosFilters;
  actions: PedidosActions;
};

type PedidosFormKey =
  | "update-order-status"
  | "update-work-order-checklist"
  | "register-merma";
type Tone = "neutral" | "blue" | "amber" | "success" | "danger";
type OrderItem = Order["items"][number];

const ORDER_STATUS_OPTIONS: SelectOption[] = [
  { value: "waiting_design", label: "En espera de diseño" },
  { value: "designed", label: "Diseñado" },
  { value: "packed", label: "Empacado" },
  { value: "shipped", label: "Enviado" },
  { value: "out_for_delivery", label: "En reparto" },
  { value: "delivered", label: "Entregado" },
  { value: "failed", label: "Fallido" },
];

const ORDER_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todos los estados" },
  ...ORDER_STATUS_OPTIONS,
];

type ChecklistStepKey =
  | "dtf_sent_to_print"
  | "dtf_printed"
  | "dtf_applied"
  | "packed"
  | "shipped"
  | "delivered";

const CHECKLIST_STEPS: Array<{ key: ChecklistStepKey; label: string }> = [
  { key: "dtf_sent_to_print", label: "DTF MANDADO A IMPRIMIR" },
  { key: "dtf_printed", label: "DTF IMPRESO" },
  { key: "dtf_applied", label: "DTF APLICADO" },
  { key: "packed", label: "EMPACADO" },
  { key: "shipped", label: "ENVIADO" },
  { key: "delivered", label: "ENTREGADO" },
];

function money(value: number): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function token(value: string): string {
  const normalized = value.trim().replace(/[_-]+/g, " ");
  if (!normalized) return "-";

  return normalized
    .split(/\s+/)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function statusLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "waiting_design") return "Esperando diseño";
  if (normalized === "designed") return "Diseñado";
  if (normalized === "packed") return "Empacado";
  if (normalized === "shipped") return "Enviado";
  if (normalized === "out_for_delivery") return "En reparto";
  if (normalized === "delivered") return "Entregado";
  if (normalized === "failed") return "Fallida";
  return token(value);
}

type ChecklistState = Record<ChecklistStepKey, boolean>;

function checklistStateFromWorkOrder(workOrder: WorkOrder | null): ChecklistState {
  if (!workOrder) {
    return {
      dtf_sent_to_print: false,
      dtf_printed: false,
      dtf_applied: false,
      packed: false,
      shipped: false,
      delivered: false,
    };
  }

  return {
    dtf_sent_to_print: workOrder.checklist.dtf_sent_to_print,
    dtf_printed: workOrder.checklist.dtf_printed,
    dtf_applied: workOrder.checklist.dtf_applied,
    packed: workOrder.checklist.packed,
    shipped: workOrder.checklist.shipped,
    delivered: workOrder.checklist.delivered,
  };
}

function applyChecklistToggle(
  current: ChecklistState,
  key: keyof ChecklistState,
  enabled: boolean
): ChecklistState {
  const index = CHECKLIST_STEPS.findIndex((step) => step.key === key);
  if (index < 0) return current;

  const next = { ...current };
  CHECKLIST_STEPS.forEach((step, stepIndex) => {
    if (enabled && stepIndex <= index) {
      next[step.key] = true;
    }
    if (!enabled && stepIndex >= index) {
      next[step.key] = false;
    }
  });
  return next;
}

function deriveOrderStatusFromChecklist(
  checklist: ChecklistState,
  shippingMethod: string
): string {
  if (checklist.delivered) return "delivered";
  if (checklist.shipped) {
    if (shippingMethod.trim().toLowerCase() === "local") {
      return "out_for_delivery";
    }
    return "shipped";
  }
  if (checklist.packed) return "packed";
  if (checklist.dtf_sent_to_print) return "designed";
  return "waiting_design";
}

const MERMA_REASON_CODE_TIP =
  "Códigos actuales: dtf_failed (usa snake_case para nuevos códigos).";

function lineItemLabel(item: OrderItem): string {
  return `${token(item.garment_type)} ${token(item.garment_model)} | ${token(item.color)} | ${item.size}`;
}

function toneClass(tone: Tone): string {
  if (tone === "danger") {
    return "border-[rgba(151,31,51,.32)] bg-[rgba(151,31,51,.12)] text-[rgb(112,22,38)]";
  }
  if (tone === "success") {
    return "border-[rgba(26,130,76,.3)] bg-[rgba(26,130,76,.12)] text-[rgb(17,102,58)]";
  }
  if (tone === "amber") {
    return "border-[rgba(189,132,16,.3)] bg-[rgba(189,132,16,.15)] text-[rgb(133,96,13)]";
  }
  if (tone === "blue") {
    return "border-[rgba(5,122,168,.3)] bg-[rgba(5,122,168,.14)] text-charcoal";
  }
  return "border-[rgba(8,10,13,.18)] bg-[rgba(255,255,255,.88)] text-[rgba(8,10,13,.72)]";
}

function orderTone(status: string): Tone {
  const normalized = status.toLowerCase();
  if (normalized === "failed") return "danger";
  if (normalized === "delivered") return "success";
  if (normalized === "shipped" || normalized === "out_for_delivery") return "blue";
  if (normalized === "packed" || normalized === "designed") return "amber";
  return "neutral";
}

function workOrderTone(status: string): Tone {
  const normalized = status.toLowerCase();
  if (normalized.includes("fail")) return "danger";
  if (normalized === "completed" || normalized === "delivered") return "success";
  if (normalized === "in_progress" || normalized === "printing" || normalized === "packed") {
    return "blue";
  }
  return "neutral";
}

function checklistDoneCountFromState(checklist: ChecklistState): number {
  return CHECKLIST_STEPS.reduce(
    (sum, step) => sum + (checklist[step.key] === true ? 1 : 0),
    0
  );
}

function buildFilterQuery(filters: PedidosFilters): string {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  const from = filters.from.trim();
  const to = filters.to.trim();

  if (q) params.set("q", q);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.shippingMethod && filters.shippingMethod !== "all") {
    params.set("shipping_method", filters.shippingMethod);
  }
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return params.toString();
}

function actionLinkClass(tone: "neutral" | "blue" | "amber"): string {
  if (tone === "blue") {
    return "border-[rgba(5,122,168,.26)] bg-[rgba(240,248,254,.98)] text-[rgb(18,77,112)]";
  }
  if (tone === "amber") {
    return "border-[rgba(189,132,16,.3)] bg-[rgba(255,249,235,.98)] text-[rgb(124,91,13)]";
  }
  return "border-[rgba(8,10,13,.18)] bg-white/94 text-[rgba(8,10,13,.76)]";
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={[
        "inline-flex min-h-[24px] items-center rounded-[999px] border px-2.5 text-[10px] font-black uppercase tracking-[0.1em]",
        toneClass(tone),
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function OrderItemDetailCard({
  item,
  visual,
}: {
  item: OrderItem;
  visual?: OrderItemVisual;
}) {
  const lineTotal = item.quantity * item.unit_price_mxn;
  const primaryPrintUrl =
    visual?.printableAssetUrl ?? visual?.frontDesignUrl ?? visual?.previewImageUrl;

  return (
    <article className="rounded-[14px] border border-[rgba(18,47,92,.14)] bg-white/94 p-3">
      <div className="flex items-start gap-3">
        <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[12px] border border-[rgba(8,10,13,.14)] bg-[rgba(247,250,253,.9)]">
          {visual?.previewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={visual.previewImageUrl}
              alt={visual.title ?? lineItemLabel(item)}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.42)]">
              Sin imagen
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[12px] font-black uppercase tracking-[0.08em] text-ink">
            {visual?.title ?? lineItemLabel(item)}
          </p>
          {visual?.subtitle ? (
            <p className="mt-1 line-clamp-2 text-[11px] text-[rgba(8,10,13,.62)]">{visual.subtitle}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-[rgba(8,10,13,.72)]">{lineItemLabel(item)}</p>
          <p className="mt-1 text-[11px] text-[rgba(8,10,13,.72)]">
            {item.quantity} x ${money(item.unit_price_mxn)} ={" "}
            <span className="font-black text-charcoal">${money(lineTotal)}</span>
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visual?.frontDesignUrl ? (
          <a
            href={visual.frontDesignUrl}
            target="_blank"
            rel="noreferrer"
            className={[
              "rounded-[999px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
              actionLinkClass("neutral"),
            ].join(" ")}
          >
            Frontal PNG
          </a>
        ) : null}
        {visual?.backDesignUrl ? (
          <a
            href={visual.backDesignUrl}
            target="_blank"
            rel="noreferrer"
            className={[
              "rounded-[999px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
              actionLinkClass("neutral"),
            ].join(" ")}
          >
            Trasera PNG
          </a>
        ) : null}
        {visual?.printableAssetUrl ? (
          <a
            href={visual.printableAssetUrl}
            target="_blank"
            rel="noreferrer"
            className={[
              "rounded-[999px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
              actionLinkClass("blue"),
            ].join(" ")}
          >
            {visual.printableAssetLabel ?? "Archivo de impresión"}
          </a>
        ) : null}
        {primaryPrintUrl ? (
          <a
            href={primaryPrintUrl}
            target="_blank"
            rel="noreferrer"
            className={[
              "rounded-[999px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
              actionLinkClass("amber"),
            ].join(" ")}
          >
            Abrir archivo para impresión
          </a>
        ) : null}
      </div>
    </article>
  );
}

type OrderGridCardProps = {
  order: Order;
  workOrders: WorkOrder[];
  orderItemVisualById: Record<string, OrderItemVisual>;
  describeWorkOrder: (workOrder: WorkOrder, index: number) => string;
  onOpen: (orderId: string) => void;
};

function OrderGridCard({
  order,
  workOrders,
  orderItemVisualById,
  describeWorkOrder,
  onOpen,
}: OrderGridCardProps) {
  const firstItem = order.items[0];
  const previewVisual = firstItem ? orderItemVisualById[firstItem.id] : undefined;

  return (
    <article className="rounded-[16px] border border-[rgba(18,47,92,.16)] bg-[linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.84))] p-3 shadow-[0_10px_22px_rgba(18,47,92,.08)]">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
            Pedido
          </p>
          <p className="truncate text-[12px] font-black text-ink">{order.email}</p>
          <p className="mt-0.5 text-[11px] text-[rgba(8,10,13,.66)]">
            {formatDateTime(order.created_at)}
          </p>
        </div>
        <Badge label={statusLabel(order.status)} tone={orderTone(order.status)} />
      </header>

      <div className="mt-2 flex items-start gap-2">
        <div className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/90">
          {previewVisual?.previewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewVisual.previewImageUrl}
              alt={previewVisual.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[9px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.4)]">
              Sin imagen
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-[11px] text-[rgba(8,10,13,.72)]">
          <p className="line-clamp-1">{previewVisual?.title ?? "Pedido de cliente"}</p>
          <p className="line-clamp-1">
            {token(order.shipping_method)} | {order.tracking_number ?? "Sin tracking"}
          </p>
          <p className="line-clamp-1">
            {order.items.length} prenda(s) | Total ${money(order.total_mxn)}
          </p>
        </div>
      </div>

      <div className="mt-2 rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/84 p-2">
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.56)]">
          Flujos del pedido ({workOrders.length})
        </p>
        {workOrders.length ? (
          <div className="mt-1 grid gap-1">
            {workOrders.slice(0, 2).map((workOrder, index) => (
              <div
                key={workOrder.id}
                className="flex items-center justify-between gap-2 rounded-[8px] border border-[rgba(8,10,13,.12)] bg-white px-2 py-1"
              >
                <span className="truncate text-[10px] text-[rgba(8,10,13,.68)]">
                  {describeWorkOrder(workOrder, index)}
                </span>
                <Badge label={statusLabel(workOrder.status)} tone={workOrderTone(workOrder.status)} />
              </div>
            ))}
            {workOrders.length > 2 ? (
              <p className="text-[10px] text-[rgba(8,10,13,.56)]">+{workOrders.length - 2} flujos más</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1 text-[10px] text-[rgba(8,10,13,.56)]">Sin flujos del pedido asociados</p>
        )}
      </div>

      <div className="mt-3">
        <Button type="button" size="sm" variant="outline" shadow="none" fullWidthMobile onClick={() => onOpen(order.id)}>
          Abrir pedido
        </Button>
      </div>
    </article>
  );
}

export function PedidosDashboardClient({
  orders,
  ordersTotal,
  workOrders,
  workOrdersByOrderId,
  orderItemVisualById,
  shippingMethodOptions,
  filters,
  actions,
}: PedidosDashboardClientProps) {
  const router = useRouter();
  const toast = useToast();

  const [errorBagByForm, setErrorBagByForm] = useState<
    Partial<Record<PedidosFormKey, FormErrorBagState>>
  >({});

  const [queryFilter, setQueryFilter] = useState(filters.q);
  const [statusFilter, setStatusFilter] = useState(filters.status || "all");
  const [shippingFilter, setShippingFilter] = useState(filters.shippingMethod || "all");
  const [fromFilter, setFromFilter] = useState(filters.from);
  const [toFilter, setToFilter] = useState(filters.to);

  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("designed");
  const [isOpsModalOpen, setOpsModalOpen] = useState(false);

  const orderById = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders]);
  const workOrderById = useMemo(
    () => new Map(workOrders.map((workOrder) => [workOrder.id, workOrder])),
    [workOrders]
  );
  const orderItemById = useMemo(() => {
    const map = new Map<string, { order: Order; item: OrderItem; itemIndex: number }>();
    for (const order of orders) {
      order.items.forEach((item, itemIndex) => {
        map.set(item.id, { order, item, itemIndex });
      });
    }
    return map;
  }, [orders]);

  const shippingFilterOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "Todos los metodos" },
      ...shippingMethodOptions.map((method) => ({
        value: method,
        label: token(method),
      })),
    ],
    [shippingMethodOptions]
  );

  const resolvedSelectedOrderId =
    selectedOrderId && orderById.has(selectedOrderId) ? selectedOrderId : orders[0]?.id ?? "";
  const selectedOrder = resolvedSelectedOrderId
    ? orderById.get(resolvedSelectedOrderId) ?? null
    : null;
  const selectedOrderWorkOrders = useMemo(
    () => (selectedOrder ? workOrdersByOrderId[selectedOrder.id] ?? [] : []),
    [selectedOrder, workOrdersByOrderId]
  );
  const resolvedSelectedChecklistWorkOrderId = selectedOrderWorkOrders[0]?.id ?? "";

  const selectedChecklistWorkOrder = resolvedSelectedChecklistWorkOrderId
    ? workOrderById.get(resolvedSelectedChecklistWorkOrderId) ?? null
    : null;
  const selectedMermaWorkOrder = selectedChecklistWorkOrder;
  const resolvedSelectedMermaWorkOrderId = resolvedSelectedChecklistWorkOrderId;
  const [checklistState, setChecklistState] = useState<ChecklistState>(() =>
    checklistStateFromWorkOrder(selectedChecklistWorkOrder)
  );

  const selectedChecklistItem = selectedChecklistWorkOrder
    ? orderItemById.get(selectedChecklistWorkOrder.order_item_id)
    : undefined;
  const selectedMermaItem = selectedMermaWorkOrder
    ? orderItemById.get(selectedMermaWorkOrder.order_item_id)
    : undefined;

  const updateChecklistStep = (step: ChecklistStepKey, checked: boolean) => {
    setChecklistState((current) => {
      const next = applyChecklistToggle(current, step, checked);
      if (selectedOrder) {
        setSelectedOrderStatus(deriveOrderStatusFromChecklist(next, selectedOrder.shipping_method));
      }
      return next;
    });
  };

  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const failedOrders = orders.filter((order) => order.status === "failed").length;
  const inTransitOrders = orders.filter(
    (order) => order.status === "shipped" || order.status === "out_for_delivery"
  ).length;
  const workOrdersWithFailures = workOrders.filter((workOrder) => workOrder.failures_count > 0).length;
  const completedWorkOrders = workOrders.filter((workOrder) => workOrder.checklist.delivered).length;
  const nationalOrders = orders.filter((order) => order.shipping_method === "national").length;
  const ordersWithTracking = orders.filter((order) => Boolean(order.tracking_number)).length;

  const initialFilterQuery = useMemo(
    () =>
      buildFilterQuery({
        q: filters.q,
        status: filters.status || "all",
        shippingMethod: filters.shippingMethod || "all",
        from: filters.from,
        to: filters.to,
      }),
    [filters.from, filters.q, filters.shippingMethod, filters.status, filters.to]
  );

  const activeFilterQuery = useMemo(
    () =>
      buildFilterQuery({
        q: queryFilter,
        status: statusFilter,
        shippingMethod: shippingFilter,
        from: fromFilter,
        to: toFilter,
      }),
    [fromFilter, queryFilter, shippingFilter, statusFilter, toFilter]
  );

  const skydropxWebhooks = useMemo(
    () => [
      {
        event: "shipment.created",
        when: "hace 2 min",
        detail: `${Math.max(1, nationalOrders)} envio(s) nacional(es) en pipeline`,
        tone: "success" as Tone,
      },
      {
        event: "tracking.updated",
        when: "hace 7 min",
        detail: `${ordersWithTracking} pedido(s) con tracking sincronizado`,
        tone: "blue" as Tone,
      },
      {
        event: "delivery.delayed",
        when: "hace 22 min",
        detail: "2 rutas sin confirmacion final",
        tone: "amber" as Tone,
      },
    ],
    [nationalOrders, ordersWithTracking]
  );

  const describeWorkOrder = (workOrder: WorkOrder, index: number): string => {
    const linked = orderItemById.get(workOrder.order_item_id);
    if (!linked) return `Flujo ${index + 1}`;
    return lineItemLabel(linked.item);
  };

  const setFormErrorBag = (formKey: PedidosFormKey, bag: FormErrorBagState | null) => {
    setErrorBagByForm((previous) => {
      const next = { ...previous };
      if (!bag) delete next[formKey];
      else next[formKey] = bag;
      return next;
    });
  };

  const runAction = async (
    formKey: PedidosFormKey,
    action: ServerAction,
    formData: FormData,
    successMessage: string,
    fallbackError: string
  ) => {
    setFormErrorBag(formKey, null);
    try {
      await action(formData);
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      const bag = toFormErrorBag(error, fallbackError);
      setFormErrorBag(formKey, bag);
      toast.error(bag.rawMessage);
    }
  };

  const submitForm =
    (
      formKey: PedidosFormKey,
      action: ServerAction,
      successMessage: string,
      fallbackError: string
    ) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await runAction(formKey, action, new FormData(event.currentTarget), successMessage, fallbackError);
    };

  const openOrderOps = (orderId: string) => {
    const order = orderById.get(orderId);
    const firstWorkOrder = workOrdersByOrderId[orderId]?.[0] ?? null;
    setSelectedOrderId(orderId);

    setSelectedOrderStatus(order?.status ?? "designed");
    setChecklistState(checklistStateFromWorkOrder(firstWorkOrder));
    setOpsModalOpen(true);
  };

  const submitChecklistForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("work_order_id", resolvedSelectedChecklistWorkOrderId);
    for (const step of CHECKLIST_STEPS) {
      formData.set(step.key, checklistState[step.key] ? "true" : "false");
    }
    await runAction(
      "update-work-order-checklist",
      actions.updateWorkOrderChecklistAction,
      formData,
      "Flujo del pedido actualizado.",
      "No se pudo actualizar el flujo del pedido."
    );
  };

  const resetFilters = () => {
    setQueryFilter("");
    setStatusFilter("all");
    setShippingFilter("all");
    setFromFilter("");
    setToFilter("");
  };

  useEffect(() => {
    if (activeFilterQuery === initialFilterQuery) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(activeFilterQuery ? `/dashboard/pedidos?${activeFilterQuery}` : "/dashboard/pedidos");
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [activeFilterQuery, initialFilterQuery, router]);

  useEffect(() => {
    if (!isOpsModalOpen || !selectedOrder) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpsModalOpen(false);
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpsModalOpen, selectedOrder]);

  return (
    <>
      <main className="rounded-md border border-hairline bg-soft-cloud/90 w-full px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="relative overflow-hidden rounded-md border border-hairline bg-soft-cloud p-5 sm:p-6">

          <div className="relative z-[1] grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] xl:items-end">
            <header>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-charcoal">
                SAUT Staff - Pedidos
              </p>
              <h1 className="mt-1 text-[24px] font-black uppercase tracking-[0.04em] text-ink sm:text-[30px]">
                Pedido y flujo del pedido
              </h1>
              <p className="mt-2 max-w-[72ch] text-[12px] text-[rgba(8,10,13,.68)]">
                Detalle por prenda con imagen/diseño e integración Skydropx mock para monitoreo.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge label={`${ordersTotal} pedidos`} tone="blue" />
                <Badge label={`${workOrders.length} flujos del pedido`} tone="amber" />
                <Badge label={`${inTransitOrders} en tránsito`} tone="neutral" />
              </div>
            </header>
            <div className="grid gap-2 sm:grid-cols-2">
              <article className="rounded-[14px] border border-[rgba(18,47,92,.14)] bg-white/90 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
                  Entregados
                </p>
                <p className="mt-1 text-[22px] font-black">{deliveredOrders}</p>
              </article>
              <article className="rounded-[14px] border border-[rgba(18,47,92,.14)] bg-white/90 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
                  Fallidos
                </p>
                <p className="mt-1 text-[22px] font-black">{failedOrders}</p>
              </article>
              <article className="rounded-[14px] border border-[rgba(18,47,92,.14)] bg-white/90 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
                  Flujos con fallos
                </p>
                <p className="mt-1 text-[22px] font-black">{workOrdersWithFailures}</p>
              </article>
              <article className="rounded-[14px] border border-[rgba(18,47,92,.14)] bg-white/90 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgba(8,10,13,.56)]">
                  Flujos completados
                </p>
                <p className="mt-1 text-[22px] font-black">{completedWorkOrders}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-[16px] border border-[rgba(18,47,92,.14)] bg-[linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.8))] p-3 shadow-[0_8px_18px_rgba(18,47,92,.06)]">
          <div className="flex flex-wrap items-end gap-2 xl:flex-nowrap">
            <TextField id="pedidos-filter-q" label="Búsqueda" size="sm" value={queryFilter} onChange={(event) => setQueryFilter(event.target.value)} placeholder="correo, tracking, prenda" wrapperClassName="min-w-[220px] flex-[1.35]" inputClassName="text-[11px]" />
            <div className="min-w-[170px] flex-1">
              <SelectField
                id="pedidos-filter-status"
                label="Estado"
                size="sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={ORDER_STATUS_FILTER_OPTIONS}
              />
            </div>
            <div className="min-w-[170px] flex-1">
              <SelectField
                id="pedidos-filter-shipping"
                label="Método de envío"
                size="sm"
                value={shippingFilter}
                onChange={(event) => setShippingFilter(event.target.value)}
                options={shippingFilterOptions}
              />
            </div>
            <TextField id="pedidos-filter-from" label="Desde" type="datetime-local" size="sm" value={fromFilter} onChange={(event) => setFromFilter(event.target.value)} wrapperClassName="min-w-[180px] flex-1" inputClassName="text-[11px]" />
            <TextField id="pedidos-filter-to" label="Hasta" type="datetime-local" size="sm" value={toFilter} onChange={(event) => setToFilter(event.target.value)} wrapperClassName="min-w-[180px] flex-1" inputClassName="text-[11px]" />
            <div className="flex items-end">
              <Button type="button" size="sm" variant="ghost" shadow="none" onClick={resetFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[18px] border border-[rgba(18,47,92,.16)] bg-[linear-gradient(180deg,rgba(247,251,255,.95),rgba(255,255,255,.92))] p-4 shadow-[0_12px_26px_rgba(18,47,92,.08)]">
          <header className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgba(8,10,13,.56)]">
                Pedidos
              </p>
              <h2 className="mt-1 text-[15px] font-black uppercase tracking-[0.08em] text-ink">
                Haz clic en una tarjeta para abrir operaciones
              </h2>
            </div>
            <Badge label={`${orders.length} visibles`} tone="neutral" />
          </header>
          {orders.length ? (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {orders.map((order) => (
                <OrderGridCard
                  key={order.id}
                  order={order}
                  workOrders={workOrdersByOrderId[order.id] ?? []}
                  orderItemVisualById={orderItemVisualById}
                  describeWorkOrder={describeWorkOrder}
                  onOpen={openOrderOps}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/86 px-3 py-2 text-[12px] text-[rgba(8,10,13,.62)]">
              No hay pedidos para este filtro.
            </p>
          )}
        </section>

        <section className="mt-4 rounded-[18px] border border-[rgba(5,122,168,.18)] bg-[linear-gradient(180deg,rgba(243,250,255,.94),rgba(255,255,255,.92))] p-4 shadow-[0_12px_24px_rgba(18,47,92,.07)]">
          <header className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgba(8,10,13,.56)]">
                Skydropx (mock)
              </p>
              <h2 className="mt-1 text-[15px] font-black uppercase tracking-[0.08em] text-ink">
                Webhooks, alertas y monitoreo
              </h2>
              <p className="mt-1 text-[11px] text-[rgba(8,10,13,.66)]">
                Hardcodeado temporalmente. Aquí se conectará la API y los webhooks reales de Skydropx.
              </p>
            </div>
            <Badge label="Modo simulación" tone="amber" />
          </header>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <article className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/90 px-2.5 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.56)]">
                API status
              </p>
              <p className="mt-1 text-[12px] font-semibold text-[rgb(17,102,58)]">Operativa (mock)</p>
            </article>
            <article className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/90 px-2.5 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.56)]">
                Envío nacional
              </p>
              <p className="mt-1 text-[12px] font-semibold text-ink">{nationalOrders} pedidos</p>
            </article>
            <article className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/90 px-2.5 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.56)]">
                Tracking activo
              </p>
              <p className="mt-1 text-[12px] font-semibold text-ink">{ordersWithTracking} pedidos</p>
            </article>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <article className="rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/92 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.58)]">
                Últimos webhooks
              </p>
              <div className="mt-2 grid gap-1.5">
                {skydropxWebhooks.map((hook) => (
                  <div
                    key={`${hook.event}-${hook.when}`}
                    className="rounded-[8px] border border-[rgba(8,10,13,.12)] bg-[rgba(255,255,255,.92)] px-2 py-1.5 text-[11px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-black uppercase tracking-[0.08em] text-ink">{hook.event}</span>
                      <Badge label={hook.when} tone={hook.tone} />
                    </div>
                    <p className="mt-1 text-[rgba(8,10,13,.66)]">{hook.detail}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/92 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.58)]">
                Alertas y monitores
              </p>
              <div className="mt-2 grid gap-1.5">
                <div className="rounded-[8px] border border-[rgba(189,132,16,.26)] bg-[rgba(255,248,233,.96)] px-2 py-1.5 text-[11px] text-[rgb(124,91,13)]">
                  2 guías sin confirmación final mayor a 12h
                </div>
                <div className="rounded-[8px] border border-[rgba(5,122,168,.24)] bg-[rgba(241,248,254,.96)] px-2 py-1.5 text-[11px] text-[rgb(18,77,112)]">
                  Retries de webhook habilitados cada 5 minutos
                </div>
                <div className="rounded-[8px] border border-[rgba(26,130,76,.22)] bg-[rgba(239,250,244,.96)] px-2 py-1.5 text-[11px] text-[rgb(17,102,58)]">
                  Cola de eventos dentro de umbral operativo
                </div>
              </div>
            </article>
          </div>
        </section>

      </main>
      {isOpsModalOpen && selectedOrder ? (
        <DashboardModal
          open
          title={selectedOrder.email}
          subtitle="Pedido y flujo del pedido"
          onClose={() => setOpsModalOpen(false)}
          wide
          className="!w-[min(98vw,1860px)] !max-h-[96dvh]"
        >
            <div className="grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/90 px-2.5 py-2"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.56)]">Cliente</p><p className="mt-1 truncate text-[12px] font-semibold text-ink">{selectedOrder.email}</p></article>
                <article className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/90 px-2.5 py-2"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.56)]">Estado</p><p className="mt-1 text-[12px] font-semibold text-ink">{statusLabel(selectedOrder.status)}</p></article>
                <article className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/90 px-2.5 py-2"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.56)]">Fecha</p><p className="mt-1 text-[12px] font-semibold text-ink">{formatDateTime(selectedOrder.created_at)}</p></article>
                <article className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/90 px-2.5 py-2"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.56)]">Total</p><p className="mt-1 text-[12px] font-semibold text-charcoal">${money(selectedOrder.total_mxn)}</p></article>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {selectedOrder.items.map((item) => (
                  <OrderItemDetailCard key={item.id} item={item} visual={orderItemVisualById[item.id]} />
                ))}
              </div>

              <section className="mt-4 grid gap-4 xl:grid-cols-3">
                <article className="rounded-[18px] border border-[rgba(5,122,168,.22)] bg-[linear-gradient(180deg,rgba(242,249,253,.92),rgba(255,255,255,.92))] p-4 shadow-[0_12px_26px_rgba(18,47,92,.08)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgba(8,10,13,.56)]">Acción principal</p>
                  <h2 className="mt-1 text-[15px] font-black uppercase tracking-[0.06em]">Cambiar estado de pedido</h2>
                  <form onSubmit={submitForm("update-order-status", actions.updateOrderStatusAction, "Estado de pedido actualizado.", "No se pudo actualizar el estado del pedido.")} className="mt-3 space-y-3">
                    <FormErrorBag bag={errorBagByForm["update-order-status"] ?? null} />
                    <input type="hidden" name="order_id" value={selectedOrder.id} />
                    <div className="rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/82 p-2.5 text-[11px] text-[rgba(8,10,13,.74)]">
                      <p className="font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.58)]">Pedido abierto</p>
                      <p className="mt-1">{selectedOrder.items.length} prenda(s)</p>
                      <p className="mt-1">Total ${money(selectedOrder.total_mxn)}</p>
                    </div>
                    <SelectField id="order-status-value" name="status" required label="Nuevo estado" size="sm" value={selectedOrderStatus} onChange={(event) => setSelectedOrderStatus(event.target.value)} options={ORDER_STATUS_OPTIONS} />
                    <TextField id="order-status-reason" name="reason" label="Motivo" size="sm" placeholder="Motivo (opcional)" inputClassName="text-[12px]" />
                    <Button type="submit" size="sm" variant="blue" shadow="none">Actualizar estado</Button>
                  </form>
                </article>

                <article className="rounded-[18px] border border-[rgba(189,132,16,.24)] bg-[linear-gradient(180deg,rgba(255,250,241,.92),rgba(255,255,255,.92))] p-4 shadow-[0_12px_26px_rgba(18,47,92,.08)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgba(8,10,13,.56)]">Flujo del pedido</p>
                  <h2 className="mt-1 text-[15px] font-black uppercase tracking-[0.06em]">Estado actual y checklist</h2>
                  <form onSubmit={submitChecklistForm} className="mt-3 space-y-3">
                    <FormErrorBag bag={errorBagByForm["update-work-order-checklist"] ?? null} />
                    <input type="hidden" name="work_order_id" value={resolvedSelectedChecklistWorkOrderId} />
                    {selectedChecklistWorkOrder ? (
                      <div className="rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/82 p-2.5 text-[11px] text-[rgba(8,10,13,.74)]">
                        <p className="font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.58)]">
                          Estado actual: {statusLabel(selectedChecklistWorkOrder.status)}
                        </p>
                        <p className="mt-1">{selectedChecklistItem ? lineItemLabel(selectedChecklistItem.item) : "Sin prenda asociada"}</p>
                        <p className="mt-1">{checklistDoneCountFromState(checklistState)}/{CHECKLIST_STEPS.length} pasos</p>
                      </div>
                    ) : (
                      <p className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/84 px-3 py-2 text-[11px] text-[rgba(8,10,13,.62)]">No hay flujo del pedido disponible.</p>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {CHECKLIST_STEPS.map((step) => (
                        <Checkbox key={step.key} name={step.key} value="true" checked={checklistState[step.key]} onChange={(event) => updateChecklistStep(step.key, event.target.checked)} label={step.label} wrapperClassName="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/84 px-2.5 py-2 text-[11px] font-semibold" />
                      ))}
                    </div>
                    <TextField id="work-order-checklist-reason" name="reason" label="Motivo" size="sm" placeholder="Motivo (opcional)" inputClassName="text-[12px]" />
                    <Button type="submit" size="sm" variant="primary" shadow="none" fullWidth disabled={!resolvedSelectedChecklistWorkOrderId}>Actualizar flujo</Button>
                  </form>
                </article>

                <article className="rounded-[18px] border border-[rgba(151,31,51,.24)] bg-[linear-gradient(180deg,rgba(255,244,247,.92),rgba(255,255,255,.92))] p-4 shadow-[0_12px_26px_rgba(18,47,92,.08)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgba(8,10,13,.56)]">Acción sensible</p>
                  <h2 className="mt-1 text-[15px] font-black uppercase tracking-[0.06em]">Registrar merma</h2>
                  <form onSubmit={submitForm("register-merma", actions.registerMermaAction, "Merma registrada.", "No se pudo registrar la merma.")} className="mt-3 space-y-3">
                    <FormErrorBag bag={errorBagByForm["register-merma"] ?? null} />
                    <input type="hidden" name="work_order_id" value={resolvedSelectedMermaWorkOrderId} />
                    {selectedMermaWorkOrder ? (
                      <div className="rounded-[12px] border border-[rgba(8,10,13,.14)] bg-white/82 p-2.5 text-[11px] text-[rgba(8,10,13,.74)]">
                        <p className="font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.58)]">Flujo del pedido seleccionado</p>
                        <p className="mt-1">{statusLabel(selectedMermaWorkOrder.status)}</p>
                        <p className="mt-1">{selectedMermaItem ? lineItemLabel(selectedMermaItem.item) : "Sin prenda asociada"}</p>
                      </div>
                    ) : (
                      <p className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/84 px-3 py-2 text-[11px] text-[rgba(8,10,13,.62)]">No hay flujo del pedido disponible.</p>
                    )}
                    <TextField id="register-merma-reason-code" name="reason_code" label="Reason code" size="sm" required placeholder="reason_code (ej: dtf_failed)" inputClassName="text-[12px]" />
                    <p className="rounded-[10px] border border-[rgba(8,10,13,.14)] bg-white/84 px-3 py-2 text-[11px] text-[rgba(8,10,13,.66)]">{MERMA_REASON_CODE_TIP}</p>
                    <TextField id="register-merma-quantity" name="quantity" label="Cantidad" size="sm" type="number" min={1} required placeholder="Cantidad" inputClassName="text-[12px]" />
                    <TextField id="register-merma-notes" name="notes" label="Notas" size="sm" placeholder="Notas" inputClassName="text-[12px]" />
                    <Button type="submit" size="sm" variant="danger" shadow="none" fullWidth disabled={!resolvedSelectedMermaWorkOrderId}>Guardar merma</Button>
                  </form>
                </article>
              </section>
            </div>
        </DashboardModal>
      ) : null}
    </>
  );
}
