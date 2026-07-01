import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_TOKEN_COOKIE } from "@/modules/auth/server/cookies";

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

export type AuthMeResponse = {
  account_id: string;
  actor_type: string;
  status: string;
  display_name: string | null;
  primary_email: string | null;
  roles: string[];
  permissions: string[];
};

export async function getServerAuthMe() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as Partial<AuthMeResponse>;
  return {
    account_id: String(payload.account_id ?? ""),
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
