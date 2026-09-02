import { redirect } from "next/navigation";

import { getDashboardKpis } from "@/modules/dashboard/analytics/server/api";
import { ensureDashboardModuleAccess } from "@/modules/dashboard/auth/server/access";
import { RealtimeSalesMap } from "@/modules/dashboard/analytics/ui/RealtimeSalesMap";

function money(value: number) {
  try {
    return value.toLocaleString("es-MX", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch {
    return String(value);
  }
}

function minutes(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)} min`;
}

function pct(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}%`;
}

export default async function AnalyticsDashboardPage() {
  const access = await ensureDashboardModuleAccess("analitica");
  if (!access) {
    redirect("/dashboard");
  }

  const kpis = await getDashboardKpis();

  return (
    <main className="w-full px-4 py-10 sm:px-8 lg:px-14">
      <section className="rounded-[20px] border border-hairline bg-[rgba(255,255,255,.44)] p-5 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[rgba(8,10,13,.64)]">
          Bloque 12 | Analitica and Mapa
        </p>
        <h1 className="mt-1 text-[28px] sm:text-[36px] font-black uppercase tracking-[0.04em] text-ink">
          KPI de Operacion
        </h1>
        <p className="mt-2 text-[12px] text-[rgba(8,10,13,.70)]">
          Rango: {new Date(kpis.from).toLocaleString("es-MX")} -{" "}
          {new Date(kpis.to).toLocaleString("es-MX")}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-[14px] border border-hairline bg-white/80 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink">Pedidos pagados</p>
            <p className="mt-1 text-[22px] font-black text-ink">{kpis.sales.paid_orders}</p>
          </article>
          <article className="rounded-[14px] border border-hairline bg-white/80 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink">Revenue MXN</p>
            <p className="mt-1 text-[22px] font-black text-ink">${money(kpis.sales.revenue_mxn)}</p>
          </article>
          <article className="rounded-[14px] border border-hairline bg-white/80 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink">Merma unidades</p>
            <p className="mt-1 text-[22px] font-black text-ink">{kpis.merma.units}</p>
          </article>
          <article className="rounded-[14px] border border-hairline bg-white/80 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink">Incidencias abiertas</p>
            <p className="mt-1 text-[22px] font-black text-ink">{kpis.incidents.open_cases}</p>
          </article>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <article className="rounded-[12px] border border-hairline bg-white/75 p-3 text-[11px]">
            <p className="font-black uppercase tracking-[0.1em]">Pagado a Disenado</p>
            <p className="mt-1 font-semibold">{minutes(kpis.lead_times_minutes.paid_to_designed_avg)}</p>
          </article>
          <article className="rounded-[12px] border border-hairline bg-white/75 p-3 text-[11px]">
            <p className="font-black uppercase tracking-[0.1em]">Disenado a Enviado</p>
            <p className="mt-1 font-semibold">{minutes(kpis.lead_times_minutes.designed_to_shipped_avg)}</p>
          </article>
          <article className="rounded-[12px] border border-hairline bg-white/75 p-3 text-[11px]">
            <p className="font-black uppercase tracking-[0.1em]">Pagado a Entregado</p>
            <p className="mt-1 font-semibold">{minutes(kpis.lead_times_minutes.paid_to_delivered_avg)}</p>
          </article>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-[12px] border border-hairline bg-white/75 p-3 text-[11px]">
            <p className="font-black uppercase tracking-[0.1em]">Costo estimado</p>
            <p className="mt-1 font-semibold">
              {kpis.margins.estimated_cost_mxn == null ? "-" : `$${money(kpis.margins.estimated_cost_mxn)}`}
            </p>
          </article>
          <article className="rounded-[12px] border border-hairline bg-white/75 p-3 text-[11px]">
            <p className="font-black uppercase tracking-[0.1em]">Margen bruto</p>
            <p className="mt-1 font-semibold">
              {kpis.margins.gross_margin_mxn == null ? "-" : `$${money(kpis.margins.gross_margin_mxn)}`}
            </p>
          </article>
          <article className="rounded-[12px] border border-hairline bg-white/75 p-3 text-[11px]">
            <p className="font-black uppercase tracking-[0.1em]">Margen bruto %</p>
            <p className="mt-1 font-semibold">{pct(kpis.margins.gross_margin_pct)}</p>
          </article>
          <article className="rounded-[12px] border border-hairline bg-white/75 p-3 text-[11px]">
            <p className="font-black uppercase tracking-[0.1em]">Cobertura costos</p>
            <p className="mt-1 font-semibold">{kpis.margins.coverage_orders} ordenes</p>
          </article>
        </div>
      </section>

      <div className="mt-6">
        <RealtimeSalesMap />
      </div>
    </main>
  );
}
