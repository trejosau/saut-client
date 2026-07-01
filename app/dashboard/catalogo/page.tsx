import { redirect } from "next/navigation";

import {
  createCollectionAction,
  createDesignAction,
  createDesignVariantAction,
  createDropAction,
  createInformativeImageOverrideAction,
  createPublicationAction,
  createPublicationMockupAction,
  endDropNowAction,
  publishPublicationAction,
  replaceCollectionItemsAction,
  replaceDropItemsAction,
  unpublishPublicationAction,
  updateCollectionAction,
  updateDesignAction,
  updateDesignVariantAction,
  updateDropAction,
  updatePublicationAction,
} from "./actions";
import { CatalogDashboardClient } from "./CatalogDashboardClient";
import { ensureDashboardModuleAccess } from "@/modules/dashboard/auth/server/access";
import {
  getAdminCollection,
  getAdminDrop,
  listAdminCollections,
  listAdminDesigns,
  listAdminDesignVariants,
  listAdminDrops,
  listAdminPublications,
} from "@/modules/dashboard/catalog/server/api";

export default async function DashboardCatalogoPage() {
  const access = await ensureDashboardModuleAccess("catalogo");
  if (!access) {
    redirect("/");
  }

  const [collections, drops, publications, designs, variants] = await Promise.all([
    listAdminCollections(),
    listAdminDrops(),
    listAdminPublications({ limit: 120 }),
    listAdminDesigns({ limit: 150 }),
    listAdminDesignVariants(),
  ]);

  const [collectionDetails, dropDetails] = await Promise.all([
    Promise.allSettled(collections.map((collection) => getAdminCollection(collection.id))),
    Promise.allSettled(drops.map((drop) => getAdminDrop(drop.id))),
  ]);

  const collectionItemIdsByCollectionId: Record<string, string[]> = {};
  for (const result of collectionDetails) {
    if (result.status !== "fulfilled") continue;
    collectionItemIdsByCollectionId[result.value.collection.id] = result.value.items.map(
      (publication) => publication.id
    );
  }

  const dropItemIdsByDropId: Record<string, string[]> = {};
  for (const result of dropDetails) {
    if (result.status !== "fulfilled") continue;
    dropItemIdsByDropId[result.value.drop.id] = result.value.items.map((publication) => publication.id);
  }

  return (
    <CatalogDashboardClient
      collections={collections}
      drops={drops}
      publications={publications}
      designs={designs}
      variants={variants}
      collectionItemIdsByCollectionId={collectionItemIdsByCollectionId}
      dropItemIdsByDropId={dropItemIdsByDropId}
      actions={{
        createCollectionAction,
        createDesignAction,
        createDesignVariantAction,
        createDropAction,
        createInformativeImageOverrideAction,
        createPublicationAction,
        createPublicationMockupAction,
        endDropNowAction,
        publishPublicationAction,
        replaceCollectionItemsAction,
        replaceDropItemsAction,
        unpublishPublicationAction,
        updateCollectionAction,
        updateDesignAction,
        updateDesignVariantAction,
        updateDropAction,
        updatePublicationAction,
      }}
    />
  );
}
