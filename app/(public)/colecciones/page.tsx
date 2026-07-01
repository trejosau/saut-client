/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { fetchCatalogCollections } from "@/modules/catalog/client/api";

export default async function CollectionsPage() {
  const collections = await fetchCatalogCollections({ visible: true });

  return (
    <main className="w-full">
      <header className="border-b border-(--border) bg-(--saut-yellow) py-14 sm:py-20">
        <div className="saut-container">
          <p className="text-xs font-extrabold uppercase text-(--saut-navy)">Curaduría SAUT</p>
          <h1 className="saut-display mt-3 text-[clamp(48px,9vw,104px)] leading-[.88] uppercase">Colecciones</h1>
          <p className="mt-5 max-w-[56ch] text-base leading-7 text-[rgba(8,10,13,.68)]">Historias, referencias y diseños agrupados para encontrar una dirección más rápido.</p>
        </div>
      </header>

      <section className="saut-section">
        <div className="saut-container">
          {collections.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection) => (
                <Link key={collection.id} href={`/colecciones/${collection.slug}`} className="group overflow-hidden rounded-[8px] border border-(--border) bg-white">
                  <div className="aspect-[16/11] overflow-hidden bg-(--surface-3)">
                    {collection.cover_url ? (
                      <img src={collection.cover_url} alt={collection.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid h-full place-items-center bg-(--saut-navy) text-(--saut-yellow)">
                        <span className="saut-display text-5xl uppercase">SAUT</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h2 className="saut-display text-3xl uppercase">{collection.title}</h2>
                        {collection.description ? <p className="mt-2 text-sm leading-6 text-(--muted)">{collection.description}</p> : null}
                      </div>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[7px] border border-(--saut-black) transition group-hover:bg-(--saut-yellow)"><ArrowRight size={18} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center border border-dashed border-(--border) bg-white px-6 text-center">
              <div>
                <h2 className="saut-display text-3xl uppercase">Nuevas colecciones en camino</h2>
                <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-6 text-(--muted)">El catálogo completo sigue disponible mientras preparamos la siguiente selección.</p>
                <Link href="/catalogo" className="saut-button saut-button--primary mt-6">Explorar catálogo</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
