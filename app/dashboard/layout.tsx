
import type { ReactNode } from "react";

import { AppShell } from "@/core/layout/AppShell";
import { DashboardHeader } from "@/core/layout/DashboardHeader";
import { requireDashboardUser } from "@/modules/auth/server/auth";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireDashboardUser();

  return (
    <AppShell
      header={<DashboardHeader />}
      contentClassName="flex-1 w-full p-0"
    >
      {children}
    </AppShell>
  );
}
