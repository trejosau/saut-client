// primitives/sections/SelectsSection.tsx

"use client";

import { SelectField } from "@/core/design-system";

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

function IconTag() {
    return <span aria-hidden="true">🏷️</span>;
}

export function SelectsSection() {
    return (
        <section className={panel} aria-label="Selects">
            <div className={head}>
                <b className="text-[13px] font-black tracking-[0.02em]">Select</b>
                <span className={hint}>native select • focus primary</span>
            </div>

            <div className={body}>
                <div className={group}>
                    <div className={grid}>
                        <div className={card}>
                            <div className={label}>Default</div>
                            <SelectField
                                label="Example"
                                hint="Example..."
                                options={[
                                    { value: "a", label: "Example A" },
                                    { value: "b", label: "Example B" },
                                    { value: "c", label: "Example C" },
                                ]}
                            />
                        </div>

                        <div className={card}>
                            <div className={label}>With icon</div>
                            <SelectField
                                label="Example"
                                leftIcon={<IconTag />}
                                options={[
                                    { value: "new", label: "NEW" },
                                    { value: "drop", label: "DROP" },
                                    { value: "agotado", label: "AGOTADO" },
                                ]}
                            />
                        </div>

                        <div className={card}>
                            <div className={label}>Error</div>
                            <SelectField
                                label="Example"
                                error="Example error..."
                                options={[
                                    { value: "1", label: "Example 1" },
                                    { value: "2", label: "Example 2" },
                                ]}
                            />
                        </div>

                        <div className={card}>
                            <div className={label}>Success</div>
                            <SelectField
                                label="Example"
                                success="Example success..."
                                options={[
                                    { value: "x", label: "Example X" },
                                    { value: "y", label: "Example Y" },
                                ]}
                            />
                        </div>

                        <div className={card}>
                            <div className={label}>Disabled</div>
                            <SelectField
                                label="Example"
                                disabled
                                options={[
                                    { value: "a", label: "Example A" },
                                    { value: "b", label: "Example B" },
                                ]}
                            />
                        </div>

                        <div className={card}>
                            <div className={label}>Sizes</div>
                            <div className="flex flex-col gap-3">
                                <SelectField
                                    label="Example"
                                    size="sm"
                                    options={[
                                        { value: "a", label: "Example" },
                                        { value: "b", label: "Example" },
                                    ]}
                                />
                                <SelectField
                                    label="Example"
                                    size="md"
                                    options={[
                                        { value: "a", label: "Example" },
                                        { value: "b", label: "Example" },
                                    ]}
                                />
                                <SelectField
                                    label="Example"
                                    size="lg"
                                    options={[
                                        { value: "a", label: "Example" },
                                        { value: "b", label: "Example" },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}