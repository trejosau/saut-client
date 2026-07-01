import { describe, expect, it } from "vitest";

import {
  createCartLineKey,
  formatCurrencyMXN,
  normalizeCartQuantity,
  normalizeCartSelections,
} from "./cart-utils";

describe("cart utilities", () => {
  it("normalizes invalid and fractional quantities", () => {
    expect(normalizeCartQuantity(Number.NaN)).toBe(1);
    expect(normalizeCartQuantity(0)).toBe(1);
    expect(normalizeCartQuantity(3.9)).toBe(3);
  });

  it("trims and removes empty selections", () => {
    expect(normalizeCartSelections([
      { label: " Talla ", value: " M " },
      { label: " ", value: "Negro" },
    ])).toEqual([{ label: "Talla", value: "M" }]);
  });

  it("builds a stable key regardless of selection order", () => {
    const first = createCartLineKey("product", [
      { label: "Talla", value: "M" },
      { label: "Color", value: "Negro" },
    ], " front ");
    const second = createCartLineKey("product", [
      { label: "Color", value: "Negro" },
      { label: "Talla", value: "M" },
    ], "front");

    expect(first).toBe(second);
  });

  it("formats finite MXN amounts and protects invalid values", () => {
    expect(formatCurrencyMXN(1250)).toMatch(/1[,.]250\.00/);
    expect(formatCurrencyMXN(Number.POSITIVE_INFINITY)).toBe("0.00");
  });
});
