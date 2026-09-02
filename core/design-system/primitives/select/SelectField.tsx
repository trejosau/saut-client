"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/core/lib/utils/cn";
import { useHydrated } from "@/core/hooks/useHydrated";

export type SelectFieldSize = "sm" | "md" | "lg";
export type SelectFieldState = "default" | "error" | "success";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectFieldProps = Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "value" | "defaultValue" | "onChange"
> & {
    label?: React.ReactNode;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    success?: React.ReactNode;

    size?: SelectFieldSize;
    state?: SelectFieldState;

    leftIcon?: React.ReactNode;

    placeholder?: string;
    options?: SelectOption[];

    /** Controlado / no controlado */
    value?: string;
    defaultValue?: string;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onValueChange?: (value: string) => void;
    loading?: boolean;
    emptyMessage?: React.ReactNode;

    /** Layout */
    fullWidth?: boolean;
    fullWidthMobile?: boolean;

    /** Tuning */
    ringColor?: string;        // default amarillo suave
    borderFocusColor?: string; // default amarillo sÃ³lido
    borderColor?: string;      // default var(--color-hairline)
    bgColor?: string;          // default glass blanco

    wrapperClassName?: string;
    labelClassName?: string;
    shellClassName?: string;
    selectClassName?: string; // ahora aplica al texto del trigger
};

type SelectCssVars = React.CSSProperties & {
    "--sf-bg"?: string;
    "--sf-border"?: string;
    "--sf-focus-border"?: string;
    "--sf-ring"?: string;
};

const sizes: Record<
    SelectFieldSize,
    { trigger: string; text: string; menuPad: string }
> = {
    sm: { trigger: "h-[42px] px-3 rounded-[14px]", text: "text-[13px]", menuPad: "p-2" },
    md: { trigger: "h-[48px] px-4 rounded-[14px]", text: "text-[14px]", menuPad: "p-2" },
    lg: { trigger: "h-[56px] px-4 rounded-[16px]", text: "text-[15px]", menuPad: "p-2" },
};

function ChevronDown() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
                d="M6.5 9.5 12 15l5.5-5.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function useClickOutside(
    refs: Array<React.RefObject<HTMLElement | null>>,
    onOutside: () => void
) {
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            const inside = refs.some((r) => r.current && r.current.contains(t));
            if (!inside) onOutside();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [refs, onOutside]);
}

type OptionNodeProps = {
    value?: string | number;
    children?: React.ReactNode;
    disabled?: boolean;
};

function childrenToOptions(children: React.ReactNode): SelectOption[] {
    const list: SelectOption[] = [];
    React.Children.forEach(children, (child) => {
        if (!React.isValidElement<OptionNodeProps>(child)) return;
        // option
        if (typeof child.type === "string" && child.type === "option") {
            const value = String(child.props.value ?? "");
            const label = String(child.props.children ?? "");
            const disabled = Boolean(child.props.disabled);
            // ignoramos placeholder option vacÃ­o (lo manejamos con placeholder)
            if (value === "") return;
            list.push({ value, label, disabled });
        }
        // optgroup (opcional)
        if (typeof child.type === "string" && child.type === "optgroup") {
            React.Children.forEach(child.props.children, (c) => {
                if (!React.isValidElement<OptionNodeProps>(c)) return;
                if (typeof c.type === "string" && c.type === "option") {
                    const value = String(c.props.value ?? "");
                    const label = String(c.props.children ?? "");
                    const disabled = Boolean(c.props.disabled);
                    if (value === "") return;
                    list.push({ value, label, disabled });
                }
            });
        }
    });
    return list;
}

export function SelectField({
                                label,
                                hint,
                                error,
                                success,
                                size = "md",
                                state: stateProp = "default",
                                leftIcon,
                                placeholder = "Selecciona...",
                                options,
                                fullWidth = true,
                                fullWidthMobile = false,
                                ringColor,
                                borderFocusColor,
                                borderColor,
                                bgColor,
                                wrapperClassName,
                                labelClassName,
                                shellClassName,
                                selectClassName,
                                disabled,
                                id,
                                children,
                                value,
                                defaultValue,
                                onChange,
                                onValueChange,
                                loading = false,
                                emptyMessage = "Sin opciones",
                                name,
                                required,
                                ...props
                            }: SelectFieldProps) {
    const reactId = React.useId();
    const baseId = id ?? `sf-${reactId}`;
    const btnId = `${baseId}-btn`;
    const listId = `${baseId}-list`;

    const autoState: SelectFieldState =
        error ? "error" : success ? "success" : stateProp;

    const widthClass = fullWidth
        ? "w-full"
        : fullWidthMobile
            ? "w-full sm:w-auto"
            : "";

    const baseVars: SelectCssVars = {
        "--sf-bg": bgColor ?? "rgba(255,255,255,.35)",
        "--sf-border": borderColor ?? "var(--color-hairline)",
        "--sf-focus-border": borderFocusColor ?? "var(--color-primary)",
        "--sf-ring": ringColor ?? "color-mix(in srgb, var(--color-primary) 32%, transparent)",
    };

    const stateVars: SelectCssVars =
        autoState === "error"
            ? { "--sf-focus-border": "var(--color-sale)", "--sf-ring": "color-mix(in srgb, var(--color-sale) 25%, transparent)" }
            : autoState === "success"
                ? { "--sf-focus-border": "var(--color-info)", "--sf-ring": "color-mix(in srgb, var(--color-info) 20%, transparent)" }
                : {};

    const style: SelectCssVars = { ...baseVars, ...stateVars };

    const computedOptions = React.useMemo(() => {
        if (options?.length) return options;
        const fromChildren = childrenToOptions(children);
        return fromChildren;
    }, [options, children]);

    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue ?? "");
    const currentValue = isControlled ? String(value) : internal;

    const [open, setOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const mounted = useHydrated();
    const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties | null>(null);

    const btnRef = React.useRef<HTMLButtonElement | null>(null);
    const menuRef = React.useRef<HTMLDivElement | null>(null);

    useClickOutside([btnRef, menuRef], () => setOpen(false));

    const selected = computedOptions.find((o) => o.value === currentValue) ?? null;

    const setValue = (v: string) => {
        if (!isControlled) setInternal(v);
        onValueChange?.(v);

        // Compat con onChange de <select>
        if (onChange) {
            const fake = {
                target: { value: v, name: name ?? "" },
                currentTarget: { value: v, name: name ?? "" },
            } as unknown as React.ChangeEvent<HTMLSelectElement>;
            onChange(fake);
        }
    };

    const syncMenuPosition = React.useCallback(() => {
        const btn = btnRef.current;
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const viewportMargin = 8;
        const menuGap = 8;

        const availableBottom = window.innerHeight - rect.bottom - viewportMargin;
        const availableTop = rect.top - viewportMargin;
        const openUp = availableBottom < 170 && availableTop > availableBottom;

        const rawMaxHeight = openUp ? availableTop - menuGap : availableBottom - menuGap;
        const maxHeight = Math.max(140, Math.min(260, rawMaxHeight));

        const top = openUp
            ? Math.max(viewportMargin, rect.top - maxHeight - menuGap)
            : rect.bottom + menuGap;

        const width = Math.max(180, Math.min(rect.width, window.innerWidth - viewportMargin * 2));
        const left = Math.min(
            Math.max(viewportMargin, rect.left),
            window.innerWidth - viewportMargin - width
        );

        setMenuStyle({
            position: "fixed",
            top,
            left,
            width,
            maxHeight,
            zIndex: 120,
        });
    }, []);

    const openMenu = () => {
        if (disabled) return;
        setOpen(true);
        const idx = computedOptions.findIndex((o) => o.value === currentValue);
        setActiveIndex(idx >= 0 ? idx : 0);
        requestAnimationFrame(syncMenuPosition);
    };

    const closeMenu = () => setOpen(false);

    const moveActive = (dir: 1 | -1) => {
        if (!computedOptions.length) return;
        let i = activeIndex;
        for (let step = 0; step < computedOptions.length; step++) {
            i = (i + dir + computedOptions.length) % computedOptions.length;
            if (!computedOptions[i]?.disabled) {
                setActiveIndex(i);
                return;
            }
        }
    };

    const commitActive = () => {
        const opt = computedOptions[activeIndex];
        if (!opt || opt.disabled) return;
        setValue(opt.value);
        closeMenu();
        btnRef.current?.focus();
    };

    const onButtonKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) openMenu();
            else moveActive(e.key === "ArrowDown" ? 1 : -1);
            return;
        }

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!open) openMenu();
            else commitActive();
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            closeMenu();
        }
    };

    const onMenuKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            moveActive(1);
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            moveActive(-1);
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            commitActive();
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            closeMenu();
            btnRef.current?.focus();
        }
    };

    React.useEffect(() => {
        if (!open) return;
        const menuEl = menuRef.current;
        if (!menuEl) return;

        const optionEl = menuEl.querySelector(
            `[data-idx="${activeIndex}"]`
        ) as HTMLElement | null;
        if (!optionEl) return;

        const optionTop = optionEl.offsetTop;
        const optionBottom = optionTop + optionEl.offsetHeight;
        const viewTop = menuEl.scrollTop;
        const viewBottom = viewTop + menuEl.clientHeight;

        if (optionTop < viewTop) {
            menuEl.scrollTop = optionTop;
            return;
        }
        if (optionBottom > viewBottom) {
            menuEl.scrollTop = optionBottom - menuEl.clientHeight;
        }
    }, [activeIndex, open]);

    React.useEffect(() => {
        if (!open) return;
        syncMenuPosition();

        const onViewportChange = () => syncMenuPosition();
        window.addEventListener("resize", onViewportChange);
        window.addEventListener("scroll", onViewportChange, true);

        return () => {
            window.removeEventListener("resize", onViewportChange);
            window.removeEventListener("scroll", onViewportChange, true);
        };
    }, [open, syncMenuPosition]);

    return (
        <div className={cn(widthClass, wrapperClassName)} style={style}>
            {label !== undefined ? (
                <label
                    htmlFor={btnId}
                    className={cn("mb-2 block text-[12px] font-black tracking-[0.10em]", labelClassName)}
                >
                    {label}
                </label>
            ) : null}

            {/* hidden input para forms */}
            {name ? (
                <input type="hidden" name={name} value={currentValue} required={required} />
            ) : null}

            <div className="relative">
                <button
                    id={btnId}
                    ref={btnRef}
                    type="button"
                    disabled={disabled}
                    onClick={() => (open ? closeMenu() : openMenu())}
                    onKeyDown={onButtonKeyDown}
                    aria-haspopup="listbox"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-invalid={Boolean(error) || undefined}
                    className={cn(
                        "w-full inline-flex items-center justify-between gap-2",
                        "bg-[var(--sf-bg)] border border-[var(--sf-border)] text-ink",
                        "shadow-[0_14px_28px_rgba(8,10,13,.09)]",
                        "transition-[box-shadow,border-color,filter] duration-200 ease-out",
                        "hover:shadow-[0_16px_30px_rgba(8,10,13,.10)]",
                        "focus-visible:outline-none",
                        "focus-visible:border-[var(--sf-focus-border)]",
                        "focus-visible:shadow-[0_0_0_3px_var(--sf-ring),0_16px_30px_rgba(8,10,13,.10)]",
                        disabled ? "pointer-events-none opacity-60" : "",
                        sizes[size].trigger,
                        shellClassName
                    )}
                    {...(props as unknown as React.ButtonHTMLAttributes<HTMLButtonElement>)}
                >
          <span className="inline-flex items-center gap-2 min-w-0">
            {leftIcon ? (
                <span className="shrink-0 text-mute">{leftIcon}</span>
            ) : null}

              <span
                  className={cn(
                      "min-w-0 truncate font-extrabold",
                      sizes[size].text,
                      selectClassName,
                      selected ? "text-ink" : "text-mute"
                  )}
              >
              {selected ? selected.label : placeholder}
            </span>
          </span>

                    <span className="shrink-0 text-mute">
            <ChevronDown />
          </span>
                </button>

                {open && mounted ? createPortal(
                    <div
                        id={listId}
                        ref={menuRef}
                        tabIndex={-1}
                        onKeyDown={onMenuKeyDown}
                        role="listbox"
                        style={menuStyle ?? undefined}
                        className={cn(
                            "overflow-auto",
                            "rounded-[14px] border border-hairline",
                            "bg-white",
                            "shadow-[0_24px_50px_rgba(8,10,13,.14)]",
                            sizes[size].menuPad
                        )}
                    >
                        {loading ? <div role="status" className="p-3 text-center text-xs text-(--muted)">Cargandoâ€¦</div> : computedOptions.length === 0 ? <div role="status" className="p-3 text-center text-xs text-(--muted)">{emptyMessage}</div> : computedOptions.map((o, idx) => {
                            const isSelected = o.value === currentValue;
                            const isActive = idx === activeIndex;

                            return (
                                <div
                                    key={o.value}
                                    role="option"
                                    aria-selected={isSelected}
                                    data-idx={idx}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        if (o.disabled) return;
                                        setValue(o.value);
                                        closeMenu();
                                        btnRef.current?.focus();
                                    }}
                                    className={cn(
                                        "rounded-[12px] px-3 py-2",
                                        "transition-[background-color,box-shadow] duration-150 ease-out",
                                        "font-extrabold",
                                        sizes[size].text,
                                        o.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                        isActive && !o.disabled ? "bg-[#f8efc6]" : "",
                                        isSelected ? "bg-[#f2e3a0]" : "",
                                        !isSelected && !isActive ? "hover:bg-[#f7f3dd]" : ""
                                    )}
                                >
                                    {o.label}
                                </div>
                            );
                        })}
                    </div>
                , document.body) : null}
            </div>

            {(hint || error || success) ? (
                <div id={baseId + "-feedback"} className="mt-2 text-[12px] font-extrabold leading-snug">
                    {error ? (
                        <p className="m-0 text-[rgba(219,38,75,.95)]">{error}</p>
                    ) : success ? (
                        <p className="m-0 text-[rgba(5,122,168,.95)]">{success}</p>
                    ) : hint ? (
                        <p className="m-0 text-mute">{hint}</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
