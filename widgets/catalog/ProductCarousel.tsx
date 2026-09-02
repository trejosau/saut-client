"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard, { type ProductCardData } from "@/widgets/catalog/ProductCard";

type Props = {
    products: ProductCardData[];
    intervalMs?: number;
    className?: string;
};

function usePrefersReducedMotion() {
    const [reduced, setReduced] = React.useState(false);

    React.useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => setReduced(mq.matches);
        onChange();
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return reduced;
}

// cuántas cards se ven “por página” (solo para dots)
function useSlidesPerView() {
    const [n, setN] = React.useState(2);

    React.useEffect(() => {
        const xl = window.matchMedia("(min-width: 1280px)");
        const lg = window.matchMedia("(min-width: 1024px)");
        const sm = window.matchMedia("(min-width: 640px)");

        const compute = () => {
            if (xl.matches) return 5;
            if (lg.matches) return 4;
            if (sm.matches) return 3;
            return 2;
        };

        const onChange = () => setN(compute());
        onChange();

        xl.addEventListener("change", onChange);
        lg.addEventListener("change", onChange);
        sm.addEventListener("change", onChange);
        return () => {
            xl.removeEventListener("change", onChange);
            lg.removeEventListener("change", onChange);
            sm.removeEventListener("change", onChange);
        };
    }, []);

    return n;
}

export default function ProductCarousel({ products, intervalMs = 4200, className }: Props) {
    const reducedMotion = usePrefersReducedMotion();
    const perView = useSlidesPerView();

    const autoplay = React.useMemo(() => {
        if (reducedMotion) return undefined;
        return Autoplay({
            delay: intervalMs,
            stopOnMouseEnter: true,
            stopOnInteraction: false,
        });
    }, [intervalMs, reducedMotion]);

    // ✅ SIN slidesToScroll => scrollNext/Prev avanza 1 item
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            align: "start",
            containScroll: "trimSnaps",
        },
        autoplay ? [autoplay] : []
    );

    const pageCount = React.useMemo(() => {
        return Math.max(1, Math.ceil(products.length / perView));
    }, [products.length, perView]);

    const [selectedPage, setSelectedPage] = React.useState(0);

    const onSelect = React.useCallback(() => {
        if (!emblaApi) return;
        const slideIndex = emblaApi.selectedScrollSnap(); // 0..n-1
        const page = Math.floor(slideIndex / perView);
        setSelectedPage((prev) => (prev === page ? prev : page));
    }, [emblaApi, perView]);

    React.useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
        return () => {
            emblaApi.off("select", onSelect);
            emblaApi.off("reInit", onSelect);
        };
    }, [emblaApi, onSelect]);

    const prev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const next = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    const scrollToPage = React.useCallback(
        (page: number) => {
            if (!emblaApi) return;
            emblaApi.scrollTo(page * perView);
        },
        [emblaApi, perView]
    );

    if (!products.length) return null;

    return (
        <div className={["relative", className ?? ""].join(" ")}>
            {/* Flechas compactas */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2">
                <div className="flex w-full items-center justify-between px-1 sm:px-2">
                    <button
                        type="button"
                        onClick={prev}
                        className="
              pointer-events-auto grid h-11 w-11 place-items-center rounded-[8px]
              border border-(--saut-black)
              bg-white
              shadow-[0_10px_22px_rgba(8,10,13,.10)]
              text-(--text) transition
              hover:bg-[rgba(255,217,66,.90)] active:scale-[0.98]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]
            "
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={next}
                        className="
              pointer-events-auto grid h-11 w-11 place-items-center rounded-[8px]
              border border-(--saut-black)
              bg-white
              shadow-[0_10px_22px_rgba(8,10,13,.10)]
              text-(--text) transition
              hover:bg-[rgba(255,217,66,.90)] active:scale-[0.98]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]
            "
                        aria-label="Siguiente"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Viewport */}
            <div ref={emblaRef} className="overflow-hidden">
                <div className="flex items-stretch -ml-3 sm:-ml-4 py-1">
                    {products.map((p) => (
                        <div
                            key={p.id}
                            className="
                pl-3 sm:pl-4
                shrink-0
                basis-1/2
                sm:basis-1/3
                lg:basis-1/4
                xl:basis-1/5
              "
                        >
                            <ProductCard product={p} className="h-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots por “página visual” (pero el scroll avanza 1 item) */}
            {pageCount > 1 ? (
                <div className="mt-3 flex items-center justify-center gap-2">
                    {Array.from({ length: pageCount }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => scrollToPage(i)}
                            className={[
                                "relative h-11 w-11 rounded-full transition after:absolute after:left-1/2 after:top-1/2 after:h-2.5 after:w-2.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:content-['']",
                                i === selectedPage
                                    ? "after:bg-(--saut-blue)"
                                    : "after:bg-[rgba(8,10,13,.18)] hover:after:bg-[rgba(8,10,13,.38)]",
                            ].join(" ")}
                            aria-label={`Ir a página ${i + 1}`}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
