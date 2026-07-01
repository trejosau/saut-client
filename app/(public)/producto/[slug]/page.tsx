import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchCatalogPublicationBySlug } from "@/modules/catalog/client/api";
import ProductConfigurator from "@/modules/catalog/ui/ProductConfigurator";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params;
  const detail = await fetchCatalogPublicationBySlug(slug);

  if (!detail) {
    notFound();
  }

  const publication = detail.publication;

  return (
    <main className="w-full px-4 sm:px-8 lg:px-14 py-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6">
          <Link
            href="/catalogo"
            className="text-[12px] font-black tracking-[0.14em] uppercase text-(--text) opacity-70 hover:opacity-100 transition"
          >
            Volver al catalogo
          </Link>
        </div>

        <section>
          <ProductConfigurator
            publication={publication}
            design={detail.design}
            variants={detail.variants}
            mockups={detail.mockups}
          />
        </section>
      </div>
    </main>
  );
}
