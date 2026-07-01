"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { FormErrorBag } from "@/core/design-system/feedback/FormErrorBag";
import { toFormErrorBag, type FormErrorBag as FormErrorBagState } from "@/core/design-system/feedback/form-errors";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import type { PaginatedOrders } from "@/modules/dashboard/orders/server/api";
import type { LocalRouteTodayResponse, PaginatedAdminShipments } from "@/modules/dashboard/shipping/server/api";

type ServerAction = (formData: FormData) => Promise<void>;

type EnviosActions = {
  createNationalShipmentAction: ServerAction;
  refreshNationalTrackingAction: ServerAction;
  markLocalReadyAction: ServerAction;
  markLocalOutForDeliveryAction: ServerAction;
  markLocalDeliveredAction: ServerAction;
  markLocalFailedAction: ServerAction;
  updateLocalAddressAction: ServerAction;
};

type EnviosDashboardClientProps = {
  routeDate: string;
  route: LocalRouteTodayResponse | null;
  nationalOrders: PaginatedOrders;
  localOrders: PaginatedOrders;
  nationalShipments: PaginatedAdminShipments;
  localShipments: PaginatedAdminShipments;
  actions: EnviosActions;
};

type EnviosFormKey =
  | "create-national-shipment"
  | "refresh-national-tracking"
  | "update-local-status"
  | "update-local-address";

export function EnviosDashboardClient({
  routeDate,
  route,
  nationalOrders,
  localOrders,
  nationalShipments,
  localShipments,
  actions,
}: EnviosDashboardClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [errorBagByForm, setErrorBagByForm] = useState<
    Partial<Record<EnviosFormKey, FormErrorBagState>>
  >({});

  const setFormErrorBag = (formKey: EnviosFormKey, bag: FormErrorBagState | null) => {
    setErrorBagByForm((previous) => {
      const next = { ...previous };
      if (!bag) {
        delete next[formKey];
      } else {
        next[formKey] = bag;
      }
      return next;
    });
  };

  const runAction = async (
    formKey: EnviosFormKey,
    action: ServerAction,
    formData: FormData,
    successMessage: string,
    fallbackError: string
  ) => {
    setFormErrorBag(formKey, null);
    try {
      await action(formData);
      setFormErrorBag(formKey, null);
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
      formKey: EnviosFormKey,
      action: ServerAction,
      successMessage: string,
      fallbackError: string
    ) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await runAction(formKey, action, formData, successMessage, fallbackError);
    };

  const submitLocalStatusForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const localAction = String(formData.get("local_action") ?? "ready");

    if (localAction === "out_for_delivery") {
      await runAction(
        "update-local-status",
        actions.markLocalOutForDeliveryAction,
        formData,
        "Pedido local marcado en reparto.",
        "No se pudo actualizar el estado de reparto local."
      );
      return;
    }

    if (localAction === "delivered") {
      await runAction(
        "update-local-status",
        actions.markLocalDeliveredAction,
        formData,
        "Pedido local marcado como entregado.",
        "No se pudo marcar como entregado."
      );
      return;
    }

    if (localAction === "failed") {
      await runAction(
        "update-local-status",
        actions.markLocalFailedAction,
        formData,
        "Pedido local marcado como fallido.",
        "No se pudo marcar como fallido."
      );
      return;
    }

    await runAction(
      "update-local-status",
      actions.markLocalReadyAction,
      formData,
      "Pedido local marcado como listo.",
      "No se pudo marcar el pedido local como listo."
    );
  };

  return (
    <main className="w-full px-4 py-8 sm:px-8 lg:px-14">
      <section className="rounded-[22px] border border-(--border) bg-[rgba(255,255,255,.38)] p-5 sm:p-6">
        <h1 className="text-[24px] sm:text-[30px] font-black uppercase tracking-[0.04em] text-(--text)">
          Envios Nacional y Local
        </h1>
        <p className="mt-2 text-[12px] text-[rgba(8,10,13,.7)]">
          VS3 y VS4: tracking obligatorio nacional, reparto local y cambio de direccion validado.
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-(--text)">
            Nacional: crear shipment y tracking
          </p>
          <form
            onSubmit={submitForm(
              "create-national-shipment",
              actions.createNationalShipmentAction,
              "Envio nacional creado correctamente.",
              "No se pudo crear el envio nacional."
            )}
            className="mt-3 space-y-2"
          >
            <FormErrorBag bag={errorBagByForm["create-national-shipment"] ?? null} />
            <input
              name="order_id"
              required
              placeholder="order_id nacional"
              className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] font-mono"
            />
            <select
              name="printing_format"
              defaultValue="standard"
              className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]"
            >
              <option value="standard">standard</option>
              <option value="thermal">thermal</option>
            </select>
            <input
              name="package_type"
              placeholder="package_type (opcional)"
              className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]"
            />
            <input
              name="consignment_note"
              placeholder="consignment_note (opcional)"
              className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]"
            />
            <input
              name="declared_value"
              type="number"
              min={0}
              step="0.01"
              placeholder="declared_value (opcional)"
              className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]"
            />
            <button
              type="submit"
              className="h-10 w-full rounded-[10px] bg-(--saut-blue) px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white"
            >
              Crear envio nacional
            </button>
          </form>

          <form
            onSubmit={submitForm(
              "refresh-national-tracking",
              actions.refreshNationalTrackingAction,
              "Tracking nacional refrescado.",
              "No se pudo refrescar el tracking nacional."
            )}
            className="mt-3 space-y-2"
          >
            <FormErrorBag bag={errorBagByForm["refresh-national-tracking"] ?? null} />
            <input
              name="order_id"
              required
              placeholder="order_id para refrescar tracking"
              className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] font-mono"
            />
            <button
              type="submit"
              className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[10px] font-black uppercase tracking-[0.12em]"
            >
              Refrescar tracking
            </button>
          </form>
        </article>

        <article className="rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-(--text)">
            Local: ready, reparto, entrega/fallida
          </p>
          <form onSubmit={submitLocalStatusForm} className="mt-3 grid gap-2 sm:grid-cols-2">
            <FormErrorBag bag={errorBagByForm["update-local-status"] ?? null} className="sm:col-span-2" />
            <input
              name="order_id"
              required
              placeholder="order_id local"
              className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] font-mono sm:col-span-2"
            />
            <input
              name="route_date"
              type="date"
              defaultValue={routeDate}
              className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] sm:col-span-2"
            />
            <button
              type="submit"
              name="local_action"
              value="ready"
              className="h-10 rounded-[10px] bg-[rgba(12,128,175,.14)] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-(--saut-navy)"
            >
              Marcar listo
            </button>
            <button
              type="submit"
              name="local_action"
              value="out_for_delivery"
              className="h-10 rounded-[10px] bg-(--saut-yellow) px-3 text-[10px] font-black uppercase tracking-[0.12em]"
            >
              En reparto
            </button>
            <input
              name="photo_url"
              placeholder="photo_url (opcional)"
              className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] sm:col-span-2"
            />
            <input
              name="notes"
              placeholder="notas (opcional)"
              className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] sm:col-span-2"
            />
            <button
              type="submit"
              name="local_action"
              value="delivered"
              className="h-10 rounded-[10px] bg-[rgba(22,130,80,.14)] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(20,100,66)]"
            >
              Entregado
            </button>
            <button
              type="submit"
              name="local_action"
              value="failed"
              className="h-10 rounded-[10px] bg-[rgba(168,43,43,.14)] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(120,24,24)]"
            >
              Fallida 1/1
            </button>
          </form>
        </article>
      </section>

      <section className="mt-6 rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-(--text)">
          Cambio direccion local (solo antes de en reparto)
        </p>
        <form
          onSubmit={submitForm(
            "update-local-address",
            actions.updateLocalAddressAction,
            "Direccion local actualizada.",
            "No se pudo actualizar la direccion local."
          )}
          className="mt-3 grid gap-2 md:grid-cols-3"
        >
          <FormErrorBag bag={errorBagByForm["update-local-address"] ?? null} className="md:col-span-3" />
          <input name="order_id" required placeholder="order_id local" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] font-mono md:col-span-3" />
          <input name="line1" required placeholder="line1" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] md:col-span-2" />
          <input name="line2" placeholder="line2" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
          <input name="city" required placeholder="city" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
          <input name="state" required placeholder="state" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
          <input name="postal_code" required placeholder="postal_code" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
          <input name="country" defaultValue="MX" placeholder="country" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
          <input name="reference" placeholder="reference" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
          <input name="reason" placeholder="reason" className="h-10 rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
          <button type="submit" className="h-10 rounded-[10px] border border-(--border) bg-white/90 px-3 text-[10px] font-black uppercase tracking-[0.12em] md:col-span-3">
            Actualizar direccion local
          </button>
        </form>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-(--text)">
            Pedidos nacionales recientes ({nationalOrders.total})
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-(--border)">
                  <th className="px-2 py-2">Order ID</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Tracking</th>
                  <th className="px-2 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {nationalOrders.items.map((order) => (
                  <tr key={order.id} className="border-b border-[rgba(0,0,0,.06)]">
                    <td className="px-2 py-2 font-mono">{order.id}</td>
                    <td className="px-2 py-2 uppercase">{order.status}</td>
                    <td className="px-2 py-2 font-mono">{order.tracking_number ?? "-"}</td>
                    <td className="px-2 py-2">{order.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12px] font-black uppercase tracking-[0.12em] text-(--text)">
            Shipments nacionales ({nationalShipments.total})
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-(--border)">
                  <th className="px-2 py-2">Shipment ID</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Tracking</th>
                  <th className="px-2 py-2">Carrier</th>
                </tr>
              </thead>
              <tbody>
                {nationalShipments.items.map(({ shipment }) => (
                  <tr key={shipment.id} className="border-b border-[rgba(0,0,0,.06)]">
                    <td className="px-2 py-2 font-mono">{shipment.id}</td>
                    <td className="px-2 py-2 uppercase">{shipment.status}</td>
                    <td className="px-2 py-2 font-mono">{shipment.tracking_number ?? "-"}</td>
                    <td className="px-2 py-2">{shipment.tracking_carrier ?? shipment.provider ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-(--text)">
            Ruta local del dia
          </p>
          <p className="mt-1 text-[11px] text-[rgba(8,10,13,.65)]">
            Fecha: {route?.date ?? routeDate} | Stops: {route?.total ?? 0}
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-(--border)">
                  <th className="px-2 py-2">Order ID</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Cliente</th>
                  <th className="px-2 py-2">Direccion</th>
                </tr>
              </thead>
              <tbody>
                {(route?.stops ?? []).map((stop) => (
                  <tr key={stop.shipment_id} className="border-b border-[rgba(0,0,0,.06)]">
                    <td className="px-2 py-2 font-mono">{stop.order_id}</td>
                    <td className="px-2 py-2 uppercase">{stop.status}</td>
                    <td className="px-2 py-2">{stop.email}</td>
                    <td className="px-2 py-2">{stop.address.line1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {route?.printable_text ? (
            <pre className="mt-3 max-h-[220px] overflow-auto rounded-[10px] border border-(--border) bg-white/80 p-2 text-[10px] whitespace-pre-wrap">
              {route.printable_text}
            </pre>
          ) : null}
          <p className="mt-3 text-[12px] font-black uppercase tracking-[0.12em] text-(--text)">
            Pedidos locales recientes ({localOrders.total})
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-(--border)">
                  <th className="px-2 py-2">Order ID</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {localOrders.items.map((order) => (
                  <tr key={order.id} className="border-b border-[rgba(0,0,0,.06)]">
                    <td className="px-2 py-2 font-mono">{order.id}</td>
                    <td className="px-2 py-2 uppercase">{order.status}</td>
                    <td className="px-2 py-2">{order.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12px] font-black uppercase tracking-[0.12em] text-(--text)">
            Shipments locales ({localShipments.total})
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-(--border)">
                  <th className="px-2 py-2">Shipment ID</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Intentos</th>
                  <th className="px-2 py-2">Direccion</th>
                </tr>
              </thead>
              <tbody>
                {localShipments.items.map(({ shipment, order }) => (
                  <tr key={shipment.id} className="border-b border-[rgba(0,0,0,.06)]">
                    <td className="px-2 py-2 font-mono">{shipment.id}</td>
                    <td className="px-2 py-2 uppercase">{shipment.status}</td>
                    <td className="px-2 py-2">{shipment.failed_attempts}</td>
                    <td className="px-2 py-2">{order.address.line1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
