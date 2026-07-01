import { redirect } from "next/navigation";

import {
  createNationalShipmentAction,
  markLocalDeliveredAction,
  markLocalFailedAction,
  markLocalOutForDeliveryAction,
  markLocalReadyAction,
  refreshNationalTrackingAction,
  updateLocalAddressAction,
} from "./actions";
import { EnviosDashboardClient } from "./EnviosDashboardClient";
import { ensureDashboardModuleAccess } from "@/modules/dashboard/auth/server/access";
import { listAdminOrders, type PaginatedOrders } from "@/modules/dashboard/orders/server/api";
import {
  getLocalRouteToday,
  listAdminShipments,
  type LocalRouteTodayResponse,
  type PaginatedAdminShipments,
} from "@/modules/dashboard/shipping/server/api";

export default async function DashboardEnviosPage() {
  const access = await ensureDashboardModuleAccess("envios");
  if (!access) {
    redirect("/dashboard");
  }

  const routeDate = new Date().toISOString().slice(0, 10);
  const emptyOrders: PaginatedOrders = {
    items: [],
    total: 0,
    limit: 0,
    offset: 0,
  };
  const [route, nationalOrders, localOrders]: [
    LocalRouteTodayResponse | null,
    PaginatedOrders,
    PaginatedOrders,
  ] = await Promise.all([
    getLocalRouteToday(routeDate).catch(() => null),
    listAdminOrders({ shipping_method: "national", limit: 20 }).catch(() => emptyOrders),
    listAdminOrders({ shipping_method: "local", limit: 20 }).catch(() => emptyOrders),
  ]);
  const emptyShipments: PaginatedAdminShipments = {
    items: [],
    total: 0,
    limit: 0,
    offset: 0,
  };
  const [nationalShipments, localShipments]: [
    PaginatedAdminShipments,
    PaginatedAdminShipments,
  ] = await Promise.all([
    listAdminShipments({ shipping_method: "national", limit: 24 }).catch(() => emptyShipments),
    listAdminShipments({ shipping_method: "local", limit: 24 }).catch(() => emptyShipments),
  ]);

  return (
    <EnviosDashboardClient
      routeDate={routeDate}
      route={route}
      nationalOrders={nationalOrders}
      localOrders={localOrders}
      nationalShipments={nationalShipments}
      localShipments={localShipments}
      actions={{
        createNationalShipmentAction,
        refreshNationalTrackingAction,
        markLocalReadyAction,
        markLocalOutForDeliveryAction,
        markLocalDeliveredAction,
        markLocalFailedAction,
        updateLocalAddressAction,
      }}
    />
  );
}
