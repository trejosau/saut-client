import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductCard, { type ProductCardData } from "./ProductCard";

const addItem = vi.fn();

vi.mock("@/core/cart", () => ({ useCart: () => ({ addItem }) }));

const product: ProductCardData = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Playera Drop 01",
  priceMXN: 599,
  href: "/producto/drop-01",
  imageFrontSrc: "/front.webp",
  imageBackSrc: "/back.webp",
  badge: "Limited",
  variants: [
    { id: "550e8400-e29b-41d4-a716-446655440001", label: "Rojo" },
    { id: "550e8400-e29b-41d4-a716-446655440002", label: "Azul" },
  ],
};

describe("ProductCard", () => {
  beforeEach(() => addItem.mockReset());

  it("exposes product, badge, price and detail navigation", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole("heading", { name: product.name })).toBeVisible();
    expect(screen.getByText("Limited")).toBeVisible();
    expect(screen.getByRole("link", { name: `Ver ${product.name}` })).toHaveAttribute("href", product.href);
    expect(screen.getByText(/599/)).toBeVisible();
  });

  it("selects a design with keyboard-accessible controls and adds it", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    await user.click(screen.getByRole("button", { name: "Diseño Azul" }));
    expect(screen.getByRole("button", { name: "Diseño Azul" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: `Agregar ${product.name} al carrito` }));

    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({
      productId: product.id,
      slug: "drop-01",
      unitPrice: 599,
      selections: expect.arrayContaining([{ label: "Diseño", value: "Azul" }]),
    }));
  });
});
