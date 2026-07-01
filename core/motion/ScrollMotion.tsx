"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type ScrollMotionProps = {
  children: ReactNode;
};

gsap.registerPlugin(useGSAP, ScrollTrigger);

const isStructuralRegion = (element: Element) =>
  element.matches("header, section, [data-scroll-region]");

const isCardGroup = (element: Element) => {
  const children = Array.from(element.children);

  return (
    children.length >= 2 &&
    children.length <= 40 &&
    children.every((child) => child.matches("article, li, a, [data-scroll-item]"))
  );
};

export function ScrollMotion({ children }: ScrollMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const media = gsap.matchMedia();

      media.add(
        {
          desktop: "(min-width: 1024px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop, reduceMotion } = context.conditions as {
            desktop: boolean;
            reduceMotion: boolean;
          };

          if (reduceMotion) return;

          const isOperationalRoute =
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/checkout") ||
            pathname.startsWith("/personalizar");

          const pages = Array.from(root.querySelectorAll<HTMLElement>("main")).filter(
            (page) =>
              !page.querySelector("main") &&
              page.dataset.scrollMotion !== "custom" &&
              !page.closest("[data-scroll-motion='off']"),
          );

          pages.forEach((page) => {
            const directRegions = Array.from(page.children).filter(isStructuralRegion);
            const regions = directRegions.length
              ? directRegions
              : Array.from(page.children).filter(
                  (element) => !element.matches("script, style, [aria-live]"),
                );

            regions.forEach((region) => {
              gsap.fromTo(
                region,
                {
                  y: isOperationalRoute ? 14 : desktop ? 34 : 22,
                  autoAlpha: isOperationalRoute ? 0.72 : 0,
                },
                {
                  y: 0,
                  autoAlpha: 1,
                  duration: isOperationalRoute ? 0.55 : 0.82,
                  ease: "power3.out",
                  clearProps: "transform,opacity,visibility",
                  scrollTrigger: {
                    trigger: region,
                    start: "clamp(top 88%)",
                    once: true,
                  },
                },
              );
            });

            if (isOperationalRoute) return;

            const groups = Array.from(
              page.querySelectorAll<HTMLElement>("ol, [data-scroll-group], [class~='grid']"),
            ).filter(
              (group) =>
                isCardGroup(group) &&
                !group.closest("[data-scroll-motion='off']") &&
                !group.closest("[data-scroll-motion='custom']"),
            );

            const cards = Array.from(
              new Set(
                groups.flatMap((group) =>
                  Array.from(group.children) as HTMLElement[],
                ),
              ),
            );

            if (cards.length) {
              gsap.set(cards, { y: desktop ? 26 : 18, autoAlpha: 0 });
              ScrollTrigger.batch(cards, {
                start: "clamp(top 92%)",
                once: true,
                interval: 0.08,
                batchMax: desktop ? 5 : 3,
                onEnter: (batch) => {
                  gsap.to(batch, {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.68,
                    stagger: 0.07,
                    ease: "power3.out",
                    overwrite: "auto",
                    clearProps: "transform,opacity,visibility",
                  });
                },
              });
            }

            const heroMedia = page.querySelector<HTMLElement>(
              ":scope > header img, :scope > section:first-child > img",
            );

            if (heroMedia && desktop) {
              gsap.fromTo(
                heroMedia,
                { yPercent: -2.5, scale: 1.025 },
                {
                  yPercent: 2.5,
                  scale: 1.01,
                  ease: "none",
                  scrollTrigger: {
                    trigger: heroMedia.parentElement ?? heroMedia,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.8,
                  },
                },
              );
            }
          });

          const refresh = () => ScrollTrigger.refresh();
          const frame = window.requestAnimationFrame(refresh);
          window.addEventListener("load", refresh, { once: true });

          return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("load", refresh);
          };
        },
      );

      return () => media.revert();
    },
    { dependencies: [pathname], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  );
}
