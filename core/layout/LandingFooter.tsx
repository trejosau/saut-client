import Image from "next/image";
import Link from "next/link";
import { CreditCard, PackageCheck, Shirt } from "lucide-react";

import { NewsletterForm } from "@/core/layout/NewsletterForm";

const shopLinks = [
    { href: "/catalogo", label: "CatÃ¡logo" },
    { href: "/drops", label: "Drops" },
    { href: "/colecciones", label: "Colecciones" },
    { href: "/personalizar", label: "Personaliza" },
];

const companyLinks = [
    { href: "/sobre-nosotros", label: "La marca" },
    { href: "/contacto", label: "Contacto" },
    { href: "/mis-ordenes", label: "Mis Ã³rdenes" },
];

export function LandingFooter() {
    return (
        <footer className="bg-ink text-white">
            <div className="saut-container py-14 sm:py-16">
                <div className="grid gap-10 border-b border-white/15 pb-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
                    <div>
                        <Image
                            src="/logo.webp"
                            alt="SAUT Street Wear"
                            width={180}
                            height={64}
                            className="h-14 w-auto object-contain"
                        />
                        <h2 className="saut-display mt-6 max-w-[14ch] text-[clamp(32px,5vw,62px)] leading-[.96] uppercase">
                            Hecho para vestir distinto.
                        </h2>
                        <p className="mt-4 max-w-[52ch] text-sm leading-6 text-white/66">
                            Streetwear y prendas personalizadas producidas con atenciÃ³n al detalle.
                        </p>
                    </div>

                    <section aria-labelledby="newsletter-title" className="lg:justify-self-end lg:text-right">
                        <p className="text-xs font-extrabold uppercase text-primary">
                            SuscrÃ­bete
                        </p>
                        <h2 id="newsletter-title" className="saut-display mt-2 text-3xl uppercase">
                            EntÃ©rate de nuestras novedades
                        </h2>
                        <NewsletterForm />
                    </section>
                </div>

                <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
                    <section>
                        <h3 className="text-xs font-extrabold uppercase text-white/48">Compra</h3>
                        <nav aria-label="Compra" className="mt-4 grid gap-3">
                            {shopLinks.map((link) => (
                                <Link key={link.href} href={link.href} className="w-fit text-sm font-bold hover:text-primary">
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </section>

                    <section>
                        <h3 className="text-xs font-extrabold uppercase text-white/48">Ayuda</h3>
                        <nav aria-label="Ayuda" className="mt-4 grid gap-3">
                            {companyLinks.map((link) => (
                                <Link key={link.href} href={link.href} className="w-fit text-sm font-bold hover:text-primary">
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </section>

                    <section>
                        <h3 className="text-xs font-extrabold uppercase text-white/48">Tu pedido</h3>
                        <div className="mt-4 grid gap-4 text-sm text-white/72">
                            <p className="flex items-start gap-3">
                                <PackageCheck className="mt-0.5 shrink-0 text-primary" size={19} />
                                EnvÃ­os nacionales con seguimiento.
                            </p>
                            <p className="flex items-start gap-3">
                                <Shirt className="mt-0.5 shrink-0 text-primary" size={19} />
                                Cambios antes de entrar a producciÃ³n.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-extrabold uppercase text-white/48">Pagos seguros</h3>
                        <p className="mt-4 flex items-center gap-3 text-sm font-bold text-white/72">
                            <CreditCard className="text-primary" size={20} />
                            Visa Â· Mastercard Â· Amex
                        </p>
                        <p className="mt-2 text-sm text-white/56">Stripe Â· Apple Pay Â· Google Pay</p>
                    </section>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/48 sm:flex-row sm:items-center sm:justify-between">
                    <p>Â© 2026 SAUT Street Wear</p>
                    <div className="flex flex-wrap gap-5">
                        <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
                        <Link href="/terminos" className="hover:text-white">TÃ©rminos y condiciones</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
