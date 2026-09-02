import Link from "next/link";

import { getDashboardAccess } from "@/modules/dashboard/auth/server/access";

export async function DashboardHeader() {
  const access = await getDashboardAccess();
  const modules = access?.modules ?? [];

  return (
    <header className="border-b border-hairline bg-[rgba(255,255,255,.34)] backdrop-blur-[8px]">
      <div className="w-full px-4 sm:px-8 lg:px-14">
        <div className="min-h-16 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.16em] uppercase text-charcoal">
              SAUT Staff
            </p>
            <p className="text-[18px] font-black tracking-[0.04em] uppercase text-ink">
              Dashboard
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {modules.map((module) => (
              <Link
                key={module.key}
                href={module.href}
                className="inline-flex items-center justify-center rounded-[999px] border border-hairline bg-[rgba(255,255,255,.72)] px-4 py-2 text-[10px] font-black tracking-[0.12em] uppercase text-ink transition hover:bg-white"
              >
                {module.title}
              </Link>
            ))}
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[999px] border border-hairline bg-[rgba(255,255,255,.72)] px-4 py-2 text-[10px] font-black tracking-[0.12em] uppercase text-ink transition hover:bg-white"
            >
              Ir al sitio
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
