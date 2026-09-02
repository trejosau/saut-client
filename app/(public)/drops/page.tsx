/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { fetchCatalogDrops } from "@/modules/catalog/client/api";

function formatDate(value?: string | null): string {
  if (!value) return "Por anunciar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Por anunciar";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(status: string): string {
  if (status === "active") return "Disponible";
  if (status === "ended") return "Cerrado";
  return "PrÃ³ximamente";
}

export default async function DropsPage() {
  const drops = await fetchCatalogDrops({ visible: true });

  return (
    <main className="w-full">
      <header className="bg-charcoal py-14 text-white sm:py-20">
        <div className="saut-container">
          <p className="text-xs font-extrabold uppercase text-primary">Lanzamientos limitados</p>
          <h1 className="saut-display mt-3 text-[clamp(52px,9vw,108px)] leading-[.86] uppercase">Drops</h1>
          <p className="mt-5 max-w-[54ch] text-base leading-7 text-white/68">Piezas con ventana de compra y disponibilidad limitada.</p>
        </div>
      </header>

      <section className="saut-section">
        <div className="saut-container">
          {drops.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {drops.map((drop) => (
                <article key={drop.id} className="overflow-hidden rounded-[8px] border border-hairline bg-white">
                  <div className="relative aspect-[16/10] overflow-hidden bg-hairline-soft">
                    {drop.cover_url ? (
                      <img src={drop.cover_url} alt={drop.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center bg-info text-primary">
                        <span className="saut-display text-5xl uppercase">SAUT</span>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 bg-primary px-3 py-2 text-[10px] font-black uppercase text-ink">{statusLabel(drop.status)}</span>
                  </div>
                  <div className="p-5">
                    <h2 className="saut-display text-3xl uppercase">{drop.title}</h2>
                    {drop.description ? <p className="mt-3 text-sm leading-6 text-mute">{drop.description}</p> : null}
                    <div className="mt-5 flex items-center gap-2 border-t border-hairline pt-4 text-xs font-bold text-mute">
                      <CalendarDays size={17} className="text-info" />
                      {formatDate(drop.starts_at)} Â· {formatDate(drop.ends_at)}
                    </div>
                    <Link href={`/drops/${drop.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-ink px-6 text-xs font-black uppercase text-white transition hover:bg-charcoal mt-5 w-full">
                      Ver drop <ArrowRight size={18} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center border border-dashed border-hairline bg-white px-6 text-center">
              <div>
                <h2 className="saut-display text-3xl uppercase">El prÃ³ximo drop se estÃ¡ preparando</h2>
                <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-6 text-mute">Mientras tanto, explora el catÃ¡logo o construye una pieza propia.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/catalogo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-6 text-xs font-black uppercase text-ink transition hover:bg-soft-cloud/60">Ver catÃ¡logo</Link>
                  <Link href="/personalizar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-primary px-6 text-xs font-black uppercase text-ink transition hover:bg-primary/90">Personalizar</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
