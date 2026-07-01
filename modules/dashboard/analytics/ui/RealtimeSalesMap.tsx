"use client";

import * as React from "react";

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:8080";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_ANALYTICS_WS_URL ?? "ws://localhost:8097/ws/map";

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
    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/map/pings?${query}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { items?: Ping[] };
        if (!cancelled) {
          setPings((data.items ?? []).slice(0, 160));
        }
      } catch {
        // best effort
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  React.useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}?${query}`);
    setConnected(false);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
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

    return () => ws.close();
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
    <section className="rounded-[20px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[14px] font-black uppercase tracking-[0.12em] text-(--text)">
          Mapa 2D Reutilizable
        </h2>
        <span
          className={[
            "rounded-[999px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
            connected
              ? "border-[rgba(26,134,80,.34)] bg-[rgba(26,134,80,.14)] text-[rgb(19,110,64)]"
              : "border-[rgba(160,48,48,.32)] bg-[rgba(160,48,48,.12)] text-[rgb(124,36,36)]",
          ].join(" ")}
        >
          {connected ? "Realtime conectado" : "Sin conexion"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-(--text)">
          Scope
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as Scope)}
            className="mt-1 h-9 w-full rounded-[10px] border border-(--border) bg-white px-2.5 text-[11px]"
          >
            <option value="general">General</option>
            <option value="type">Tipo</option>
            <option value="publication">Publicacion</option>
            <option value="collection">Coleccion</option>
            <option value="drop">Drop</option>
          </select>
        </label>
        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-(--text)">
          Publication ID
          <input
            value={publicationId}
            onChange={(event) => setPublicationId(event.target.value)}
            className="mt-1 h-9 w-full rounded-[10px] border border-(--border) bg-white px-2.5 text-[11px]"
            placeholder="uuid"
          />
        </label>
        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-(--text)">
          Collection ID
          <input
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            className="mt-1 h-9 w-full rounded-[10px] border border-(--border) bg-white px-2.5 text-[11px]"
            placeholder="uuid"
          />
        </label>
        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-(--text)">
          Drop ID
          <input
            value={dropId}
            onChange={(event) => setDropId(event.target.value)}
            className="mt-1 h-9 w-full rounded-[10px] border border-(--border) bg-white px-2.5 text-[11px]"
            placeholder="uuid"
          />
        </label>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input value={garmentType} onChange={(event) => setGarmentType(event.target.value)} className="h-8 rounded-[10px] border border-(--border) bg-white px-2 text-[11px]" placeholder="garment_type" />
        <input value={garmentModel} onChange={(event) => setGarmentModel(event.target.value)} className="h-8 rounded-[10px] border border-(--border) bg-white px-2 text-[11px]" placeholder="model" />
        <input value={color} onChange={(event) => setColor(event.target.value)} className="h-8 rounded-[10px] border border-(--border) bg-white px-2 text-[11px]" placeholder="color" />
        <input value={size} onChange={(event) => setSize(event.target.value)} className="h-8 rounded-[10px] border border-(--border) bg-white px-2 text-[11px]" placeholder="size" />
        <input value={grammage} onChange={(event) => setGrammage(event.target.value)} className="h-8 rounded-[10px] border border-(--border) bg-white px-2 text-[11px]" placeholder="grammage" />
        <input value={fit} onChange={(event) => setFit(event.target.value)} className="h-8 rounded-[10px] border border-(--border) bg-white px-2 text-[11px]" placeholder="fit" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative h-[320px] overflow-hidden rounded-[16px] border border-(--border) bg-[radial-gradient(circle_at_18%_18%,rgba(255,214,85,.42),transparent_42%),radial-gradient(circle_at_78%_70%,rgba(13,119,167,.28),transparent_46%),linear-gradient(160deg,rgba(255,255,255,.82),rgba(246,249,252,.55))]">
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
          <div className="absolute bottom-2 left-2 rounded-[999px] border border-(--border) bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-(--text)">
            Pings: {pings.length}
          </div>
        </div>

        <div className="rounded-[16px] border border-(--border) bg-white/74 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-(--text)">
            Feed recien confirmado
          </p>
          <div className="mt-2 max-h-[280px] space-y-2 overflow-auto pr-1">
            {pings.slice(0, 24).map((ping) => (
              <article key={ping.id} className="rounded-[10px] border border-(--border) bg-white px-2.5 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-(--text)">
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
