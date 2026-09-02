/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { fetchCatalogCollections } from "@/modules/catalog/client/api";

export default async function CollectionsPage() {
  const collections = await fetchCatalogCollections({ visible: true });

  return (
    <main className="w-full">
      <header className="border-b border-hairline bg-primary py-14 sm:py-20">
        <div className="saut-container">
          <p className="text-xs font-extrabold uppercase text-charcoal">CuradurÃ­a SAUT</p>
          <h1 className="saut-display mt-3 text-[clamp(48px,9vw,104px)] leading-[.88] uppercase">Colecciones</h1>
          <p className="mt-5 max-w-[56ch] text-base leading-7 text-[rgba(8,10,13,.68)]">Historias, referencias y diseÃ±os agrupados para encontrar una direcciÃ³n mÃ¡s rÃ¡pido.</p>
        </div>
      </header>

      <section className="saut-section">
        <div className="saut-container">
          {collections.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection) => (
                <Link key={collection.id} href={`/colecciones/${collection.slug}`} className="group overflow-hidden rounded-[8px] border border-hairline bg-white">
                  <div className="aspect-[16/11] overflow-hidden bg-hairline-soft">
                    {collection.cover_url ? (
                      <img src={collection.cover_url} alt={collection.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid h-full place-items-center bg-charcoal text-primary">
                        <span className="saut-display text-5xl uppercase">SAUT</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h2 className="saut-display text-3xl uppercase">{collection.title}</h2>
                        {collection.description ? <p className="mt-2 text-sm leading-6 text-mute">{collection.description}</p> : null}
                      </div>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[7px] border border-ink transition group-hover:bg-primary"><ArrowRight size={18} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center border border-dashed border-hairline bg-white px-6 text-center">
              <div>
                <h2 className="saut-display text-3xl uppercase">Nuevas colecciones en camino</h2>
                <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-6 text-mute">El catÃ¡logo completo sigue disponible mientras preparamos la siguiente selecciÃ³n.</p>
                <Link href="/catalogo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-primary px-6 text-xs font-black uppercase text-ink transition hover:bg-primary/90 mt-6">Explorar catÃ¡logo</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
