import { describe, expect, it } from "vitest";

import { countGarmentImages, createNewCustomizerDesign, createNewGarment } from "./types";

describe("customizer domain factories", () => {
  it("creates a safe default design", () => {
    const design = createNewCustomizerDesign("Drop propio");
    expect(design.title).toBe("Drop propio");
    expect(design.ownerAccountId).toBeNull();
    expect(design.garments).toHaveLength(1);
    expect(design.garments[0]).toEqual(expect.objectContaining({ size: "M", quantity: 1 }));
  });

  it("counts images separately from text elements", () => {
    const garment = createNewGarment();
    garment.sides.front.elements.push({
      id: "one", assetId: "img-one", type: "image", src: "/one.png", fileName: "one.png",
      xPct: 0, yPct: 0, scale: 1, rotationDeg: 0, createdAt: new Date().toISOString(),
    });
    garment.sides.back.elements.push({
      id: "text", assetId: "txt-one", type: "text", text: "SAUT", fontFamily: "sans-serif",
      colorHex: "#000000", fontSizePx: 20, fontWeight: 700,
      xPct: 0, yPct: 0, scale: 1, rotationDeg: 0, createdAt: new Date().toISOString(),
    });

    expect(countGarmentImages(garment)).toEqual({ front: 1, back: 0, total: 1 });
  });
});
