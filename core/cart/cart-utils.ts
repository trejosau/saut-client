import type { AddCartItemInput, CartSelection } from "@/core/cart/context";

export function formatCurrencyMXN(amount: number): string {
    if (!Number.isFinite(amount)) return "0.00";

    return amount.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function normalizeCartQuantity(value: number | undefined): number {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.floor(value ?? 1));
}

export function normalizeCartSelections(
    selections: AddCartItemInput["selections"]
): CartSelection[] {
    return (selections ?? [])
        .map((selection) => ({
            label: selection.label.trim(),
            value: selection.value.trim(),
        }))
        .filter((selection) => selection.label.length > 0 && selection.value.length > 0);
}

export function createCartLineKey(
    productId: string,
    selections: CartSelection[],
    suffix?: string
): string {
    const normalizedSelections = [...selections]
        .sort((left, right) => left.label.localeCompare(right.label))
        .map((selection) => `${selection.label}:${selection.value}`)
        .join("|");
    const baseKey = `${productId}::${normalizedSelections}`;
    const normalizedSuffix = suffix?.trim();

    return normalizedSuffix ? `${baseKey}::${normalizedSuffix}` : baseKey;
}
