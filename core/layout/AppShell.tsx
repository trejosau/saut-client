// core/layout/AppShell.tsx
import type { ReactNode } from "react";

type AppShellProps = {
    header?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;

    /** Controla el layout del contenido. */
    contentClassName?: string;
    /** @deprecated Usa contentClassName. Se conserva para consumidores existentes. */
    mainClassName?: string;
};

const DEFAULT_CONTENT_CLASS =
    "flex-1 mx-auto w-full max-w-6xl px-6 py-10";

export function AppShell({ header, footer, children, contentClassName, mainClassName }: AppShellProps) {
    const resolvedContentClassName = contentClassName ?? mainClassName ?? DEFAULT_CONTENT_CLASS;

    return (
        <div className="flex min-h-dvh flex-col bg-canvas text-ink">
            {header}

            {/* El contenido de cada ruta aporta su propio <main>; este wrapper solo es el destino del skip link. */}
            <div id="main-content" tabIndex={-1} className={resolvedContentClassName}>{children}</div>

            {footer}
        </div>
    );
}
