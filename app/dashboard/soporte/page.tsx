import { redirect } from "next/navigation";

import {
  addSupportMessageAction,
  registerSupportRefundAction,
  updateSupportCaseStatusAction,
} from "./actions";
import { SoporteDashboardClient } from "./SoporteDashboardClient";
import { ensureDashboardModuleAccess } from "@/modules/dashboard/auth/server/access";
import { getAdminSupportCase, listAdminSupportCases } from "@/modules/dashboard/support/server/api";

type DashboardSoportePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardSoportePage({
  searchParams,
}: DashboardSoportePageProps) {
  const access = await ensureDashboardModuleAccess("soporte");
  if (!access) {
    redirect("/dashboard");
  }

  const cases = await listAdminSupportCases({ limit: 30 });
  const params = (await searchParams) ?? {};
  const requestedCaseId = firstValue(params.case);
  const fallbackCaseId = cases.items[0]?.id ?? null;
  const focusCaseId = requestedCaseId || fallbackCaseId;
  const focusedCase =
    focusCaseId
      ? await getAdminSupportCase(focusCaseId).catch(() => null)
      : null;

  return (
    <SoporteDashboardClient
      cases={cases.items}
      casesTotal={cases.total}
      focusedCase={focusedCase}
      actions={{
        updateSupportCaseStatusAction,
        addSupportMessageAction,
        registerSupportRefundAction,
      }}
    />
  );
}
