import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartProvider } from "./CartProvider";
import { useCart } from "./context";

vi.mock("./CartDrawer", () => ({ CartDrawer: () => null }));

function CartProbe() {
  const cart = useCart();
  return (
    <div>
      <span data-testid="count">{cart.itemCount}</span>
      <span data-testid="subtotal">{cart.subtotal}</span>
      <span data-testid="open">{String(cart.isOpen)}</span>
      <button onClick={() => cart.addItem({
        productId: "product-1",
        name: "Playera",
        imageSrc: "/shirt.webp",
        unitPrice: 250,
        quantity: 2,
        selections: [{ label: "Talla", value: "M" }],
      })}>Agregar</button>
      <button onClick={cart.clear}>Vaciar</button>
    </div>
  );
}

describe("CartProvider", () => {
  beforeEach(() => window.localStorage.clear());

  it("combines equivalent lines and derives totals", async () => {
    render(<CartProvider><CartProbe /></CartProvider>);
    const addButton = screen.getByRole("button", { name: "Agregar" });

    await act(async () => addButton.click());
    await act(async () => addButton.click());

    expect(screen.getByTestId("count")).toHaveTextContent("4");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("1000");
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("restores safe persisted items and clears the cart", async () => {
    window.localStorage.setItem("saut.cart.v1", JSON.stringify({ items: [{
      lineId: "line-1",
      key: "product-1::",
      productId: "product-1",
      name: "Playera",
      imageSrc: "/shirt.webp",
      unitPrice: 300,
      quantity: 1,
      selections: [],
      addedAt: new Date().toISOString(),
    }] }));

    render(<CartProvider><CartProbe /></CartProvider>);
    await act(async () => undefined);
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await act(async () => screen.getByRole("button", { name: "Vaciar" }).click());
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
