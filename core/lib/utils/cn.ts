export type ClassValue =
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | ClassValue[]
    | Record<string, boolean | undefined | null>;

/** Small dependency-free class combiner shared by the design system. */
export function cn(...values: ClassValue[]): string {
    const output: string[] = [];
    const visit = (value: ClassValue): void => {
        if (!value) return;
        if (typeof value === "string" || typeof value === "number") {
            output.push(String(value));
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }
        Object.entries(value).forEach(([key, enabled]) => {
            if (enabled) output.push(key);
        });
    };
    values.forEach(visit);
    return output.join(" ");
}
