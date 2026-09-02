"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { Button, EmptyState, LoadingState, TextField } from "@/core/design-system";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import { PageFrame } from "@/core/layout/PageFrame";
import { requestJson } from "@/core/lib/api/fetcher";
import { getSession } from "@/modules/auth/client/session";
import {
  getOrder,
  lookupOrderByCode,
  updateLocalOrderAddress,
  type LocalAddressPayload,
  type OrderResponse,
} from "@/modules/commerce/client/api";
import {
  buildOrderCode,
  listLinkedOrders,
  migrateGuestLinkedOrdersToAccount,
  upsertLinkedOrder,
  type LinkedOrderRecord,
} from "@/modules/orders/client/storage";

type AddressDraft = LocalAddressPayload & {
  reason: string;
};

const TERMINAL_LOCAL_STATES = new Set(["out_for_delivery", "delivered", "failed"]);

function money(value: number): string {
  try {
    return value.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(value);
  }
}

function statusLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "waiting_design") return "Esperando diseño";
  if (normalized === "designed") return "Diseñado";
  if (normalized === "packed") return "Empaquetado";
  if (normalized === "shipped") return "Enviado";
  if (normalized === "out_for_delivery") return "En reparto";
  if (normalized === "delivered") return "Entregado";
  if (normalized === "failed") return "Fallida";
  return value;
}

function normalizeOrderCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-f0-9]/g, "").slice(0, 8);
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseAddress(order: OrderResponse): LocalAddressPayload {
  const raw = order.address ?? {};
  const source = raw as Record<string, unknown>;
  return {
    line1: safeText(source.line1),
    line2: safeText(source.line2) || undefined,
    city: safeText(source.city),
    state: safeText(source.state),
    postal_code: safeText(source.postal_code),
    country: safeText(source.country) || "MX",
    reference: safeText(source.reference) || undefined,
  };
}

function canEditLocalAddress(order: OrderResponse): boolean {
  if (order.shipping_method !== "local") return false;
  return !TERMINAL_LOCAL_STATES.has(order.status);
}

function withReason(draft: AddressDraft): { address: LocalAddressPayload; reason?: string } {
  const reason = draft.reason.trim();
  return {
    address: {
      line1: draft.line1.trim(),
      line2: draft.line2?.trim() || undefined,
      city: draft.city.trim(),
      state: draft.state.trim(),
      postal_code: draft.postal_code.trim(),
      country: draft.country?.trim() || "MX",
      reference: draft.reference?.trim() || undefined,
    },
    reason: reason.length > 0 ? reason : undefined,
  };
}

function OrdersExperienceContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const focusOrderId = searchParams.get("order");

  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [records, setRecords] = React.useState<LinkedOrderRecord[]>([]);
  const [ordersById, setOrdersById] = React.useState<Record<string, OrderResponse>>({});
  const [loadingOrders, setLoadingOrders] = React.useState(false);

  const [linkEmail, setLinkEmail] = React.useState("");
  const [linkCode, setLinkCode] = React.useState("");
  const [linking, setLinking] = React.useState(false);
  const [editingOrderId, setEditingOrderId] = React.useState<string | null>(null);
  const [addressDraft, setAddressDraft] = React.useState<AddressDraft | null>(null);
  const [savingAddress, setSavingAddress] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error, toast]);

  React.useEffect(() => {
    if (!message) return;
    toast.success(message);
  }, [message, toast]);

  const reloadLinkedOrders = React.useCallback((nextAccountId: string | null) => {
    setRecords(listLinkedOrders(nextAccountId));
  }, []);

  React.useEffect(() => {
    const refreshAuth = () => {
      const session = getSession();
      const nextAccountId = session?.accountId ?? null;
      setAccountId(nextAccountId);

      if (nextAccountId) {
        migrateGuestLinkedOrdersToAccount(nextAccountId);
      }
      reloadLinkedOrders(nextAccountId);

      if (session?.email) {
        setLinkEmail(session.email);
      }
    };

    refreshAuth();
    window.addEventListener("saut:auth", refreshAuth);
    return () => window.removeEventListener("saut:auth", refreshAuth);
  }, [reloadLinkedOrders]);

  React.useEffect(() => {
    if (linkEmail.trim().length > 0) return;
    void requestJson<{ primary_email?: string }>("/api/auth/me", { cache: "no-store" })
      .then((payload) => {
        const nextEmail = payload?.primary_email?.trim();
        if (nextEmail) {
          setLinkEmail(nextEmail);
        }
      })
      .catch(() => {
        // ignore for guests
      });
  }, [linkEmail]);

  React.useEffect(() => {
    let cancelled = false;
    if (records.length === 0) {
      queueMicrotask(() => { if (!cancelled) setOrdersById({}); });
      return () => { cancelled = true; };
    }

    queueMicrotask(() => {
      if (cancelled) return;
      setLoadingOrders(true);
      setError(null);
    });
    void Promise.all(
      records.map(async (record) => {
        try {
          const order = await getOrder(record.order_id, record.order_access_token);
          return { ok: true as const, order };
        } catch (err) {
          return {
            ok: false as const,
            orderId: record.order_id,
            message: err instanceof Error ? err.message : "No se pudo cargar pedido.",
          };
        }
      })
    )
      .then((results) => {
        if (cancelled) return;
        const nextMap: Record<string, OrderResponse> = {};
        for (const row of results) {
          if (row.ok) {
            nextMap[row.order.id] = row.order;
          }
        }
        setOrdersById(nextMap);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrders(false);
      });

    return () => {
      cancelled = true;
    };
  }, [records]);

  React.useEffect(() => {
    if (!focusOrderId || records.some((record) => record.order_id === focusOrderId)) {
      return;
    }

    void getOrder(focusOrderId)
      .then((order) => {
        upsertLinkedOrder({
          order_id: order.id,
          order_code: buildOrderCode(order.id),
          email: order.email,
          account_id: accountId,
          status: order.status,
          shipping_method: order.shipping_method,
          tracking_number: order.tracking_number ?? null,
          total_mxn: order.total_mxn,
        });
        reloadLinkedOrders(accountId);
      })
      .catch(() => {
        // if query includes stale order id just ignore and keep UI usable
      });
  }, [accountId, focusOrderId, records, reloadLinkedOrders]);

  const sortedOrders = React.useMemo(() => {
    return [...records]
      .map((record) => ordersById[record.order_id])
      .filter((order): order is OrderResponse => Boolean(order))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [ordersById, records]);

  const handleLinkOrder = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLinking(true);
      setError(null);
      setMessage(null);

      try {
        if (!accountId) {
          throw new Error("Inicia sesión con el correo usado en la compra para ligar un pedido.");
        }
        const email = linkEmail.trim().toLowerCase();
        const code = normalizeOrderCode(linkCode);
        if (!email) {
          throw new Error("Correo es obligatorio para ligar pedido.");
        }
        if (code.length !== 8) {
          throw new Error("El codigo de pedido debe tener 8 caracteres hex.");
        }

        const lookup = await lookupOrderByCode({ email, order_code: code });
        const order = await getOrder(lookup.id);

        upsertLinkedOrder({
          order_id: order.id,
          order_code: lookup.order_code || buildOrderCode(order.id),
          email: order.email,
          account_id: accountId,
          status: order.status,
          shipping_method: order.shipping_method,
          tracking_number: order.tracking_number ?? null,
          total_mxn: order.total_mxn,
        });

        reloadLinkedOrders(accountId);
        setLinkCode("");
        setMessage(`Pedido ${order.id} ligado correctamente.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo ligar pedido.");
      } finally {
        setLinking(false);
      }
    },
    [accountId, linkCode, linkEmail, reloadLinkedOrders]
  );

  const handleStartEditAddress = React.useCallback((order: OrderResponse) => {
    const address = parseAddress(order);
    setEditingOrderId(order.id);
    setAddressDraft({
      ...address,
      reason: "",
    });
    setError(null);
    setMessage(null);
  }, []);

  const handleSaveAddress = React.useCallback(async () => {
    if (!editingOrderId || !addressDraft) return;

    setSavingAddress(true);
    setError(null);
    setMessage(null);
    try {
      const orderAccessToken = records.find((record) => record.order_id === editingOrderId)?.order_access_token;
      await updateLocalOrderAddress(editingOrderId, withReason(addressDraft), orderAccessToken);
      const refreshed = await getOrder(editingOrderId, orderAccessToken);

      setOrdersById((prev) => ({ ...prev, [refreshed.id]: refreshed }));
      upsertLinkedOrder({
        order_id: refreshed.id,
        order_code: buildOrderCode(refreshed.id),
        email: refreshed.email,
        account_id: accountId,
        status: refreshed.status,
        shipping_method: refreshed.shipping_method,
        tracking_number: refreshed.tracking_number ?? null,
        total_mxn: refreshed.total_mxn,
      });

      reloadLinkedOrders(accountId);
      setEditingOrderId(null);
      setAddressDraft(null);
      setMessage("Direccion local actualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar direccion.");
    } finally {
      setSavingAddress(false);
    }
  }, [accountId, addressDraft, editingOrderId, records, reloadLinkedOrders]);

  return (
    <PageFrame>
      <section className="mx-auto max-w-6xl space-y-5">
        <article className="rounded-[22px] border border-hairline bg-[rgba(255,255,255,.45)] p-5 sm:p-6">
          <h1 className="text-[24px] font-black uppercase tracking-[0.06em] text-ink">
            Mis pedidos
          </h1>
          <p className="mt-1 text-[12px] text-mute">
            Rastrea estados, tracking y liga pedidos a tu cuenta.
          </p>

          <form onSubmit={handleLinkOrder} className="mt-4 grid gap-2 sm:grid-cols-4">
            <TextField label="Correo" labelClassName="sr-only" value={linkEmail} onChange={(event) => setLinkEmail(event.target.value)} placeholder="Correo" size="sm" wrapperClassName="sm:col-span-2" inputClassName="text-[12px]" />
            <TextField label="Código de pedido" labelClassName="sr-only" value={linkCode} onChange={(event) => setLinkCode(normalizeOrderCode(event.target.value))} placeholder="Codigo pedido (8 chars)" size="sm" inputClassName="font-mono text-[12px]" />
            <Button
              type="submit"
              disabled={linking}
              size="sm" variant="primary" shadow="none" isLoading={linking} className="text-[10px]"
            >
              {linking ? "Ligando..." : "Ligar pedido"}
            </Button>
          </form>

          <div className="mt-2 text-[11px] text-mute">
            Inicia sesión con el correo usado en la compra y usa el código de pedido para ligarlo.
          </div>
        </article>

        {error ? (
          <div className="rounded-[12px] border border-[rgba(168,43,43,.38)] bg-[rgba(168,43,43,.12)] px-3 py-2 text-[12px] text-[rgb(110,24,24)]">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[12px] border border-[rgba(12,128,175,.3)] bg-[rgba(12,128,175,.12)] px-3 py-2 text-[12px] text-charcoal">
            {message}
          </div>
        ) : null}

        {loadingOrders ? <LoadingState title="Cargando pedidos..." className="rounded-[20px] border border-hairline bg-[rgba(255,255,255,.45)] p-4 text-[12px] text-mute" /> : null}

        {!loadingOrders && sortedOrders.length === 0 ? <EmptyState title="No hay pedidos ligados todavía" description={<>Puedes ligar uno con correo + código o comprar desde <Link href="/catalogo" className="font-black text-charcoal">catálogo</Link>.</>} className="rounded-[20px] border border-hairline bg-[rgba(255,255,255,.45)] p-5 text-[12px] text-mute" /> : null}

        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const isFocused = focusOrderId === order.id;
            const localEditable = canEditLocalAddress(order);
            const isEditing = editingOrderId === order.id;

            return (
              <article
                key={order.id}
                className={[
                  "rounded-[20px] border bg-[rgba(255,255,255,.45)] p-4",
                  isFocused
                    ? "border-[rgba(12,128,175,.42)] shadow-[0_0_0_2px_rgba(12,128,175,.14)]"
                    : "border-hairline",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-mute">
                      Pedido
                    </p>
                    <p className="mt-1 font-mono text-[12px]">{order.id}</p>
                    <p className="mt-1 text-[11px] uppercase">
                      Estado: <span className="font-black">{statusLabel(order.status)}</span>
                    </p>
                  </div>
                  <div className="text-right text-[11px]">
                    <p>
                      {new Date(order.created_at).toLocaleString("es-MX")}
                    </p>
                    <p className="mt-1 font-black">${money(order.total_mxn)}</p>
                    <p className="mt-1 uppercase">{order.shipping_method}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] border border-hairline bg-white/80 p-3 text-[11px]">
                    <p className="font-black uppercase tracking-[0.12em]">Tracking</p>
                    <p className="mt-1 font-mono">{order.tracking_number ?? "Pendiente"}</p>
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-charcoal underline"
                      >
                        Ver tracking
                      </a>
                    ) : null}
                  </div>

                  <div className="rounded-[12px] border border-hairline bg-white/80 p-3 text-[11px]">
                    <p className="font-black uppercase tracking-[0.12em]">Direccion</p>
                    <p className="mt-1">{safeText((order.address as Record<string, unknown>).line1)}</p>
                    <p>
                      {safeText((order.address as Record<string, unknown>).city)},{" "}
                      {safeText((order.address as Record<string, unknown>).state)}{" "}
                      {safeText((order.address as Record<string, unknown>).postal_code)}
                    </p>
                  </div>
                </div>

                {localEditable ? (
                  <div className="mt-3">
                    {!isEditing ? (
                      <Button
                        type="button"
                        onClick={() => handleStartEditAddress(order)}
                        size="sm" variant="blue" shadow="none" className="rounded-[999px] text-[10px]"
                      >
                        Cambiar direccion local
                      </Button>
                    ) : (
                      <div className="space-y-2 rounded-[14px] border border-hairline bg-white/85 p-3 text-[11px]">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <TextField
                            label="Línea 1" labelClassName="sr-only" size="sm"
                            value={addressDraft?.line1 ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, line1: event.target.value } : prev
                              )
                            }
                            placeholder="Linea 1" inputClassName="text-[12px]"
                          />
                          <TextField
                            label="Línea 2" labelClassName="sr-only" size="sm"
                            value={addressDraft?.line2 ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, line2: event.target.value } : prev
                              )
                            }
                            placeholder="Linea 2" inputClassName="text-[12px]"
                          />
                          <TextField
                            label="Ciudad" labelClassName="sr-only" size="sm"
                            value={addressDraft?.city ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, city: event.target.value } : prev
                              )
                            }
                            placeholder="Ciudad" inputClassName="text-[12px]"
                          />
                          <TextField
                            label="Estado" labelClassName="sr-only" size="sm"
                            value={addressDraft?.state ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, state: event.target.value } : prev
                              )
                            }
                            placeholder="Estado" inputClassName="text-[12px]"
                          />
                          <TextField
                            label="Código postal" labelClassName="sr-only" size="sm"
                            value={addressDraft?.postal_code ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, postal_code: event.target.value } : prev
                              )
                            }
                            placeholder="Codigo postal" inputClassName="text-[12px]"
                          />
                          <TextField
                            label="Referencia" labelClassName="sr-only" size="sm"
                            value={addressDraft?.reference ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, reference: event.target.value } : prev
                              )
                            }
                            placeholder="Referencia" inputClassName="text-[12px]"
                          />
                          <TextField
                            label="País" labelClassName="sr-only" size="sm"
                            value={addressDraft?.country ?? "MX"}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, country: event.target.value } : prev
                              )
                            }
                            placeholder="Pais" inputClassName="text-[12px]"
                          />
                          <TextField
                            label="Motivo" labelClassName="sr-only" size="sm"
                            value={addressDraft?.reason ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, reason: event.target.value } : prev
                              )
                            }
                            placeholder="Motivo (opcional)" inputClassName="text-[12px]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={() => void handleSaveAddress()}
                            disabled={savingAddress}
                            size="sm" variant="primary" shadow="none" isLoading={savingAddress} className="rounded-[999px] text-[10px]"
                          >
                            {savingAddress ? "Guardando..." : "Guardar direccion"}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setEditingOrderId(null);
                              setAddressDraft(null);
                            }}
                            size="sm" variant="outline" shadow="none" className="rounded-[999px] text-[10px]"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mt-3 rounded-[12px] border border-hairline bg-white/80 p-3 text-[11px]">
                  <p className="font-black uppercase tracking-[0.12em]">Items</p>
                  <ul className="mt-2 space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2">
                        <span>
                          {item.garment_model || item.garment_type} · {item.color} ·{" "}
                          {item.size.toUpperCase()} · {item.grammage_g}g
                        </span>
                        <span className="font-black">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PageFrame>
  );
}

export function OrdersExperience() {
  return (
    <React.Suspense fallback={<div className="min-h-[32vh]" />}>
      <OrdersExperienceContent />
    </React.Suspense>
  );
}
