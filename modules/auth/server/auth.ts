import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requestJson } from "@/core/lib/api/fetcher";
import { getServerApiBaseUrl } from "@/core/lib/config/env";
import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

export type AuthMeResponse = {
  account_id: string;
  session_id: string;
  actor_type: string;
  status: string;
  display_name: string | null;
  primary_email: string | null;
  roles: string[];
  permissions: string[];
};

export async function getServerAuthMeWithToken(accessToken: string) {
  let payload: Partial<AuthMeResponse>;
  try {
    payload = await requestJson<Partial<AuthMeResponse>>(`${getServerApiBaseUrl().replace(/\/$/, "")}/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  return {
    account_id: String(payload.account_id ?? ""),
    session_id: String(payload.session_id ?? ""),
    actor_type: String(payload.actor_type ?? ""),
    status: String(payload.status ?? ""),
    display_name: payload.display_name ?? null,
    primary_email: payload.primary_email ?? null,
    roles: Array.isArray(payload.roles)
      ? payload.roles.map((item) => String(item))
      : [],
    permissions: Array.isArray(payload.permissions)
      ? payload.permissions.map((item) => String(item))
      : [],
  };
}

export async function getServerAuthMe() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;
  return getServerAuthMeWithToken(accessToken);
}

export async function requireAdminUser() {
  const me = await getServerAuthMe();
  if (!me || me.actor_type.toLowerCase() !== "admin") {
    redirect("/");
  }
  return me;
}

function isDashboardActorType(actorType: string): boolean {
  const normalized = actorType.trim().toLowerCase();
  if (!normalized) return false;
  return normalized !== "guest";
}

export async function requireDashboardUser() {
  const me = await getServerAuthMe();
  const hasStaffSignals = Boolean(
    me &&
      (me.actor_type.toLowerCase() !== "customer" ||
        me.roles.length > 0 ||
        me.permissions.length > 0)
  );
  if (!me || !isDashboardActorType(me.actor_type) || !hasStaffSignals) {
    redirect("/");
  }
  return me;
}
