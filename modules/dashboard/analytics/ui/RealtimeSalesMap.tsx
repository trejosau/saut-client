"use client";

import * as React from "react";

import { Badge, SelectField, TextField } from "@/core/design-system";
import { requestJson } from "@/core/lib/api/fetcher";
import { getAnalyticsWsUrl } from "@/core/lib/config/env";

type Scope = "general" | "type" | "publication" | "collection" | "drop";

type Ping = {
  id: string;
  order_id: string;
  publication_id?: string | null;
  publication_slug?: string | null;
  collection_id?: string | null;
  drop_id?: string | null;
  item_type?: string | null;
  garment_type?: string | null;
  garment_model?: string | null;
  color?: string | null;
  size?: string | null;
  grammage_g?: number | null;
  fit?: string | null;
  quantity: number;
  amount_mxn: number;
  shipping_method: string;
  shipping_provider?: string | null;
  state_code?: string | null;
  occurred_at: string;
};

const STATE_POINTS: Record<string, { x: number; y: number }> = {
  coahuila: { x: 68, y: 28 },
  durango: { x: 58, y: 34 },
  chihuahua: { x: 55, y: 18 },
  nuevo_leon: { x: 77, y: 34 },
  tamaulipas: { x: 83, y: 40 },
  zacatecas: { x: 58, y: 44 },
  jalisco: { x: 49, y: 57 },
  cdmx: { x: 59, y: 67 },
  estado_de_mexico: { x: 61, y: 66 },
  puebla: { x: 65, y: 69 },
  veracruz: { x: 76, y: 64 },
  yucatan: { x: 90, y: 75 },
  quintana_roo: { x: 95, y: 82 },
};

function normalizeStateKey(raw?: string | null): string {
  if (!raw) return "desconocido";
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\u00E1\u00E0\u00E4]/g, "a")
    .replace(/[\u00E9\u00E8\u00EB]/g, "e")
    .replace(/[\u00ED\u00EC\u00EF]/g, "i")
    .replace(/[\u00F3\u00F2\u00F6]/g, "o")
    .replace(/[\u00FA\u00F9\u00FC]/g, "u")
    .replace(/[\u00F1]/g, "n");
}

function fallbackPoint(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = 15 + (Math.abs(hash) % 70);
  const y = 15 + (Math.abs(hash * 7) % 70);
  return { x, y };
}

function formatMoney(value: number) {
  try {
    return value.toLocaleString("es-MX", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch {
    return String(value);
  }
}

export function RealtimeSalesMap() {
  const [scope, setScope] = React.useState<Scope>("general");
  const [publicationId, setPublicationId] = React.useState("");
  const [collectionId, setCollectionId] = React.useState("");
  const [dropId, setDropId] = React.useState("");
  const [garmentType, setGarmentType] = React.useState("tshirt");
  const [garmentModel, setGarmentModel] = React.useState("");
  const [color, setColor] = React.useState("");
  const [size, setSize] = React.useState("");
  const [grammage, setGrammage] = React.useState("");
  const [fit, setFit] = React.useState("");

  const [connected, setConnected] = React.useState(false);
  const [pings, setPings] = React.useState<Ping[]>([]);

  const query = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("limit", "160");

    if (scope === "publication" && publicationId.trim()) {
      params.set("publication_id", publicationId.trim());
    }
    if (scope === "collection" && collectionId.trim()) {
      params.set("collection_id", collectionId.trim());
    }
    if (scope === "drop" && dropId.trim()) {
      params.set("drop_id", dropId.trim());
    }
    if (scope === "type") {
      params.set("garment_type", garmentType.trim() || "tshirt");
    }

    if (garmentModel.trim()) params.set("garment_model", garmentModel.trim());
    if (color.trim()) params.set("color", color.trim());
    if (size.trim()) params.set("size", size.trim());
    if (grammage.trim()) params.set("grammage_g", grammage.trim());
    if (fit.trim()) params.set("fit", fit.trim());

    return params.toString();
  }, [
    collectionId,
    color,
    dropId,
    fit,
    garmentModel,
    garmentType,
    grammage,
    publicationId,
    scope,
    size,
  ]);

  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const run = async () => {
      try {
        const data = await requestJson<Ping[] | { items?: Ping[] }>(`/api/analytics/map/pings?${query}`, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!cancelled) {
          const items = Array.isArray(data) ? data : data.items ?? [];
          setPings(items.slice(0, 160));
        }
      } catch {
        // best effort
      }
    };

    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query]);

  React.useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    const controller = new AbortController();
    setConnected(false);

    const connect = async () => {
      try {
        const ticketResponse = await requestJson<{ ticket?: string }>("/api/analytics/map/ticket", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const ticket = ticketResponse.ticket?.trim();
        if (cancelled || !ticket) return;

        const socketQuery = new URLSearchParams(query);
        socketQuery.set("ticket", ticket);
        ws = new WebSocket(`${getAnalyticsWsUrl()}?${socketQuery.toString()}`);

        ws.onopen = () => {
          if (!cancelled) setConnected(true);
        };
        ws.onclose = () => {
          if (!cancelled) setConnected(false);
        };
        ws.onerror = () => {
          if (!cancelled) setConnected(false);
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const payload = JSON.parse(event.data) as {
              kind?: string;
              data?: Ping;
            };
            if (!payload.data) return;

            setPings((current) => {
              const merged = [payload.data!, ...current.filter((item) => item.id !== payload.data!.id)];
              return merged.slice(0, 180);
            });
          } catch {
            // ignore parse failures
          }
        };
      } catch {
        if (!cancelled) setConnected(false);
      }
    };

    void connect();
    return () => {
      cancelled = true;
      controller.abort();
      if (ws) {
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
      }
    };
  }, [query]);

  const dots = React.useMemo(() => {
    return pings.map((ping) => {
      const stateKey = normalizeStateKey(ping.state_code);
      const point = STATE_POINTS[stateKey] ?? fallbackPoint(stateKey);
      return {
        ping,
        x: point.x,
        y: point.y,
      };
    });
  }, [pings]);

  return (
    <section className="rounded-[20px] border border-hairline bg-[rgba(255,255,255,.45)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[14px] font-black uppercase tracking-[0.12em] text-ink">
          Mapa 2D Reutilizable
        </h2>
        <Badge tone={connected ? "success" : "danger"}>
          {connected ? "Realtime conectado" : "Sin conexion"}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField label="Scope" labelClassName="saut-form-label text-[10px]" value={scope} onChange={(event) => setScope(event.target.value as Scope)} size="sm" options={[{ value: "general", label: "General" }, { value: "type", label: "Tipo" }, { value: "publication", label: "Publicacion" }, { value: "collection", label: "Coleccion" }, { value: "drop", label: "Drop" }]} />
        <TextField label="Publication ID" labelClassName="saut-form-label text-[10px]" value={publicationId} onChange={(event) => setPublicationId(event.target.value)} size="sm" placeholder="uuid" inputClassName="text-[11px]" />
        <TextField label="Collection ID" labelClassName="saut-form-label text-[10px]" value={collectionId} onChange={(event) => setCollectionId(event.target.value)} size="sm" placeholder="uuid" inputClassName="text-[11px]" />
        <TextField label="Drop ID" labelClassName="saut-form-label text-[10px]" value={dropId} onChange={(event) => setDropId(event.target.value)} size="sm" placeholder="uuid" inputClassName="text-[11px]" />
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <TextField label="Tipo de prenda" labelClassName="sr-only" value={garmentType} onChange={(event) => setGarmentType(event.target.value)} size="sm" placeholder="garment_type" inputClassName="text-[11px]" />
        <TextField label="Modelo" labelClassName="sr-only" value={garmentModel} onChange={(event) => setGarmentModel(event.target.value)} size="sm" placeholder="model" inputClassName="text-[11px]" />
        <TextField label="Color" labelClassName="sr-only" value={color} onChange={(event) => setColor(event.target.value)} size="sm" placeholder="color" inputClassName="text-[11px]" />
        <TextField label="Talla" labelClassName="sr-only" value={size} onChange={(event) => setSize(event.target.value)} size="sm" placeholder="size" inputClassName="text-[11px]" />
        <TextField label="Gramaje" labelClassName="sr-only" value={grammage} onChange={(event) => setGrammage(event.target.value)} size="sm" placeholder="grammage" inputClassName="text-[11px]" />
        <TextField label="Fit" labelClassName="sr-only" value={fit} onChange={(event) => setFit(event.target.value)} size="sm" placeholder="fit" inputClassName="text-[11px]" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative h-[320px] overflow-hidden rounded-[16px] border border-hairline bg-[radial-gradient(circle_at_18%_18%,rgba(255,214,85,.42),transparent_42%),radial-gradient(circle_at_78%_70%,rgba(13,119,167,.28),transparent_46%),linear-gradient(160deg,rgba(255,255,255,.82),rgba(246,249,252,.55))]">
          {dots.map((dot) => (
            <div
              key={dot.ping.id}
              className="absolute"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              title={`${dot.ping.state_code ?? "sin-estado"} | $${formatMoney(dot.ping.amount_mxn)}`}
            >
              <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(255,76,76,.32)] animate-ping" />
              <span className="relative block h-2.5 w-2.5 rounded-full bg-[rgb(227,58,58)]" />
            </div>
          ))}
          <div className="absolute bottom-2 left-2 rounded-[999px] border border-hairline bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-ink">
            Pings: {pings.length}
          </div>
        </div>

        <div className="rounded-[16px] border border-hairline bg-white/74 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink">
            Feed recien confirmado
          </p>
          <div className="mt-2 max-h-[280px] space-y-2 overflow-auto pr-1">
            {pings.slice(0, 24).map((ping) => (
              <article key={ping.id} className="rounded-[10px] border border-hairline bg-white px-2.5 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-ink">
                  {ping.state_code ?? "sin estado"} | ${formatMoney(ping.amount_mxn)}
                </p>
                <p className="text-[10px] text-[rgba(8,10,13,.64)]">
                  {ping.garment_type ?? "n/a"} {ping.color ?? ""} {ping.size ?? ""}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
