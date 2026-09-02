import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PenTool, ShieldCheck, Sparkles, Truck } from "lucide-react";

import {
  fetchCatalogPublications,
  publicationToProductCard,
} from "@/modules/catalog/client/api";
import ProductCarousel from "@/widgets/catalog/ProductCarousel";
import { type ProductCardData } from "@/widgets/catalog/ProductCard";
import { LandingMotion } from "./LandingMotion";

const categories = [
  {
    title: "Oversize",
    image: "/tiles/oversize-negra.webp",
    href: "/catalogo?prenda=oversize",
  },
  {
    title: "Manga larga",
    image: "/tiles/manga-larga-gris-grafito.webp",
    href: "/catalogo?prenda=long_sleeve",
  },
  {
    title: "Hoodies",
    image: "/tiles/hoodie-oversize-negra.webp",
    href: "/catalogo?prenda=hoodie",
  },
];

const promises = [
  {
    icon: ShieldCheck,
    title: "Calidad revisada",
    copy: "Cada pieza se valida antes de salir.",
  },
  {
    icon: Truck,
    title: "EnvÃ­o nacional",
    copy: "Seguimiento hasta tu puerta.",
  },
  {
    icon: PenTool,
    title: "DiseÃ±o propio",
    copy: "Personaliza frente y espalda.",
  },
];

export default async function Page() {
  const publications = await fetchCatalogPublications({ sort: "best_sellers" });

  const featured: ProductCardData[] = publications
    .slice(0, 12)
    .map((publication, index) => ({
      ...publicationToProductCard(publication),
      badge:
        index === 0
          ? "Nuevo"
          : index === 1
            ? "Drop"
            : index === 2
              ? "Favorito"
              : undefined,
    }));

  return (
    <LandingMotion>
      {/* HERO */}
      <section
        data-motion-section="hero"
        className="relative h-[520px] w-full overflow-hidden bg-cover bg-[position:72%_center] bg-no-repeat text-white sm:h-[580px] lg:h-[clamp(620px,37.5vw,720px)] lg:bg-center"
      >
        <div
          data-hero-visual
          className="absolute -inset-[6%] bg-cover bg-[position:72%_center] bg-no-repeat will-change-transform lg:bg-center"
          style={{ backgroundImage: "url('/landing-banner.webp')" }}
        />

        {/* Overlay suave para mejorar lectura sin tapar el banner */}
        <div
          data-hero-overlay
          className="absolute inset-0 bg-gradient-to-r from-[#002b3a]/40 via-[#002b3a]/10 to-transparent"
        />

        <div
          data-hero-content
          className="saut-container relative z-10 flex h-full items-start justify-center pt-5 will-change-transform sm:justify-start sm:pt-8 lg:pt-[clamp(44px,4vw,72px)]"
        >
          {/* Splash completo: imagen y contenido escalan juntos */}
          <div className="relative aspect-[507/281] w-[min(94vw,640px)] sm:w-[min(78vw,660px)] lg:w-[clamp(560px,36vw,720px)]">
            <Image
              src="/bg-content-hero.png"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 720px, (min-width: 640px) 660px, 94vw"
              className="pointer-events-none select-none object-contain"
            />

            {/* Contenido ligado al splash */}
            <div className="absolute left-[15%] top-[46%] z-10 w-[64%] -translate-y-1/2">
              <h1 className="text-[clamp(20px,5vw,29px)] font-semibold leading-[1.12] tracking-[-.035em] sm:text-[clamp(24px,3.5vw,32px)] lg:text-[clamp(27px,1.8vw,34px)]">
                Prendas con carÃ¡cter, drops limitados y un estudio para
                convertir tus ideas en ropa.
              </h1>

              <div className="mt-4 flex flex-wrap gap-3 sm:mt-5">
                <Link
                  href="/catalogo"
                  className="inline-flex h-11 items-center justify-center gap-3 rounded-[8px] bg-primary px-5 text-[11px] font-black uppercase text-ink shadow-sm transition hover:brightness-95 sm:h-12 sm:px-6 sm:text-xs"
                >
                  Ver catÃ¡logo <ArrowRight size={18} />
                </Link>

                <Link
                  href="/personalizar"
                  className="inline-flex h-11 items-center justify-center rounded-[8px] border border-white/35 bg-black/20 px-5 text-[11px] font-black uppercase text-white backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-ink sm:h-12 sm:px-6 sm:text-xs"
                >
                  Personalizar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMESAS */}
      <section
        data-motion-section="benefits"
        aria-label="Ventajas de comprar en SAUT"
        className="border-b border-hairline bg-soft-cloud"
      >
        <div className="saut-container grid divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {promises.map(({ icon: Icon, title, copy }) => (
            <div
              data-motion-item
              key={title}
              className="flex min-h-32 items-center gap-5 px-2 py-6 sm:px-7"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-hairline bg-white">
                <Icon
                  className="text-info"
                  size={21}
                  strokeWidth={1.8}
                />
              </span>

              <div>
                <h2 className="text-sm font-black uppercase">{title}</h2>
                <p className="mt-1 text-sm text-mute">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORÃAS */}
      <section data-motion-section="categories" className="saut-section bg-white">
        <div className="saut-container">
          <div
            data-motion-heading
            className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="saut-kicker">Encuentra tu estilo</p>
              <h2 className="saut-heading max-w-[12ch]">Calidad premium</h2>
            </div>

            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-6 text-xs font-black uppercase text-ink transition hover:bg-soft-cloud/60 self-start sm:self-auto"
            >
              Ver todas las prendas <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden border border-hairline bg-hairline md:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                data-motion-card
                key={category.title}
                href={category.href}
                className="group bg-soft-cloud"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={category.image}
                    alt={`Prenda ${category.title} SAUT`}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-contain p-8 transition-transform duration-300 group-hover:scale-[1.035]"
                  />

                  {index === 0 ? (
                    <span className="absolute left-5 top-5 bg-primary px-3 py-2 text-[11px] font-black uppercase text-ink">
                      MÃ¡s vendido
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between border-t border-hairline bg-white p-5">
                  <div>
                    <span className="text-[11px] font-black text-mute">
                      0{index + 1}
                    </span>
                    <h3 className="saut-display mt-1 text-3xl uppercase">
                      {category.title}
                    </h3>
                  </div>

                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-ink transition-colors group-hover:bg-ink group-hover:text-white">
                    <ArrowRight size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      {featured.length ? (
        <section
          data-motion-section="featured"
          className="saut-section border-y border-hairline bg-white"
        >
          <div className="saut-container">
            <div data-motion-heading className="flex items-end justify-between gap-5">
              <div>
                <p className="saut-kicker">SelecciÃ³n SAUT</p>
                <h2 className="saut-heading">Novedades</h2>
              </div>

              <Link
                href="/catalogo"
                className="hidden text-sm font-extrabold uppercase hover:text-info sm:inline-flex"
              >
                Ver todo
              </Link>
            </div>

            <div data-motion-track>
              <ProductCarousel
                products={featured}
                intervalMs={4800}
                className="mt-10"
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* STUDIO */}
      <section
        data-motion-section="studio"
        className="min-h-[calc(100svh-104px)] border-t border-hairline bg-soft-cloud"
      >
        <div className="saut-container grid min-h-[calc(100svh-104px)] items-center gap-12 pb-[clamp(72px,8vw,112px)] pt-[clamp(48px,6vw,72px)] lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div data-motion-copy className="max-w-[560px]">
            <p className="saut-kicker">SAUT Studio / 01</p>

            <h2 className="saut-display mt-4 text-[clamp(48px,7vw,92px)] leading-[.88] uppercase text-charcoal">
              Tu idea. Tu prenda.
            </h2>

            <p className="mt-7 max-w-[50ch] text-base leading-7 text-mute">
              Elige modelo, color, talla y gramaje. Sube tus imÃ¡genes, agrega
              texto y ajusta cada lado desde el estudio.
            </p>

            <Link
  href="/personalizar"
  className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-primary px-6 text-xs font-black uppercase text-ink transition hover:bg-primary/90"
>
  Abrir estudio <Sparkles size={18} />
</Link>
          </div>

          <div
            data-motion-media
            className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-br-[48px] rounded-tl-[48px] bg-black p-3 pb-8 will-change-transform lg:mx-0 lg:ml-auto lg:p-4 lg:pb-10"
          >
            <div className="relative size-full">
              <Image
                src="/hero_studio.png"
                alt="Editor SAUT para personalizar una playera"
                fill
                sizes="(min-width: 1024px) 560px, calc(100vw - 32px)"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>
    </LandingMotion>
  );
}
