import { redirect } from "next/navigation";

import {
  adjustInventoryQuantityAction,
  createInventoryEntryAction,
} from "./actions";
import { InventoryDashboardClient } from "./InventoryDashboardClient";
import { ensureDashboardModuleAccess } from "@/modules/dashboard/auth/server/access";
import {
  listInventoryItems,
  listInventoryMovements,
} from "@/modules/dashboard/inventory/server/api";

export default async function DashboardInventarioPage() {
  const access = await ensureDashboardModuleAccess("inventario");
  if (!access) {
    redirect("/dashboard");
  }

  const [items, movements] = await Promise.all([
    listInventoryItems({ limit: 200 }),
    listInventoryMovements({ limit: 200 }),
  ]);

  return (
    <InventoryDashboardClient
      items={items.items}
      totalItems={items.total}
      movements={movements.items}
      totalMovements={movements.total}
      actions={{
        createInventoryEntryAction,
        adjustInventoryQuantityAction,
      }}
    />
  );
}
