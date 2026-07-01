"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

type LandingMotionProps = {
  children: ReactNode;
};

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function LandingMotion({ children }: LandingMotionProps) {
  const rootRef = useRef<HTMLElement>(null);

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

          const lenis = new Lenis({
            autoRaf: true,
            duration: 1.05,
            smoothWheel: true,
            syncTouch: false,
            wheelMultiplier: 0.9,
            anchors: true,
          });

          lenis.on("scroll", ScrollTrigger.update);

          const hero = root.querySelector<HTMLElement>("[data-motion-section='hero']");
          const heroVisual = root.querySelector<HTMLElement>("[data-hero-visual]");
          const heroOverlay = root.querySelector<HTMLElement>("[data-hero-overlay]");
          const heroContent = root.querySelector<HTMLElement>("[data-hero-content]");

          if (hero && heroVisual && heroOverlay && heroContent) {
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: hero,
                  start: "top top",
                  end: "bottom top",
                  scrub: 1,
                },
              })
              .to(heroVisual, { yPercent: 12, scale: 1.12, ease: "none" }, 0)
              .to(heroOverlay, { autoAlpha: 0.72, ease: "none" }, 0)
              .to(
                heroContent,
                { y: desktop ? -90 : -48, autoAlpha: 0.18, ease: "none" },
                0,
              );
          }

          const benefits = root.querySelector<HTMLElement>(
            "[data-motion-section='benefits']",
          );
          const benefitItems = benefits?.querySelectorAll<HTMLElement>(
            "[data-motion-item]",
          );

          if (benefits && benefitItems?.length) {
            gsap.fromTo(
              benefitItems,
              { y: 56, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                stagger: 0.12,
                ease: "none",
                scrollTrigger: {
                  trigger: benefits,
                  start: "top 88%",
                  end: "bottom 52%",
                  scrub: 0.8,
                },
              },
            );
          }

          const categories = root.querySelector<HTMLElement>(
            "[data-motion-section='categories']",
          );
          const categoryHeading = categories?.querySelector<HTMLElement>(
            "[data-motion-heading]",
          );
          const categoryCards = categories?.querySelectorAll<HTMLElement>(
            "[data-motion-card]",
          );

          if (categories && categoryHeading && categoryCards?.length) {
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: categories,
                  start: "top 82%",
                  end: desktop ? "center 54%" : "top 38%",
                  scrub: 0.9,
                },
              })
              .fromTo(
                categoryHeading,
                { y: 72, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, ease: "none" },
              )
              .fromTo(
                categoryCards,
                { y: desktop ? 120 : 72, scale: 0.94, autoAlpha: 0 },
                {
                  y: 0,
                  scale: 1,
                  autoAlpha: 1,
                  stagger: 0.16,
                  ease: "none",
                },
                0.18,
              );

            categoryCards.forEach((card, index) => {
              const image = card.querySelector<HTMLElement>("img");
              if (!image) return;

              gsap.fromTo(
                image,
                { yPercent: -4 },
                {
                  yPercent: 4,
                  ease: "none",
                  scrollTrigger: {
                    trigger: card,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1 + index * 0.1,
                  },
                },
              );
            });
          }

          const featured = root.querySelector<HTMLElement>(
            "[data-motion-section='featured']",
          );
          const featuredHeading = featured?.querySelector<HTMLElement>(
            "[data-motion-heading]",
          );
          const featuredTrack = featured?.querySelector<HTMLElement>(
            "[data-motion-track]",
          );

          if (featured && featuredHeading && featuredTrack) {
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: featured,
                  start: "top 84%",
                  end: "center 60%",
                  scrub: 0.9,
                },
              })
              .fromTo(
                featuredHeading,
                { x: desktop ? -72 : -32, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, ease: "none" },
              )
              .fromTo(
                featuredTrack,
                { y: 96, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, ease: "none" },
                0.12,
              );
          }

          const studio = root.querySelector<HTMLElement>(
            "[data-motion-section='studio']",
          );
          const studioCopy = studio?.querySelector<HTMLElement>("[data-motion-copy]");
          const studioMedia = studio?.querySelector<HTMLElement>("[data-motion-media]");
          const studioImage = studioMedia?.querySelector<HTMLElement>("img");

          if (studio && studioCopy && studioMedia) {
            const studioTimeline = gsap.timeline({
              scrollTrigger: {
                trigger: studio,
                start: "top 88%",
                end: desktop ? "center 52%" : "center 45%",
                scrub: 0.75,
              },
            });

            studioTimeline
              .fromTo(
                studioCopy.children,
                { x: desktop ? -90 : -36, autoAlpha: 0 },
                {
                  x: 0,
                  autoAlpha: 1,
                  stagger: 0.08,
                  ease: "none",
                },
              )
              .fromTo(
                studioMedia,
                { y: desktop ? 44 : 28, scale: 0.97, autoAlpha: 0 },
                { y: 0, scale: 1, autoAlpha: 1, ease: "none" },
                0.1,
              );

            if (studioImage) {
              studioTimeline.fromTo(
                studioImage,
                { yPercent: -2.5, scale: 1.025 },
                { yPercent: 2.5, scale: 1, ease: "none" },
                0,
              );
            }
          }

          ScrollTrigger.refresh();

          return () => {
            lenis.off("scroll", ScrollTrigger.update);
            lenis.destroy();
          };
        },
      );

      return () => media.revert();
    },
    { scope: rootRef },
  );

  return (
    <main ref={rootRef} data-scroll-motion="custom" className="w-full overflow-clip">
      {children}
    </main>
  );
}
