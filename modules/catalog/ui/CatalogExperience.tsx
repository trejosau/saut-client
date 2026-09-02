"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

import { SelectField, TextField } from "@/core/design-system";
import {
  CATALOG_CATEGORY_QUERY_KEY,
  parseCatalogCategory,
  type CatalogCategoryFilterValue,
  type CatalogCategoryKey,
} from "@/modules/catalog/constants/categories";
import ProductCard, { type ProductCardData } from "@/widgets/catalog/ProductCard";
import ProductCarousel from "@/widgets/catalog/ProductCarousel";

type CatalogCategoryWithFallback = CatalogCategoryKey | "uncategorized";
type GarmentFilterKey = "all" | "tshirt" | "hoodie" | "jogger";
type SortKey = "best_sellers" | "az" | "za" | "price_desc" | "price_asc";

export type CatalogExperienceItem = ProductCardData & {
  slug: string;
  category: string;
  garmentType: string;
  sortRank: number;
};

type CatalogExperienceProps = {
  items: CatalogExperienceItem[];
};

type EnrichedCatalogItem = CatalogExperienceItem & {
  categoryKey: CatalogCategoryWithFallback;
  garmentTypeKey: Exclude<GarmentFilterKey, "all">;
};

type ConjuntoBlueprint = {
  id: string;
  title: string;
  category: CatalogCategoryKey;
  prioritySlugs: string[];
};

const GARMENT_OPTIONS = [
  { value: "all", label: "Todas las prendas" },
  { value: "tshirt", label: "Playeras" },
  { value: "hoodie", label: "Hoodies" },
  { value: "jogger", label: "Joggers" },
];

const SORT_OPTIONS = [
  { value: "best_sellers", label: "Mas vendidos" },
  { value: "az", label: "A - Z" },
  { value: "za", label: "Z - A" },
  { value: "price_desc", label: "Precio mayor a menor" },
  { value: "price_asc", label: "Precio menor a mayor" },
];

const HARD_CODED_BEST_SELLER_SLUGS = [
  "porshe-tokyo",
  "porshe-passion",
  "porshe-og",
  "porshe-964",
  "porshe-gt3-rs",
  "stephen-curry",
  "cr7",
  "ohtani",
  "gervonta",
  "california-city",
  "dallas-city",
  "los-angeles-city",
  "francia-city",
  "galaxias",
  "gallo-pepe",
];

const CONJUNTO_BLUEPRINTS: ConjuntoBlueprint[] = [
  {
    id: "set-porshe",
    title: "Porshe",
    category: "vehicles",
    prioritySlugs: [
      "porshe-tokyo",
      "porshe-passion",
      "porshe-og",
      "porshe-964",
      "porshe-gt3-rs",
    ],
  },
  {
    id: "set-estrellas",
    title: "Estrellas",
    category: "sports",
    prioritySlugs: ["stephen-curry", "cr7", "ohtani", "gervonta"],
  },
  {
    id: "set-ciudades",
    title: "Ciudades",
    category: "cities_countries",
    prioritySlugs: ["california-city", "dallas-city", "los-angeles-city", "francia-city"],
  },
];

const CATEGORY_ALIASES: Record<string, CatalogCategoryWithFallback> = {
  music: "music_artists",
  music_artists: "music_artists",
  sports: "sports",
  sport: "sports",
  vehicles: "vehicles",
  vehicle: "vehicles",
  motors: "vehicles",
  trends: "trends",
  duo: "duo",
  series_movies_videogames: "series_movies_videogames",
  series_peliculas_videojuegos: "series_movies_videogames",
  cities_countries: "cities_countries",
  cities: "cities_countries",
  amor_amistad: "amor_amistad",
  amor_y_amistad: "amor_amistad",
  navidad: "navidad",
  halloween: "halloween",
  dia_de_muertos: "dia_de_muertos",
  dia_de_muerto: "dia_de_muertos",
  seasons: "navidad",
  temporada: "navidad",
  temporadas: "navidad",
};

function ShirtBadgeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8.2 4.5h7.6l1.9 2.2 2.6.9-1.7 4.2-2.1-.7V20H7.5v-8.9l-2.1.7L3.7 7.6l2.6-.9 1.9-2.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.7 4.5c0 1.4 1 2.4 2.3 2.4s2.3-1 2.3-2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function StitchLineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 10.4 8 13.6M11 10.4l2 3.2M16 10.4l2 3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeCategoryKey(raw: string): CatalogCategoryWithFallback {
  const key = normalizeText(raw).replace(/\s+/g, "_");
  return CATEGORY_ALIASES[key] ?? "uncategorized";
}

function normalizeGarmentType(raw: string): Exclude<GarmentFilterKey, "all"> {
  const key = normalizeText(raw);
  if (key.includes("hoodie")) return "hoodie";
  if (key.includes("jogger")) return "jogger";
  return "tshirt";
}

function sortByBestSellers(a: EnrichedCatalogItem, b: EnrichedCatalogItem) {
  const leftIdx = HARD_CODED_BEST_SELLER_SLUGS.indexOf(a.slug);
  const rightIdx = HARD_CODED_BEST_SELLER_SLUGS.indexOf(b.slug);

  if (leftIdx !== -1 && rightIdx !== -1) return leftIdx - rightIdx;
  if (leftIdx !== -1) return -1;
  if (rightIdx !== -1) return 1;

  if (a.sortRank !== b.sortRank) return b.sortRank - a.sortRank;
  return a.name.localeCompare(b.name, "es");
}

function sortItems(items: EnrichedCatalogItem[], sortBy: SortKey) {
  const next = [...items];
  switch (sortBy) {
    case "az":
      next.sort((a, b) => a.name.localeCompare(b.name, "es"));
      return next;
    case "za":
      next.sort((a, b) => b.name.localeCompare(a.name, "es"));
      return next;
    case "price_desc":
      next.sort((a, b) => b.priceMXN - a.priceMXN || a.name.localeCompare(b.name, "es"));
      return next;
    case "price_asc":
      next.sort((a, b) => a.priceMXN - b.priceMXN || a.name.localeCompare(b.name, "es"));
      return next;
    case "best_sellers":
    default:
      next.sort(sortByBestSellers);
      return next;
  }
}

function buildConjuntos(items: EnrichedCatalogItem[]) {
  const allSorted = sortItems(items, "best_sellers");
  const bySlug = new Map(items.map((item) => [item.slug, item]));

  return CONJUNTO_BLUEPRINTS.map((blueprint) => {
    const selected: EnrichedCatalogItem[] = [];
    const used = new Set<string>();

    for (const slug of blueprint.prioritySlugs) {
      const match = bySlug.get(slug);
      if (match && !used.has(match.id)) {
        selected.push(match);
        used.add(match.id);
      }
    }

    for (const item of allSorted) {
      if (selected.length >= 8) break;
      if (used.has(item.id)) continue;
      if (item.categoryKey === blueprint.category) {
        selected.push(item);
        used.add(item.id);
      }
    }

    for (const item of allSorted) {
      if (selected.length >= 8) break;
      if (used.has(item.id)) continue;
      selected.push(item);
      used.add(item.id);
    }

    return {
      ...blueprint,
      items: selected,
    };
  }).filter((set) => set.items.length > 0);
}

function decorateBestSellerCards(items: EnrichedCatalogItem[]) {
  return items.map((item, index) => ({
    ...item,
    badge: index === 0 ? "Top 1" : index === 1 ? "Top 2" : index === 2 ? "Top 3" : "Hot",
  }));
}

function decorateCatalogCards(items: EnrichedCatalogItem[]) {
  return items.map((item, index) => ({
    ...item,
    badge: index < 3 ? "Nuevo" : undefined,
  }));
}

type CatalogFiltersTabProps = {
  garmentFilter: GarmentFilterKey;
  sortBy: SortKey;
  query: string;
  resultsCount: number;
  hasActiveFilters: boolean;
  onGarmentFilterChange: (value: GarmentFilterKey) => void;
  onSortChange: (value: SortKey) => void;
  onQueryChange: (value: string) => void;
  onReset: () => void;
};

function CatalogFiltersTab({
  garmentFilter,
  sortBy,
  query,
  resultsCount,
  hasActiveFilters,
  onGarmentFilterChange,
  onSortChange,
  onQueryChange,
  onReset,
}: CatalogFiltersTabProps) {
  return (
    <div className="border-b border-hairline bg-hairline-soft p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] xl:items-center">
        <SelectField
          aria-label="Filtrar por tipo de prenda"
          size="sm"
          value={garmentFilter}
          options={GARMENT_OPTIONS}
          onChange={(event) => onGarmentFilterChange(event.target.value as GarmentFilterKey)}
          placeholder="Tipo de prenda"
          shellClassName="h-12 rounded-[6px] bg-white px-3"
          selectClassName="text-sm"
          wrapperClassName="min-w-0"
        />
        <SelectField
          aria-label="Ordenar catálogo"
          size="sm"
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          placeholder="Ordenar por"
          shellClassName="h-12 rounded-[6px] bg-white px-3"
          selectClassName="text-sm"
          wrapperClassName="min-w-0"
        />
        <TextField
          aria-label="Buscar en catálogo"
          size="sm"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar diseño o prenda..."
          maxLength={80}
          shellClassName="h-12 rounded-[6px] bg-white px-3"
          inputClassName="text-base"
          wrapperClassName="min-w-0"
        />

        <div className="flex items-center justify-between gap-2 xl:justify-end">
          <span className="inline-flex min-h-10 items-center border border-hairline bg-white px-3 text-[11px] font-black uppercase text-ink">
            {resultsCount} resultado{resultsCount === 1 ? "" : "s"}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-10 items-center border border-hairline bg-white px-3 text-[11px] font-black uppercase text-ink transition hover:bg-primary"
            >
              Limpiar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function useCatalogGridColumns() {
  const [columns, setColumns] = React.useState(2);

  React.useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const sm = window.matchMedia("(min-width: 640px)");

    const compute = () => {
      if (lg.matches) return 5;
      if (sm.matches) return 3;
      return 2;
    };

    const onChange = () => setColumns(compute());
    onChange();

    lg.addEventListener("change", onChange);
    sm.addEventListener("change", onChange);

    return () => {
      lg.removeEventListener("change", onChange);
      sm.removeEventListener("change", onChange);
    };
  }, []);

  return columns;
}

function CatalogExperienceContent({ items }: CatalogExperienceProps) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get(CATALOG_CATEGORY_QUERY_KEY);

  const [garmentFilter, setGarmentFilter] = React.useState<GarmentFilterKey>("all");
  const [sortBy, setSortBy] = React.useState<SortKey>("best_sellers");
  const [query, setQuery] = React.useState("");

  const category = React.useMemo<CatalogCategoryFilterValue>(
    () => parseCatalogCategory(categoryParam),
    [categoryParam]
  );

  const enriched = React.useMemo<EnrichedCatalogItem[]>(
    () =>
      items.map((item) => ({
        ...item,
        categoryKey: normalizeCategoryKey(item.category),
        garmentTypeKey: normalizeGarmentType(item.garmentType),
      })),
    [items]
  );

  const cleanedQuery = React.useMemo(() => normalizeText(query), [query]);

  const filtered = React.useMemo(() => {
    return enriched.filter((item) => {
      if (category !== "all" && item.categoryKey !== category) return false;
      if (garmentFilter !== "all" && item.garmentTypeKey !== garmentFilter) return false;
      if (!cleanedQuery) return true;

      const searchable = normalizeText(
        `${item.name} ${item.slug} ${item.categoryKey} ${item.garmentTypeKey}`
      );
      return searchable.includes(cleanedQuery);
    });
  }, [category, cleanedQuery, enriched, garmentFilter]);

  const sortedFiltered = React.useMemo(() => sortItems(filtered, sortBy), [filtered, sortBy]);

  const bestSellers = React.useMemo(
    () => decorateBestSellerCards(sortItems(enriched, "best_sellers").slice(0, 12)),
    [enriched]
  );

  const conjuntos = React.useMemo(() => {
    return buildConjuntos(enriched).map((set) => ({
      ...set,
      items: decorateCatalogCards(set.items),
    }));
  }, [enriched]);

  const categoryOnlyView = category !== "all";
  const hasActiveFilters = garmentFilter !== "all" || sortBy !== "best_sellers" || query.length > 0;
  const catalogGridColumns = useCatalogGridColumns();
  const catalogBatchSize = catalogGridColumns * 2;
  const [catalogBatchPage, setCatalogBatchPage] = React.useState(1);

  React.useEffect(() => {
    queueMicrotask(() => setCatalogBatchPage(1));
  }, [category, garmentFilter, sortBy, query]);

  const decoratedSortedFiltered = React.useMemo(
    () => decorateCatalogCards(sortedFiltered),
    [sortedFiltered]
  );

  const visibleCatalogCount = React.useMemo(
    () => Math.min(decoratedSortedFiltered.length, catalogBatchPage * catalogBatchSize),
    [catalogBatchPage, catalogBatchSize, decoratedSortedFiltered.length]
  );
  const visibleCatalogItems = React.useMemo(
    () => decoratedSortedFiltered.slice(0, visibleCatalogCount),
    [decoratedSortedFiltered, visibleCatalogCount]
  );
  const canLoadMoreCatalogItems = visibleCatalogCount < decoratedSortedFiltered.length;

  return (
    <main className="w-full">
      <header className="border-b border-hairline bg-charcoal py-12 text-white sm:py-16">
        <div className="saut-container flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase text-primary">Colección SAUT</p>
            <h1 className="saut-display mt-2 text-[clamp(46px,8vw,92px)] leading-[.9] uppercase">
              Catálogo
            </h1>
            <p className="mt-4 max-w-[58ch] text-base leading-7 text-white/68">
              Diseños listos para vestir en las siluetas, colores y gramajes de la marca.
            </p>
          </div>
          <Link href="/personalizar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-primary px-6 text-xs font-black uppercase text-ink transition hover:bg-primary/90 self-start sm:self-auto">
            Crear mi diseño <ArrowRight size={18} />
          </Link>
        </div>
      </header>

      <div className="saut-container space-y-16 py-12 sm:py-16">
        {categoryOnlyView ? (
          <section className="overflow-visible border border-hairline bg-white">
            <CatalogFiltersTab
              garmentFilter={garmentFilter}
              sortBy={sortBy}
              query={query}
              resultsCount={sortedFiltered.length}
              hasActiveFilters={hasActiveFilters}
              onGarmentFilterChange={setGarmentFilter}
              onSortChange={setSortBy}
              onQueryChange={setQuery}
              onReset={() => {
                setGarmentFilter("all");
                setSortBy("best_sellers");
                setQuery("");
              }}
            />

            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-info" />
                <h2 className="saut-display text-2xl uppercase">Productos</h2>
              </div>

              {sortedFiltered.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {decoratedSortedFiltered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <CatalogEmptyState onReset={() => {
                  setGarmentFilter("all");
                  setSortBy("best_sellers");
                  setQuery("");
                }} />
              )}
            </div>
          </section>
        ) : (
          <section className="space-y-16">
            {bestSellers.length ? (
              <section>
                <div className="mb-7 inline-flex items-center gap-3">
                  <ShirtBadgeIcon className="h-6 w-6 text-info" />
                  <div>
                    <p className="saut-kicker">Los favoritos</p>
                    <h2 className="saut-display mt-1 text-4xl uppercase">Más vendidos</h2>
                  </div>
                </div>
                <ProductCarousel products={bestSellers} intervalMs={4300} />
              </section>
            ) : null}

            {conjuntos.length ? (
              <section className="border-y border-hairline py-12">
                <div className="mb-7 inline-flex items-center gap-3">
                  <StitchLineIcon className="h-6 w-6 text-info" />
                  <h2 className="saut-display text-4xl uppercase">Conjuntos</h2>
                </div>
                <div className="grid gap-10">
                  {conjuntos.map((set) => (
                    <div key={set.id}>
                      <h3 className="mb-4 text-sm font-extrabold uppercase text-charcoal">{set.title}</h3>
                      <ProductCarousel products={set.items} intervalMs={4600} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="overflow-visible border border-hairline bg-white">
              <CatalogFiltersTab
                garmentFilter={garmentFilter}
                sortBy={sortBy}
                query={query}
                resultsCount={sortedFiltered.length}
                hasActiveFilters={hasActiveFilters}
                onGarmentFilterChange={setGarmentFilter}
                onSortChange={setSortBy}
                onQueryChange={setQuery}
                onReset={() => {
                  setGarmentFilter("all");
                  setSortBy("best_sellers");
                  setQuery("");
                }}
              />

              <div className="p-4 sm:p-6">
                <div className="mb-4 inline-flex items-center gap-2">
                  <StitchLineIcon className="h-5 w-5 text-info" />
                  <h2 className="saut-display text-2xl uppercase">Catálogo completo</h2>
                </div>

                {sortedFiltered.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {visibleCatalogItems.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <CatalogEmptyState onReset={() => {
                    setGarmentFilter("all");
                    setSortBy("best_sellers");
                    setQuery("");
                  }} />
                )}

                {canLoadMoreCatalogItems ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setCatalogBatchPage((prev) => prev + 1)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-6 text-xs font-black uppercase text-ink transition hover:bg-soft-cloud/60"
                    >
                      Ver más
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

function CatalogEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="grid min-h-64 place-items-center border border-dashed border-hairline bg-soft-cloud px-6 py-12 text-center">
      <div>
        <p className="saut-display text-2xl uppercase">Aún no hay piezas aquí</p>
        <p className="mx-auto mt-2 max-w-[48ch] text-sm leading-6 text-mute">
          Prueba otra categoría o crea una prenda desde cero en el estudio SAUT.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onReset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-6 text-xs font-black uppercase text-ink transition hover:bg-soft-cloud/60">
            Limpiar filtros
          </button>
          <Link href="/personalizar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-primary px-6 text-xs font-black uppercase text-ink transition hover:bg-primary/90">
            Crear diseño <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CatalogExperience(props: CatalogExperienceProps) {
  return (
    <React.Suspense fallback={<div className="min-h-[32vh]" />}>
      <CatalogExperienceContent {...props} />
    </React.Suspense>
  );
}
