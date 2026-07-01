// primitives/sections/ButtonsSection.tsx

"use client";

import Link from "next/link";
import { Button } from "@/core/design-system";

const panel =
    "rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.22)] " +
    "shadow-[0_24px_50px_rgba(8,10,13,.14)] overflow-hidden";

const head =
    "px-4 py-3 flex items-baseline justify-between gap-3 bg-[rgba(255,255,255,.30)] " +
    "border-b border-[rgba(0,0,0,.10)]";

const body = "p-4 flex flex-col gap-4";

const group =
    "rounded-[14px] border border-[rgba(0,0,0,.12)] bg-[rgba(255,255,255,.32)] " +
    "shadow-[0_16px_34px_rgba(8,10,13,.10)] p-3";

const grid = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3";

// ✅ FIX: evita que el botón se estire a full width dentro del card
const card =
    "rounded-[14px] border border-dashed border-[rgba(0,0,0,.18)] " +
    "bg-[rgba(255,255,255,.28)] p-3 flex flex-col items-start gap-2";

const label = "text-[12px] font-black tracking-[0.02em]";
const hint = "text-[12px] font-extrabold text-(--muted)";

export function ButtonsSection() {
    return (
        <section className={panel} aria-label="Buttons">
            <div className={head}>
                <b className="text-[13px] font-black tracking-[0.02em]">Buttons</b>
                <span className={hint}>variants • patterns • sizing</span>
            </div>

            <div className={body}>
                {/* Variants */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">Variants</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Primary</div>
                            <Button variant="primary" size="fit">
                                Example
                            </Button>
                        </div>
                        <div className={card}>
                            <div className={label}>Blue</div>
                            <Button variant="blue" size="fit">
                                Example
                            </Button>
                        </div>
                        <div className={card}>
                            <div className={label}>Navy</div>
                            <Button variant="navy" size="fit">
                                Example
                            </Button>
                        </div>
                        <div className={card}>
                            <div className={label}>Danger</div>
                            <Button variant="danger" size="fit">
                                Example
                            </Button>
                        </div>
                        <div className={card}>
                            <div className={label}>Wine</div>
                            <Button variant="wine" size="fit">
                                Example
                            </Button>
                        </div>
                        <div className={card}>
                            <div className={label}>Ghost</div>
                            <Button variant="ghost" size="fit" caps={false}>
                                Example
                            </Button>
                        </div>
                        <div className={card}>
                            <div className={label}>Outline</div>
                            <Button variant="outline" size="fit" caps={false}>
                                Example
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content width */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">Content width</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>A</div>
                            <Button size="fit">A</Button>
                        </div>
                        <div className={card}>
                            <div className={label}>AAA</div>
                            <Button size="fit">AAA</Button>
                        </div>
                        <div className={card}>
                            <div className={label}>Example</div>
                            <Button size="fit">Example</Button>
                        </div>
                    </div>
                </div>

                {/* Patterns */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">Patterns</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Loading</div>
                            <Button size="fit" isLoading>
                                Example
                            </Button>
                        </div>

                        <div className={card}>
                            <div className={label}>Icon + label</div>
                            <Button size="fit" leftIcon={<span>★</span>} rightIcon={<span>›</span>}>
                                Example
                            </Button>
                        </div>

                        <div className={card}>
                            <div className={label}>Link button (asChild)</div>
                            <Button asChild size="fit">
                                <Link href="/landing">Example</Link>
                            </Button>
                        </div>

                        <div className={card}>
                            <div className={label}>Full width mobile</div>
                            <Button size="md" fullWidthMobile>
                                Example
                            </Button>
                            <p className="m-0 text-[12px] font-extrabold text-(--muted) leading-snug">
                                En desktop vuelve a auto; en mobile ocupa todo el ancho.
                            </p>
                        </div>
                    </div>
                </div>

                {/* No shadow */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">No shadow</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Primary (none)</div>
                            <Button size="fit" shadow="none">
                                Example
                            </Button>
                        </div>
                        <div className={card}>
                            <div className={label}>Outline (none)</div>
                            <Button variant="outline" size="fit" shadow="none" caps={false}>
                                Example
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
