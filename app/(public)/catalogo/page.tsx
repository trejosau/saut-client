import CatalogExperience, {
  type CatalogExperienceItem,
} from "@/modules/catalog/ui/CatalogExperience";
import {
  fetchCatalogPublications,
  publicationToProductCard,
} from "@/modules/catalog/client/api";

export default async function CatalogoPage() {
  const publications = await fetchCatalogPublications({ sort: "best_sellers" });
  const items: CatalogExperienceItem[] = publications.map((publication) => {
    const card = publicationToProductCard(publication);
    return {
      ...card,
      slug: publication.slug,
      category: publication.category,
      garmentType: publication.garment_type,
      sortRank: publication.sort_rank,
    };
  });

  return <CatalogExperience items={items} />;
}
