"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button, SelectField, TextField } from "@/core/design-system";
import { FormErrorBag } from "@/core/design-system/feedback/FormErrorBag";
import { toFormErrorBag, type FormErrorBag as FormErrorBagState } from "@/core/design-system/feedback/form-errors";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import { PageFrame } from "@/core/layout/PageFrame";
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
    <PageFrame>
      <section className="rounded-[22px] border border-hairline bg-[rgba(255,255,255,.38)] p-5 sm:p-6">
        <h1 className="text-[24px] sm:text-[30px] font-black uppercase tracking-[0.04em] text-ink">
          Envios Nacional y Local
        </h1>
        <p className="mt-2 text-[12px] text-[rgba(8,10,13,.7)]">
          VS3 y VS4: tracking obligatorio nacional, reparto local y cambio de direccion validado.
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-ink">
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
            <TextField name="order_id" label="Order ID" labelClassName="sr-only" required placeholder="order_id nacional" size="sm" inputClassName="font-mono text-[12px]" />
            <SelectField name="printing_format" label="Formato de impresión" labelClassName="sr-only" defaultValue="standard" size="sm" options={[{ value: "standard", label: "standard" }, { value: "thermal", label: "thermal" }]} />
            <TextField name="package_type" label="Tipo de paquete" labelClassName="sr-only" placeholder="package_type (opcional)" size="sm" />
            <TextField name="consignment_note" label="Nota de consignación" labelClassName="sr-only" placeholder="consignment_note (opcional)" size="sm" />
            <TextField name="declared_value" label="Valor declarado" labelClassName="sr-only" type="number" min={0} step="0.01" placeholder="declared_value (opcional)" size="sm" />
            <Button
              type="submit"
              size="sm" fullWidth variant="blue" shadow="none" className="text-[10px]"
            >
              Crear envio nacional
            </Button>
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
            <TextField name="order_id" label="Order ID" labelClassName="sr-only" required placeholder="order_id para refrescar tracking" size="sm" inputClassName="font-mono text-[12px]" />
            <Button
              type="submit"
              size="sm" fullWidth variant="outline" shadow="none" className="text-[10px]"
            >
              Refrescar tracking
            </Button>
          </form>
        </article>

        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-ink">
            Local: ready, reparto, entrega/fallida
          </p>
          <form onSubmit={submitLocalStatusForm} className="mt-3 grid gap-2 sm:grid-cols-2">
            <FormErrorBag bag={errorBagByForm["update-local-status"] ?? null} className="sm:col-span-2" />
            <TextField name="order_id" label="Order ID" labelClassName="sr-only" required placeholder="order_id local" size="sm" wrapperClassName="sm:col-span-2" inputClassName="font-mono text-[12px]" />
            <TextField name="route_date" label="Fecha de ruta" labelClassName="sr-only" type="date" defaultValue={routeDate} size="sm" wrapperClassName="sm:col-span-2" />
            <Button
              type="submit"
              name="local_action"
              value="ready"
              size="sm" variant="blue" shadow="none" className="text-[10px]"
            >
              Marcar listo
            </Button>
            <Button
              type="submit"
              name="local_action"
              value="out_for_delivery"
              size="sm" variant="primary" shadow="none" className="text-[10px]"
            >
              En reparto
            </Button>
            <TextField name="photo_url" label="Foto" labelClassName="sr-only" placeholder="photo_url (opcional)" size="sm" wrapperClassName="sm:col-span-2" />
            <TextField name="notes" label="Notas" labelClassName="sr-only" placeholder="notas (opcional)" size="sm" wrapperClassName="sm:col-span-2" />
            <Button
              type="submit"
              name="local_action"
              value="delivered"
              size="sm" variant="outline" shadow="none" className="text-[10px] border-[rgba(22,130,80,.3)] text-[rgb(20,100,66)]"
            >
              Entregado
            </Button>
            <Button
              type="submit"
              name="local_action"
              value="failed"
              size="sm" variant="danger" shadow="none" className="text-[10px]"
            >
              Fallida 1/1
            </Button>
          </form>
        </article>
      </section>

      <section className="mt-6 rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-ink">
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
          <TextField name="order_id" label="Order ID" labelClassName="sr-only" required placeholder="order_id local" size="sm" wrapperClassName="md:col-span-3" inputClassName="font-mono text-[12px]" />
          <TextField name="line1" label="Calle y número" labelClassName="sr-only" required placeholder="line1" size="sm" wrapperClassName="md:col-span-2" />
          <TextField name="line2" label="Complemento" labelClassName="sr-only" placeholder="line2" size="sm" />
          <TextField name="city" label="Ciudad" labelClassName="sr-only" required placeholder="city" size="sm" />
          <TextField name="state" label="Estado" labelClassName="sr-only" required placeholder="state" size="sm" />
          <TextField name="postal_code" label="Código postal" labelClassName="sr-only" required placeholder="postal_code" size="sm" />
          <TextField name="country" label="País" labelClassName="sr-only" defaultValue="MX" placeholder="country" size="sm" />
          <TextField name="reference" label="Referencia" labelClassName="sr-only" placeholder="reference" size="sm" />
          <TextField name="reason" label="Motivo" labelClassName="sr-only" placeholder="reason" size="sm" />
          <Button type="submit" size="sm" variant="outline" shadow="none" className="text-[10px] md:col-span-3">
            Actualizar direccion local
          </Button>
        </form>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-ink">
            Pedidos nacionales recientes ({nationalOrders.total})
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-hairline">
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
          <p className="mt-4 text-[12px] font-black uppercase tracking-[0.12em] text-ink">
            Shipments nacionales ({nationalShipments.total})
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-hairline">
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

        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-ink">
            Ruta local del dia
          </p>
          <p className="mt-1 text-[11px] text-[rgba(8,10,13,.65)]">
            Fecha: {route?.date ?? routeDate} | Stops: {route?.total ?? 0}
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-hairline">
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
            <pre className="mt-3 max-h-[220px] overflow-auto rounded-[10px] border border-hairline bg-white/80 p-2 text-[10px] whitespace-pre-wrap">
              {route.printable_text}
            </pre>
          ) : null}
          <p className="mt-3 text-[12px] font-black uppercase tracking-[0.12em] text-ink">
            Pedidos locales recientes ({localOrders.total})
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-hairline">
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
          <p className="mt-4 text-[12px] font-black uppercase tracking-[0.12em] text-ink">
            Shipments locales ({localShipments.total})
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-hairline">
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
    </PageFrame>
  );
}
