import { getServerAuthMe, type AuthMeResponse } from "@/modules/auth/server/auth";

export type DashboardModuleKey =
  | "catalogo"
  | "inventario"
  | "pedidos"
  | "envios"
  | "soporte"
  | "analitica"
  | "permisos";

export type DashboardModule = {
  key: DashboardModuleKey;
  href: string;
  title: string;
  description: string;
};

type PermissionPair = {
  screen: string;
  action: string;
};

type ModuleRule = DashboardModule & {
  anyPermissions: PermissionPair[];
};

const MODULE_RULES: ModuleRule[] = [
  {
    key: "catalogo",
    href: "/dashboard/catalogo",
    title: "Catalogo Interno",
    description: "Publicaciones, visibilidad, assets, drops y colecciones.",
    anyPermissions: [{ screen: "catalog", action: "read" }],
  },
  {
    key: "inventario",
    href: "/dashboard/inventario",
    title: "Inventario",
    description: "Entradas, ajustes y movimientos de stock.",
    anyPermissions: [{ screen: "inventory", action: "read" }],
  },
  {
    key: "pedidos",
    href: "/dashboard/pedidos",
    title: "Pedidos",
    description: "Pedido y flujo del pedido por ítem.",
    anyPermissions: [{ screen: "orders", action: "read" }],
  },
  {
    key: "envios",
    href: "/dashboard/envios",
    title: "Envios",
    description: "Nacional (tracking) y local (reparto/manual).",
    anyPermissions: [{ screen: "shipping", action: "read" }],
  },
  {
    key: "soporte",
    href: "/dashboard/soporte",
    title: "Soporte",
    description: "Casos, mensajes, estados y acciones de reembolso.",
    anyPermissions: [{ screen: "support", action: "read" }],
  },
  {
    key: "analitica",
    href: "/dashboard/analitica",
    title: "Analitica y Mapa",
    description: "KPIs y pings realtime con scope reutilizable.",
    anyPermissions: [{ screen: "analytics", action: "read" }],
  },
  {
    key: "permisos",
    href: "/dashboard/permisos-auditoria",
    title: "Permisos y Auditoria",
    description: "Bitacora y acceso por cuenta/rol.",
    anyPermissions: [
      { screen: "auth", action: "audit_read" },
      { screen: "auth", action: "rbac_manage" },
    ],
  },
];

function hasPermission(
  permissions: string[],
  screen: string,
  action: string
): boolean {
  const wanted = `${screen.toLowerCase()}:${action.toLowerCase()}`;
  const lowered = new Set(permissions.map((item) => item.toLowerCase().trim()));
  return lowered.has(wanted);
}

function isRuleAllowed(me: AuthMeResponse, rule: ModuleRule): boolean {
  return rule.anyPermissions.some((pair) =>
    hasPermission(me.permissions, pair.screen, pair.action)
  );
}

export async function getDashboardAccess() {
  const me = await getServerAuthMe();
  if (!me) return null;

  const modules = MODULE_RULES.filter((rule) => isRuleAllowed(me, rule)).map(
    ({ key, href, title, description }) => ({
      key,
      href,
      title,
      description,
    })
  );

  return {
    me,
    modules,
  };
}

export async function ensureDashboardModuleAccess(moduleKey: DashboardModuleKey) {
  const access = await getDashboardAccess();
  if (!access) return null;

  const allowed = access.modules.some((module) => module.key === moduleKey);
  if (!allowed) return null;
  return access;
}
