// primitives/sections/TextareasSection.tsx

"use client";

import { TextAreaField } from "@/core/design-system";

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

const card =
    "rounded-[14px] border border-dashed border-[rgba(0,0,0,.18)] " +
    "bg-[rgba(255,255,255,.28)] p-3 flex flex-col gap-2";

const label = "text-[12px] font-black tracking-[0.02em]";
const hint = "text-[12px] font-extrabold text-(--muted)";

export function TextareasSection() {
    return (
        <section className={panel} aria-label="Textareas">
            <div className={head}>
                <b className="text-[13px] font-black tracking-[0.02em]">Textarea</b>
                <span className={hint}>same feel as TextField</span>
            </div>

            <div className={body}>
                <div className={group}>
                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Default</div>
                            <TextAreaField label="Example" placeholder="Example..." hint="Example..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Error</div>
                            <TextAreaField label="Example" placeholder="Example..." error="Example error..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Success</div>
                            <TextAreaField label="Example" placeholder="Example..." success="Example success..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Disabled</div>
                            <TextAreaField label="Example" placeholder="Example..." disabled />
                        </div>

                        <div className={card}>
                            <div className={label}>Sizes</div>
                            <div className="flex flex-col gap-3">
                                <TextAreaField label="Example" placeholder="Example..." size="sm" />
                                <TextAreaField label="Example" placeholder="Example..." size="md" />
                                <TextAreaField label="Example" placeholder="Example..." size="lg" />
                            </div>
                        </div>

                        <div className={card}>
                            <div className={label}>Custom ring</div>
                            <TextAreaField
                                label="Example"
                                placeholder="Example..."
                                ringColor="rgba(123,97,255,.26)"
                                borderFocusColor="rgba(123,97,255,.90)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
