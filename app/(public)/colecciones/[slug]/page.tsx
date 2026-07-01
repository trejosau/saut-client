import Link from "next/link";
import { notFound } from "next/navigation";

import ProductCarousel from "@/widgets/catalog/ProductCarousel";
import {
  fetchCatalogCollectionBySlug,
  publicationToProductCard,
} from "@/modules/catalog/client/api";

type CollectionDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { slug } = await params;
  const detail = await fetchCatalogCollectionBySlug(slug);
  if (!detail) notFound();

  const cards = detail.items.map(publicationToProductCard);

  return (
    <main className="w-full px-4 py-8 sm:px-8 lg:px-14">
      <section className="rounded-[24px] border border-(--border) bg-[rgba(255,255,255,.38)] p-5 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgba(8,10,13,.62)]">
          Coleccion
        </p>
        <h1 className="text-[24px] sm:text-[30px] font-black uppercase tracking-[0.04em] text-(--text)">
          {detail.collection.title}
        </h1>
        {detail.collection.description ? (
          <p className="mt-2 text-[12px] sm:text-[13px] text-[rgba(8,10,13,.72)]">
            {detail.collection.description}
          </p>
        ) : null}
        <Link
          href="/colecciones"
          className="mt-4 inline-flex h-9 items-center rounded-[999px] border border-(--border) bg-white/75 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-(--text)"
        >
          Volver a colecciones
        </Link>
      </section>

      <section className="mt-6">
        {cards.length > 0 ? (
          <ProductCarousel products={cards} intervalMs={4200} />
        ) : (
          <div className="rounded-[20px] border border-(--border) bg-[rgba(255,255,255,.40)] p-5 text-[12px] text-[rgba(8,10,13,.72)]">
            Esta coleccion aun no tiene publicaciones visibles.
          </div>
        )}
      </section>
    </main>
  );
}
