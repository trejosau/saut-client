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
  actorTypes: string[];
};

const MODULE_RULES: ModuleRule[] = [
  {
    key: "catalogo",
    href: "/dashboard/catalogo",
    title: "Catalogo Interno",
    description: "Publicaciones, visibilidad, assets, drops y colecciones.",
    anyPermissions: [{ screen: "catalog", action: "publish" }],
    actorTypes: ["admin"],
  },
  {
    key: "inventario",
    href: "/dashboard/inventario",
    title: "Inventario",
    description: "Entradas, ajustes y movimientos de stock.",
    anyPermissions: [{ screen: "inventory", action: "adjust" }],
    actorTypes: ["admin", "operation", "ops"],
  },
  {
    key: "pedidos",
    href: "/dashboard/pedidos",
    title: "Pedidos",
    description: "Pedido y flujo del pedido por ítem.",
    anyPermissions: [
      { screen: "orders", action: "state_update" },
      { screen: "work_orders", action: "merma_record" },
    ],
    actorTypes: ["admin", "designer", "operation", "ops"],
  },
  {
    key: "envios",
    href: "/dashboard/envios",
    title: "Envios",
    description: "Nacional (tracking) y local (reparto/manual).",
    anyPermissions: [{ screen: "shipping", action: "update_local_address" }],
    actorTypes: ["admin", "operation", "ops"],
  },
  {
    key: "soporte",
    href: "/dashboard/soporte",
    title: "Soporte",
    description: "Casos, mensajes, estados y acciones de reembolso.",
    anyPermissions: [{ screen: "orders", action: "state_update" }],
    actorTypes: ["admin", "support"],
  },
  {
    key: "analitica",
    href: "/dashboard/analitica",
    title: "Analitica y Mapa",
    description: "KPIs y pings realtime con scope reutilizable.",
    anyPermissions: [{ screen: "auth", action: "audit_read" }],
    actorTypes: ["admin"],
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
    actorTypes: ["admin"],
  },
];

function hasPermission(
  permissions: string[],
  screen: string,
  action: string
): boolean {
  const wanted = `${screen.toLowerCase()}:${action.toLowerCase()}`;
  const byScreen = `${screen.toLowerCase()}:*`;
  const lowered = new Set(permissions.map((item) => item.toLowerCase().trim()));
  return lowered.has("*:*") || lowered.has(byScreen) || lowered.has(wanted);
}

function isRuleAllowed(me: AuthMeResponse, rule: ModuleRule): boolean {
  const actor = me.actor_type.trim().toLowerCase();
  if (actor === "admin") return true;

  if (rule.actorTypes.includes(actor)) {
    return true;
  }

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
  if (access.me.actor_type.toLowerCase() === "admin") return access;

  const allowed = access.modules.some((module) => module.key === moduleKey);
  if (!allowed) return null;
  return access;
}
