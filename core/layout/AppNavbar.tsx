"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    ShoppingBag,
    UserRound,
    X,
} from "lucide-react";

import { useCart } from "@/core/cart";
import {
    clearSession,
    getSession,
    syncSessionFromServer,
} from "@/modules/auth/client/session";
import {
    buildCatalogCategoryHref,
    CATALOG_CATEGORY_META,
    CATALOG_CATEGORY_QUERY_KEY,
    parseCatalogCategory,
} from "@/modules/catalog/constants/categories";

type AppNavbarProps = {
    onLoginRequested?: () => void;
};

const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/catalogo", label: "CatÃ¡logo" },
    { href: "/personalizar", label: "Personaliza" },
    { href: "/sobre-nosotros", label: "La marca" },
    { href: "/contacto", label: "Contacto" },
];

const subscribeToHydration = () => () => undefined;

function useHasHydrated() {
    return React.useSyncExternalStore(
        subscribeToHydration,
        () => true,
        () => false
    );
}

function useAuthState() {
    const [state, setState] = React.useState({ loggedIn: false, isAdmin: false });

    React.useEffect(() => {
        const sync = () => {
            const session = getSession();
            setState({
                loggedIn: Boolean(session),
                isAdmin: session?.actorType === "admin",
            });
        };

        sync();
        void syncSessionFromServer().then(sync).catch(() => undefined);

        const onStorage = (event: StorageEvent) => {
            if (event.key === "login" || event.key === "saut.auth.session") sync();
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener("saut:auth", sync);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("saut:auth", sync);
        };
    }, []);

    return state;
}

export function AppNavbar({ onLoginRequested }: AppNavbarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { openCart, itemCount } = useCart();
    const hasHydrated = useHasHydrated();
    const visibleItemCount = hasHydrated ? itemCount : 0;
    const { loggedIn, isAdmin } = useAuthState();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [profileOpen, setProfileOpen] = React.useState(false);
    const rootRef = React.useRef<HTMLElement | null>(null);

    const isCatalogRoute = pathname.startsWith("/catalogo");
    const activeCategory = parseCatalogCategory(
        searchParams.get(CATALOG_CATEGORY_QUERY_KEY)
    );

    React.useEffect(() => {
        queueMicrotask(() => {
            setMobileOpen(false);
            setProfileOpen(false);
        });
    }, [pathname, searchParams]);

    React.useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMobileOpen(false);
                setProfileOpen(false);
            }
        };
        const onPointerDown = (event: PointerEvent) => {
            if (
                rootRef.current &&
                event.target instanceof Node &&
                !rootRef.current.contains(event.target)
            ) {
                setMobileOpen(false);
                setProfileOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("pointerdown", onPointerDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, []);

    const isActive = (href: string) =>
        href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);

    const openProfile = () => {
        setMobileOpen(false);
        if (!loggedIn) {
            onLoginRequested?.();
            return;
        }
        setProfileOpen((current) => !current);
    };

    const logout = () => {
        clearSession();
        setProfileOpen(false);
    };

    const iconButton =
        "relative inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-transparent text-ink transition-colors hover:border-hairline hover:bg-hairline-soft";

    return (
        <nav ref={rootRef} aria-label="NavegaciÃ³n principal" className="relative bg-soft-cloud">
            <div className="saut-container flex h-[72px] items-center gap-4">
                <Link href="/" aria-label="SAUT, ir al inicio" className="shrink-0">
                    <Image
                        src="/logo.webp"
                        alt="SAUT Street Wear"
                        width={160}
                        height={56}
                        priority
                        className="h-12 w-auto object-contain"
                    />
                </Link>

                <div className="ml-auto hidden items-center gap-1 lg:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={isActive(link.href) ? "page" : undefined}
                            className={[
                                "relative inline-flex h-11 items-center px-3 text-[13px] font-extrabold uppercase transition-colors",
                                "after:absolute after:inset-x-3 after:bottom-1 after:h-[3px] after:origin-left after:bg-primary after:transition-transform",
                                isActive(link.href)
                                    ? "text-charcoal after:scale-x-100"
                                    : "text-[rgba(8,10,13,.72)] after:scale-x-0 hover:text-ink hover:after:scale-x-100",
                            ].join(" ")}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-1 lg:ml-3">
                    {isAdmin ? (
                        <Link href="/dashboard" aria-label="Abrir dashboard" className={iconButton}>
                            <LayoutDashboard size={21} strokeWidth={1.9} />
                        </Link>
                    ) : null}

                    <div className="relative">
                        <button
                            type="button"
                            onClick={openProfile}
                            aria-label={loggedIn ? "Abrir perfil" : "Iniciar sesiÃ³n"}
                            aria-haspopup={loggedIn ? "menu" : "dialog"}
                            aria-expanded={loggedIn ? profileOpen : undefined}
                            className={iconButton}
                        >
                            <UserRound size={22} strokeWidth={1.9} />
                        </button>

                        {loggedIn ? (
                            <div
                                role="menu"
                                aria-label="Cuenta"
                                className={[
                                    "absolute right-0 top-[calc(100%+10px)] z-50 w-56 border border-hairline bg-white p-2 shadow-[0_18px_50px_rgba(8,10,13,.16)] transition",
                                    profileOpen
                                        ? "visible translate-y-0 opacity-100"
                                        : "invisible -translate-y-1 opacity-0",
                                ].join(" ")}
                            >
                                <Link
                                    role="menuitem"
                                    href="/mis-ordenes"
                                    className="flex min-h-11 items-center gap-3 px-3 text-sm font-bold hover:bg-hairline-soft"
                                >
                                    <Package size={18} /> Mis Ã³rdenes
                                </Link>
                                {isAdmin ? (
                                    <Link
                                        role="menuitem"
                                        href="/dashboard"
                                        className="flex min-h-11 items-center gap-3 px-3 text-sm font-bold hover:bg-hairline-soft"
                                    >
                                        <LayoutDashboard size={18} /> Dashboard
                                    </Link>
                                ) : null}
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={logout}
                                    className="flex min-h-11 w-full items-center gap-3 border-t border-hairline px-3 text-left text-sm font-bold text-sale-deep hover:bg-red-50"
                                >
                                    <LogOut size={18} /> Cerrar sesiÃ³n
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={openCart}
                        aria-label={`Abrir carrito, ${visibleItemCount} productos`}
                        className={iconButton}
                    >
                        <ShoppingBag size={22} strokeWidth={1.9} />
                        {visibleItemCount > 0 ? (
                            <span className="absolute right-0 top-0 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-ink">
                                {visibleItemCount > 99 ? "99+" : visibleItemCount}
                            </span>
                        ) : null}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMobileOpen((current) => !current);
                            setProfileOpen(false);
                        }}
                        aria-label={mobileOpen ? "Cerrar menÃº" : "Abrir menÃº"}
                        aria-expanded={mobileOpen}
                        className={`${iconButton} lg:hidden`}
                    >
                        {mobileOpen ? <X size={23} /> : <Menu size={23} />}
                    </button>
                </div>
            </div>

            <div
                className={[
                    "absolute inset-x-0 top-full z-40 border-y border-hairline bg-white shadow-[0_18px_40px_rgba(8,10,13,.14)] transition lg:hidden",
                    mobileOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-2 opacity-0",
                ].join(" ")}
            >
                <div className="saut-container grid py-3">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={isActive(link.href) ? "page" : undefined}
                            className={[
                                "flex min-h-12 items-center border-b border-hairline px-2 text-sm font-extrabold uppercase",
                                isActive(link.href) ? "text-info" : "text-ink",
                            ].join(" ")}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>

            {isCatalogRoute ? (
                <div className="border-t border-hairline bg-white">
                    <div className="saut-container overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex w-max min-w-full items-center gap-1.5">
                            <Link
                                href={buildCatalogCategoryHref("all")}
                                aria-current={activeCategory === "all" ? "page" : undefined}
                                className={[
                                    "inline-flex min-h-11 items-center whitespace-nowrap rounded-[6px] px-3 text-xs font-extrabold uppercase transition-colors",
                                    activeCategory === "all"
                                        ? "bg-charcoal text-white"
                                        : "bg-hairline-soft text-ink hover:bg-primary",
                                ].join(" ")}
                            >
                                Todo
                            </Link>
                            {CATALOG_CATEGORY_META.map((category) => {
                                const active = activeCategory === category.value;
                                return (
                                    <Link
                                        key={category.value}
                                        href={buildCatalogCategoryHref(category.value)}
                                        aria-current={active ? "page" : undefined}
                                        className={[
                                            "inline-flex min-h-11 items-center whitespace-nowrap rounded-[6px] px-3 text-xs font-extrabold uppercase transition-colors",
                                            active
                                                ? "bg-charcoal text-white"
                                                : "bg-hairline-soft text-ink hover:bg-primary",
                                        ].join(" ")}
                                    >
                                        {category.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}
        </nav>
    );
}
