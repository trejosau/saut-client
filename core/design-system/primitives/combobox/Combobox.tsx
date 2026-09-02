"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/core/lib/utils/cn";
import { FormDescription, FormError, FormLabel } from "@/core/design-system/primitives/field";

export type ComboboxOption = { value: string; label: string; disabled?: boolean };

export type ComboboxProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  name?: string;
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  id?: string;
};

export function Combobox({
  label,
  hint,
  error,
  required,
  name,
  options,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Selecciona…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin opciones",
  loading = false,
  disabled = false,
  id,
  className,
  ...props
}: ComboboxProps) {
  const reactId = React.useId();
  const controlId = id ?? ("combobox-" + reactId);
  const listId = controlId + "-list";
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const currentValue = value === undefined ? internalValue : value;
  const selected = options.find((option) => option.value === currentValue);
  const filtered = React.useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  );

  React.useEffect(() => {
    const handleOutside = (event: PointerEvent) => {
      if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  const choose = (next: string) => {
    const option = options.find((item) => item.value === next);
    if (!option || option.disabled) return;
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
    setQuery("");
    setOpen(false);
  };

  const moveActive = (direction: 1 | -1) => {
    if (filtered.length === 0) return;
    let next = activeIndex;
    for (let step = 0; step < filtered.length; step += 1) {
      next = (next + direction + filtered.length) % filtered.length;
      if (!filtered[next]?.disabled) {
        setActiveIndex(next);
        return;
      }
    }
  };

  React.useEffect(() => {
    if (!open) return;
    const active = document.getElementById(`${listId}-option-${activeIndex}`);
    if (active && typeof active.scrollIntoView === "function") active.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listId, open]);

  return (
    <div ref={rootRef} className={cn("saut-field", className)} {...props}>
      {label !== undefined ? <FormLabel htmlFor={controlId} required={required}>{label}</FormLabel> : null}
      {name ? <input type="hidden" name={name} value={currentValue} required={required} /> : null}
      <div className="relative">
        <div className={cn("saut-control", open && "saut-control--focus", error && "saut-control--error", disabled && "saut-control--disabled")}>
          <Search size={16} className="saut-control__icon" aria-hidden="true" />
          <input
            ref={inputRef}
            id={controlId}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && filtered[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? controlId + "-error" : hint ? controlId + "-description" : undefined}
            value={open ? query : (selected?.label ?? "")}
            placeholder={selected ? undefined : (open ? searchPlaceholder : placeholder)}
            disabled={disabled}
            className="saut-control__input"
            onFocus={() => { const first = filtered.findIndex((option) => !option.disabled); setActiveIndex(first >= 0 ? first : 0); setOpen(true); }}
            onChange={(event) => {
              const nextQuery = event.target.value;
              const nextFiltered = options.filter((option) => option.label.toLowerCase().includes(nextQuery.trim().toLowerCase()));
              const first = nextFiltered.findIndex((option) => !option.disabled);
              setQuery(nextQuery);
              setActiveIndex(first >= 0 ? first : 0);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") { setOpen(false); return; }
              if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); moveActive(1); return; }
              if (event.key === "ArrowUp") { event.preventDefault(); setOpen(true); moveActive(-1); return; }
              if (event.key === "Home" && open) { event.preventDefault(); const first = filtered.findIndex((option) => !option.disabled); setActiveIndex(first >= 0 ? first : 0); return; }
              if (event.key === "End" && open) { event.preventDefault(); for (let index = filtered.length - 1; index >= 0; index -= 1) if (!filtered[index]?.disabled) { setActiveIndex(index); break; } return; }
              if (event.key === "Enter" && open && filtered[activeIndex] && !filtered[activeIndex].disabled) { event.preventDefault(); choose(filtered[activeIndex].value); }
            }}
          />
          <button type="button" className="saut-control__trigger" aria-label={open ? "Cerrar opciones" : "Abrir opciones"} onClick={() => { setOpen((current) => !current); inputRef.current?.focus(); }} disabled={disabled}><ChevronDown size={16} /></button>
        </div>
        {open ? (
          <div id={listId} role="listbox" className="saut-combobox-menu">
            {loading ? <div className="saut-combobox-menu__state">Cargando…</div> : filtered.length === 0 ? <div className="saut-combobox-menu__state">{emptyMessage}</div> : filtered.map((option) => (
              <button id={`${listId}-option-${filtered.indexOf(option)}`} key={option.value} type="button" role="option" aria-selected={option.value === currentValue} disabled={option.disabled} className={cn("saut-combobox-option", option.value === currentValue && "saut-combobox-option--selected")} onMouseEnter={() => setActiveIndex(filtered.indexOf(option))} onClick={() => choose(option.value)}>
                <span>{option.label}</span>{option.value === currentValue ? <Check size={16} aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <FormError id={controlId + "-error"}>{error}</FormError> : hint ? <FormDescription id={controlId + "-description"}>{hint}</FormDescription> : null}
    </div>
  );
}
