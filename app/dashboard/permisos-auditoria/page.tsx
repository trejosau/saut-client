import { redirect } from "next/navigation";

import {
  assignRoleAction,
  removePermissionOverrideAction,
  removeRoleAction,
  updateAccountStatusAction,
  upsertPermissionOverrideAction,
} from "./actions";
import { PermisosAuditoriaDashboardClient } from "./PermisosAuditoriaDashboardClient";
import { ensureDashboardModuleAccess } from "@/modules/dashboard/auth/server/access";
import {
  getAccountAccess,
  listAccounts,
  listAuditLog,
  listPermissionsCatalog,
  listRolesCatalog,
} from "@/modules/dashboard/security/server/api";

export default async function DashboardPermisosAuditoriaPage() {
  const access = await ensureDashboardModuleAccess("permisos");
  if (!access) {
    redirect("/dashboard");
  }

  const [audit, meAccess, accounts, rolesCatalog, permissionsCatalog] = await Promise.all([
    listAuditLog({ limit: 500 }),
    getAccountAccess(access.me.account_id).catch(() => null),
    listAccounts({ limit: 320 }).catch(() => []),
    listRolesCatalog().catch(() => []),
    listPermissionsCatalog().catch(() => []),
  ]);

  return (
    <PermisosAuditoriaDashboardClient
      audit={audit}
      meAccess={meAccess}
      accounts={accounts}
      rolesCatalog={rolesCatalog}
      permissionsCatalog={permissionsCatalog}
      actions={{
        assignRoleAction,
        removeRoleAction,
        upsertPermissionOverrideAction,
        removePermissionOverrideAction,
        updateAccountStatusAction,
      }}
    />
  );
}
