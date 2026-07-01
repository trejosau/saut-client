import { describe, expect, it } from "vitest";

import { buildCatalogCategoryHref, parseCatalogCategory } from "./categories";

describe("catalog categories", () => {
  it("accepts canonical and legacy category values", () => {
    expect(parseCatalogCategory(" SPORTS ")).toBe("sports");
    expect(parseCatalogCategory("temporada")).toBe("navidad");
  });

  it("falls back to all for unknown values", () => {
    expect(parseCatalogCategory("unknown")).toBe("all");
    expect(parseCatalogCategory(null)).toBe("all");
  });

  it("builds stable catalog URLs", () => {
    expect(buildCatalogCategoryHref("all")).toBe("/catalogo");
    expect(buildCatalogCategoryHref("sports")).toBe("/catalogo?categoria=sports");
  });
});
