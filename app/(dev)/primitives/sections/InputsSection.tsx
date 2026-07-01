// primitives/sections/InputsSection.tsx

"use client";

import { TextField } from "@/core/design-system";

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

function IconSearch() {
    return (
        <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
      🔎
    </span>
    );
}

function IconMail() {
    return (
        <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
      ✉️
    </span>
    );
}

export function InputsSection() {
    return (
        <section className={panel} aria-label="Inputs">
            <div className={head}>
                <b className="text-[13px] font-black tracking-[0.02em]">Inputs</b>
                <span className={hint}>TextField • label/hint/error • icons • password</span>
            </div>

            <div className={body}>
                {/* Basics */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">Basics</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Default</div>
                            <TextField label="Example" placeholder="Example..." />
                        </div>

                        <div className={card}>
                            <div className={label}>With left icon</div>
                            <TextField label="Example" placeholder="Example..." leftIcon={<IconSearch />} />
                        </div>

                        <div className={card}>
                            <div className={label}>Email</div>
                            <TextField label="Example" type="email" placeholder="Example..." leftIcon={<IconMail />} />
                        </div>
                    </div>
                </div>

                {/* States */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">States</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Hint</div>
                            <TextField label="Example" placeholder="Example..." hint="Example hint..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Error</div>
                            <TextField label="Example" placeholder="Example..." error="Example error..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Success</div>
                            <TextField label="Example" placeholder="Example..." success="Example success..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Disabled</div>
                            <TextField label="Example" placeholder="Example..." disabled />
                        </div>
                    </div>
                </div>

                {/* Sizes */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">Sizes</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>SM</div>
                            <TextField label="Example" placeholder="Example..." size="sm" />
                        </div>

                        <div className={card}>
                            <div className={label}>MD</div>
                            <TextField label="Example" placeholder="Example..." size="md" />
                        </div>

                        <div className={card}>
                            <div className={label}>LG</div>
                            <TextField label="Example" placeholder="Example..." size="lg" />
                        </div>
                    </div>
                </div>

                {/* Password + full width mobile */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">Patterns</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Password (reveal)</div>
                            <TextField label="Example" type="password" placeholder="Example..." revealable />
                        </div>

                        <div className={card}>
                            <div className={label}>Full width mobile</div>
                            <TextField label="Example" placeholder="Example..." fullWidth={false} fullWidthMobile />
                            <p className="m-0 text-[12px] font-extrabold text-(--muted) leading-snug">
                                w-full en mobile, sm:w-auto
                            </p>
                        </div>

                        <div className={card}>
                            <div className={label}>Custom ring/border</div>
                            <TextField
                                label="Example"
                                placeholder="Example..."
                                ringColor="rgba(123, 97, 255, .30)"
                                borderFocusColor="rgba(123, 97, 255, .90)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
