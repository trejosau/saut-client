// core/layout/AppShell.tsx
import type { ReactNode } from "react";

type AppShellProps = {
    header?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;

    /** Controla el layout del contenido */
    mainClassName?: string;
};

const DEFAULT_MAIN_CLASS =
    "flex-1 mx-auto w-full max-w-6xl px-6 py-10";

export function AppShell({ header, footer, children, mainClassName }: AppShellProps) {
    return (
        <div className="min-h-dvh bg-(--bg) text-(--text) flex flex-col">
            {header}

            {/* flex-1 asegura que el footer quede pegado abajo sin “líneas” extra */}
            <main className={mainClassName ?? DEFAULT_MAIN_CLASS}>{children}</main>

            {footer}
        </div>
    );
}
