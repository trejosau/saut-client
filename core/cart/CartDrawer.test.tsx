import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CartContextValue } from "./context";
import { CartDrawer } from "./CartDrawer";

const push = vi.fn();
const closeCart = vi.fn();
const clear = vi.fn();
const removeItem = vi.fn();
const setItemQuantity = vi.fn();
let cartState: CartContextValue;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/core/cart/context", () => ({ useCart: () => cartState }));

function createCartState(overrides: Partial<CartContextValue> = {}): CartContextValue {
  return {
    items: [],
    itemCount: 0,
    subtotal: 0,
    isOpen: true,
    addItem: vi.fn(),
    removeItem,
    setItemQuantity,
    clear,
    openCart: vi.fn(),
    closeCart,
    toggleCart: vi.fn(),
    ...overrides,
  };
}

describe("CartDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cartState = createCartState();
  });

  it("shows a recoverable empty state and closes it", async () => {
    const user = userEvent.setup();
    render(<CartDrawer />);

    expect(screen.getByText("Tu carrito está vacío")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continuar al pago" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Seguir comprando" }));
    expect(closeCart).toHaveBeenCalled();
  });

  it("updates, removes and checks out a populated cart", async () => {
    const user = userEvent.setup();
    cartState = createCartState({
      itemCount: 2,
      subtotal: 500,
      items: [{
        lineId: "line-1",
        key: "product-1::",
        productId: "product-1",
        name: "Playera Limited",
        imageSrc: "/front.webp",
        imageFrontSrc: "/front.webp",
        imageBackSrc: "/back.webp",
        unitPrice: 250,
        quantity: 2,
        selections: [{ label: "Talla", value: "M" }],
        addedAt: new Date().toISOString(),
      }],
    });
    render(<CartDrawer />);

    await user.click(screen.getByRole("button", { name: "Disminuir cantidad de Playera Limited" }));
    expect(setItemQuantity).toHaveBeenCalledWith("line-1", 1);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Cantidad de Playera Limited" }), {
      target: { value: "3" },
    });
    expect(setItemQuantity).toHaveBeenLastCalledWith("line-1", 3);
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(removeItem).toHaveBeenCalledWith("line-1");
    await user.click(screen.getByRole("button", { name: "Continuar al pago" }));
    expect(closeCart).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/checkout");
  });
});
