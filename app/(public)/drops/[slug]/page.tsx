import Link from "next/link";
import { notFound } from "next/navigation";

import ProductCarousel from "@/widgets/catalog/ProductCarousel";
import {
  fetchCatalogDropBySlug,
  publicationToProductCard,
} from "@/modules/catalog/client/api";

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(status: string): string {
  if (status === "active") return "Activo";
  if (status === "ended") return "Terminado";
  return "Preview";
}

type DropDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DropDetailPage({ params }: DropDetailPageProps) {
  const { slug } = await params;
  const detail = await fetchCatalogDropBySlug(slug);
  if (!detail) notFound();

  const cards = detail.items.map(publicationToProductCard);

  return (
    <main className="w-full px-4 py-8 sm:px-8 lg:px-14">
      <section className="rounded-[24px] border border-(--border) bg-[rgba(255,255,255,.38)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgba(8,10,13,.62)]">
              Drop
            </p>
            <h1 className="text-[24px] sm:text-[30px] font-black uppercase tracking-[0.04em] text-(--text)">
              {detail.drop.title}
            </h1>
          </div>
          <span className="rounded-[999px] border border-[rgba(8,10,13,.14)] bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-(--text)">
            {statusLabel(detail.drop.status)}
          </span>
        </div>

        {detail.drop.description ? (
          <p className="mt-2 text-[12px] sm:text-[13px] text-[rgba(8,10,13,.72)]">
            {detail.drop.description}
          </p>
        ) : null}

        <p className="mt-3 text-[11px] tracking-[0.02em] text-[rgba(8,10,13,.62)]">
          Inicio: {formatDate(detail.drop.starts_at)} · Fin:{" "}
          {formatDate(detail.drop.ends_at)} · Cupo:{" "}
          {detail.drop.capacity_total ?? "sin limite"}
        </p>

        <Link
          href="/drops"
          className="mt-4 inline-flex h-9 items-center rounded-[999px] border border-(--border) bg-white/75 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-(--text)"
        >
          Volver a drops
        </Link>
      </section>

      <section className="mt-6">
        {cards.length > 0 ? (
          <ProductCarousel products={cards} intervalMs={4200} />
        ) : (
          <div className="rounded-[20px] border border-(--border) bg-[rgba(255,255,255,.40)] p-5 text-[12px] text-[rgba(8,10,13,.72)]">
            Este drop aun no tiene publicaciones visibles.
          </div>
        )}
      </section>
    </main>
  );
}
