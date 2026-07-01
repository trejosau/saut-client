"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { useToast } from "@/core/design-system/feedback/ToastHost";
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
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { primary_email?: string } | null) => {
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
      setOrdersById({});
      return;
    }

    setLoadingOrders(true);
    setError(null);
    void Promise.all(
      records.map(async (record) => {
        try {
          const order = await getOrder(record.order_id);
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
      await updateLocalOrderAddress(editingOrderId, withReason(addressDraft));
      const refreshed = await getOrder(editingOrderId);

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
  }, [accountId, addressDraft, editingOrderId, reloadLinkedOrders]);

  return (
    <main className="w-full px-4 py-8 sm:px-8 lg:px-14">
      <section className="mx-auto max-w-6xl space-y-5">
        <article className="rounded-[22px] border border-(--border) bg-[rgba(255,255,255,.45)] p-5 sm:p-6">
          <h1 className="text-[24px] font-black uppercase tracking-[0.06em] text-(--text)">
            Mis pedidos
          </h1>
          <p className="mt-1 text-[12px] text-(--muted)">
            Rastrea estados, tracking y liga pedidos de invitado con codigo.
          </p>

          <form onSubmit={handleLinkOrder} className="mt-4 grid gap-2 sm:grid-cols-4">
            <input
              value={linkEmail}
              onChange={(event) => setLinkEmail(event.target.value)}
              placeholder="Correo"
              className="h-10 rounded-[12px] border border-(--border) bg-white/85 px-3 text-[12px] sm:col-span-2"
            />
            <input
              value={linkCode}
              onChange={(event) => setLinkCode(normalizeOrderCode(event.target.value))}
              placeholder="Codigo pedido (8 chars)"
              className="h-10 rounded-[12px] border border-(--border) bg-white/85 px-3 text-[12px] font-mono"
            />
            <button
              type="submit"
              disabled={linking}
              className="h-10 rounded-[12px] border border-(--border) bg-(--saut-yellow) px-3 text-[10px] font-black uppercase tracking-[0.12em] text-(--saut-black) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {linking ? "Ligando..." : "Ligar pedido"}
            </button>
          </form>

          <div className="mt-2 text-[11px] text-(--muted)">
            Si compraste como invitado: usa correo + los primeros 8 caracteres del UUID.
          </div>
        </article>

        {error ? (
          <div className="rounded-[12px] border border-[rgba(168,43,43,.38)] bg-[rgba(168,43,43,.12)] px-3 py-2 text-[12px] text-[rgb(110,24,24)]">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[12px] border border-[rgba(12,128,175,.3)] bg-[rgba(12,128,175,.12)] px-3 py-2 text-[12px] text-(--saut-navy)">
            {message}
          </div>
        ) : null}

        {loadingOrders ? (
          <article className="rounded-[20px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4 text-[12px] text-(--muted)">
            Cargando pedidos...
          </article>
        ) : null}

        {!loadingOrders && sortedOrders.length === 0 ? (
          <article className="rounded-[20px] border border-(--border) bg-[rgba(255,255,255,.45)] p-5 text-[12px] text-(--muted)">
            No hay pedidos ligados todavia. Puedes ligar uno con correo + codigo o comprar desde{" "}
            <Link href="/catalogo" className="font-black text-(--saut-navy)">
              catalogo
            </Link>
            .
          </article>
        ) : null}

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
                    : "border-(--border)",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--muted)">
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
                  <div className="rounded-[12px] border border-(--border) bg-white/80 p-3 text-[11px]">
                    <p className="font-black uppercase tracking-[0.12em]">Tracking</p>
                    <p className="mt-1 font-mono">{order.tracking_number ?? "Pendiente"}</p>
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-(--saut-navy) underline"
                      >
                        Ver tracking
                      </a>
                    ) : null}
                  </div>

                  <div className="rounded-[12px] border border-(--border) bg-white/80 p-3 text-[11px]">
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
                      <button
                        type="button"
                        onClick={() => handleStartEditAddress(order)}
                        className="h-9 rounded-[999px] border border-(--border) bg-[rgba(12,128,175,.16)] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-(--saut-navy)"
                      >
                        Cambiar direccion local
                      </button>
                    ) : (
                      <div className="space-y-2 rounded-[14px] border border-(--border) bg-white/85 p-3 text-[11px]">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={addressDraft?.line1 ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, line1: event.target.value } : prev
                              )
                            }
                            placeholder="Linea 1"
                            className="h-9 rounded-[10px] border border-(--border) bg-white px-2"
                          />
                          <input
                            value={addressDraft?.line2 ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, line2: event.target.value } : prev
                              )
                            }
                            placeholder="Linea 2"
                            className="h-9 rounded-[10px] border border-(--border) bg-white px-2"
                          />
                          <input
                            value={addressDraft?.city ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, city: event.target.value } : prev
                              )
                            }
                            placeholder="Ciudad"
                            className="h-9 rounded-[10px] border border-(--border) bg-white px-2"
                          />
                          <input
                            value={addressDraft?.state ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, state: event.target.value } : prev
                              )
                            }
                            placeholder="Estado"
                            className="h-9 rounded-[10px] border border-(--border) bg-white px-2"
                          />
                          <input
                            value={addressDraft?.postal_code ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, postal_code: event.target.value } : prev
                              )
                            }
                            placeholder="Codigo postal"
                            className="h-9 rounded-[10px] border border-(--border) bg-white px-2"
                          />
                          <input
                            value={addressDraft?.reference ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, reference: event.target.value } : prev
                              )
                            }
                            placeholder="Referencia"
                            className="h-9 rounded-[10px] border border-(--border) bg-white px-2"
                          />
                          <input
                            value={addressDraft?.country ?? "MX"}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, country: event.target.value } : prev
                              )
                            }
                            placeholder="Pais"
                            className="h-9 rounded-[10px] border border-(--border) bg-white px-2"
                          />
                          <input
                            value={addressDraft?.reason ?? ""}
                            onChange={(event) =>
                              setAddressDraft((prev) =>
                                prev ? { ...prev, reason: event.target.value } : prev
                              )
                            }
                            placeholder="Motivo (opcional)"
                            className="h-9 rounded-[10px] border border-(--border) bg-white px-2"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSaveAddress()}
                            disabled={savingAddress}
                            className="h-9 rounded-[999px] border border-(--border) bg-(--saut-yellow) px-3 text-[10px] font-black uppercase tracking-[0.12em] text-(--saut-black) disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingAddress ? "Guardando..." : "Guardar direccion"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrderId(null);
                              setAddressDraft(null);
                            }}
                            className="h-9 rounded-[999px] border border-(--border) bg-white px-3 text-[10px] font-black uppercase tracking-[0.12em]"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mt-3 rounded-[12px] border border-(--border) bg-white/80 p-3 text-[11px]">
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
    </main>
  );
}

export function OrdersExperience() {
  return (
    <React.Suspense fallback={<div className="min-h-[32vh]" />}>
      <OrdersExperienceContent />
    </React.Suspense>
  );
}
