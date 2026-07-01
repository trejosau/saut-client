// app/(public)/layout.tsx
import type { ReactNode } from "react";
import { AppShell } from "@/core/layout/AppShell";
import { LandingHeader } from "@/core/layout/LandingHeader";
import { LandingFooter } from "@/core/layout/LandingFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <AppShell
            header={<LandingHeader />}
            footer={<LandingFooter />}
            mainClassName="flex-1 w-full p-0"
        >
            {children}
        </AppShell>
    );
}
