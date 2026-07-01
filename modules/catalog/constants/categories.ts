export const CATALOG_CATEGORY_QUERY_KEY = "categoria";

export const CATALOG_CATEGORY_KEYS = [
  "music_artists",
  "sports",
  "vehicles",
  "trends",
  "duo",
  "series_movies_videogames",
  "cities_countries",
  "amor_amistad",
  "navidad",
  "halloween",
  "dia_de_muertos",
] as const;

export type CatalogCategoryKey = (typeof CATALOG_CATEGORY_KEYS)[number];
export type CatalogCategoryFilterValue = "all" | CatalogCategoryKey;

const LEGACY_CATEGORY_ALIASES: Record<string, CatalogCategoryKey> = {
  seasons: "navidad",
  temporada: "navidad",
  temporadas: "navidad",
};

export const CATALOG_CATEGORY_META: Array<{
  value: CatalogCategoryKey;
  label: string;
  helper: string;
  icon: string;
}> = [
  {
    value: "music_artists",
    label: "Musica y artistas",
    helper: "Ritmo, portadas y cultura sonora.",
    icon: "*",
  },
  {
    value: "sports",
    label: "Deportes",
    helper: "Futbol, motorsport y cultura competitiva.",
    icon: "*",
  },
  {
    value: "vehicles",
    label: "Vehiculos",
    helper: "Street mechanics, rutas y velocidad.",
    icon: "*",
  },
  {
    value: "trends",
    label: "Tendencias",
    helper: "Lo que esta moviendo el feed ahora.",
    icon: "*",
  },
  {
    value: "duo",
    label: "En duo",
    helper: "Piezas pensadas para combinar.",
    icon: "*",
  },
  {
    value: "series_movies_videogames",
    label: "Series, peliculas y videojuegos",
    helper: "Universos, personajes y nostalgia pop.",
    icon: "*",
  },
  {
    value: "cities_countries",
    label: "Ciudades y paises",
    helper: "Identidad local y codigos globales.",
    icon: "*",
  },
  {
    value: "amor_amistad",
    label: "Amor y amistad",
    helper: "Capsulas para febrero y fechas romanticas.",
    icon: "*",
  },
  {
    value: "navidad",
    label: "Navidad",
    helper: "Colecciones de fin de anio.",
    icon: "*",
  },
  {
    value: "halloween",
    label: "Halloween",
    helper: "Disenos de terror y temporada spooky.",
    icon: "*",
  },
  {
    value: "dia_de_muertos",
    label: "Dia de muertos",
    helper: "Graficas culturales para temporada.",
    icon: "*",
  },
];

export function parseCatalogCategory(value: string | null | undefined): CatalogCategoryFilterValue {
  if (!value) return "all";
  const normalized = value.trim().toLowerCase();
  if (normalized === "all") return "all";

  const legacy = LEGACY_CATEGORY_ALIASES[normalized];
  if (legacy) return legacy;

  if ((CATALOG_CATEGORY_KEYS as readonly string[]).includes(normalized)) {
    return normalized as CatalogCategoryKey;
  }
  return "all";
}

export function buildCatalogCategoryHref(category: CatalogCategoryFilterValue): string {
  if (category === "all") return "/catalogo";
  return `/catalogo?${CATALOG_CATEGORY_QUERY_KEY}=${encodeURIComponent(category)}`;
}
