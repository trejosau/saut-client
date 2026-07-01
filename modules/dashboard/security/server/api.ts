import { adminRequest } from "@/modules/dashboard/shared/server/admin-api";

export type AuditLogItem = {
  id: string;
  account_id?: string | null;
  actor_type: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  reason?: string | null;
  payload?: Record<string, unknown> | null;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
};

export type AccountAccess = {
  account_id: string;
  actor_type: string;
  roles: string[];
  permissions: string[];
};

export type AdminAccountSummary = {
  account_id: string;
  actor_type: string;
  status: string;
  display_name?: string | null;
  primary_email?: string | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  roles: string[];
};

export type AdminRoleCatalogItem = {
  code: string;
  name: string;
  description?: string | null;
  is_system: boolean;
};

export type AdminPermissionCatalogItem = {
  screen: string;
  action: string;
  description?: string | null;
};

export async function listAccounts(params?: {
  q?: string;
  status?: string;
  actor_type?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.status) search.set("status", params.status);
  if (params?.actor_type) search.set("actor_type", params.actor_type);
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();

  return adminRequest<AdminAccountSummary[]>({
    path: `/admin/auth/accounts${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function listRolesCatalog() {
  return adminRequest<AdminRoleCatalogItem[]>({
    path: "/admin/auth/roles",
    method: "GET",
  });
}

export async function listPermissionsCatalog() {
  return adminRequest<AdminPermissionCatalogItem[]>({
    path: "/admin/auth/permissions",
    method: "GET",
  });
}

export async function listAuditLog(params?: {
  account_id?: string;
  actor_type?: string;
  action?: string;
  resource_type?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.account_id) search.set("account_id", params.account_id);
  if (params?.actor_type) search.set("actor_type", params.actor_type);
  if (params?.action) search.set("action", params.action);
  if (params?.resource_type) search.set("resource_type", params.resource_type);
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();

  return adminRequest<AuditLogItem[]>({
    path: `/admin/auth/audit-log${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function getAccountAccess(accountId: string) {
  return adminRequest<AccountAccess>({
    path: `/admin/auth/accounts/${accountId}/access`,
    method: "GET",
  });
}

export async function assignRole(accountId: string, roleCode: string) {
  return adminRequest<AccountAccess>({
    path: `/admin/auth/accounts/${accountId}/roles`,
    method: "POST",
    body: JSON.stringify({
      role_code: roleCode,
    }),
  });
}

export async function removeRole(accountId: string, roleCode: string) {
  return adminRequest<AccountAccess>({
    path: `/admin/auth/accounts/${accountId}/roles/${roleCode}`,
    method: "DELETE",
  });
}

export async function upsertPermissionOverride(input: {
  account_id: string;
  screen: string;
  action: string;
  effect: "allow" | "deny";
  reason?: string;
}) {
  return adminRequest<AccountAccess>({
    path: `/admin/auth/accounts/${input.account_id}/permission-overrides`,
    method: "POST",
    body: JSON.stringify({
      screen: input.screen,
      action: input.action,
      effect: input.effect,
      reason: input.reason,
    }),
  });
}

export async function removePermissionOverride(input: {
  account_id: string;
  screen: string;
  action: string;
}) {
  return adminRequest<AccountAccess>({
    path: `/admin/auth/accounts/${input.account_id}/permission-overrides/${input.screen}/${input.action}`,
    method: "DELETE",
  });
}

export async function updateAccountStatus(input: {
  account_id: string;
  status: string;
  reason?: string;
}) {
  return adminRequest<AdminAccountSummary>({
    path: `/admin/auth/accounts/${input.account_id}/status`,
    method: "POST",
    body: JSON.stringify({
      status: input.status,
      reason: input.reason,
    }),
  });
}
