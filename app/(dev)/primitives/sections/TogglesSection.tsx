// primitives/sections/TogglesSection.tsx

"use client";

import { Checkbox, Switch } from "@/core/design-system";

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

export function TogglesSection() {
    return (
        <section className={panel} aria-label="Checkbox & Switches">
            <div className={head}>
                <b className="text-[13px] font-black tracking-[0.02em]">Checkbox & Switches</b>
                <span className={hint}>smooth • primary focus</span>
            </div>

            <div className={body}>
                {/* Checkbox */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">Checkbox</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Default</div>
                            <Checkbox label="Example" hint="Example..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Checked</div>
                            <Checkbox label="Example" defaultChecked />
                        </div>

                        <div className={card}>
                            <div className={label}>Indeterminate</div>
                            <Checkbox label="Example" indeterminate />
                        </div>

                        <div className={card}>
                            <div className={label}>Error</div>
                            <Checkbox label="Example" error="Example error..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Disabled</div>
                            <Checkbox label="Example" disabled />
                        </div>

                        <div className={card}>
                            <div className={label}>Custom accent</div>
                            <Checkbox
                                label="Example"
                                defaultChecked
                                accentColor="var(--color-info)"
                                checkColor="#ffffff"
                                ringColor="rgba(5,122,168,.25)"
                            />
                        </div>
                    </div>
                </div>

                {/* Switch */}
                <div className={group}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="text-[13px] font-black tracking-[0.02em]">Switch</div>
                    </div>

                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Off</div>
                            <Switch label="Example" hint="Example..." />
                        </div>

                        <div className={card}>
                            <div className={label}>On</div>
                            <Switch label="Example" defaultChecked />
                        </div>

                        <div className={card}>
                            <div className={label}>Disabled</div>
                            <Switch label="Example" disabled />
                        </div>

                        <div className={card}>
                            <div className={label}>Error</div>
                            <Switch label="Example" error="Example error..." />
                        </div>

                        <div className={card}>
                            <div className={label}>Sizes</div>
                            <div className="flex flex-col gap-3">
                                <Switch label="Example" size="sm" />
                                <Switch label="Example" size="md" defaultChecked />
                                <Switch label="Example" size="lg" />
                            </div>
                        </div>

                        <div className={card}>
                            <div className={label}>Full width mobile</div>
                            <Switch label="Example" fullWidth={false} fullWidthMobile />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
