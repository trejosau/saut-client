import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestJson } from "@/core/lib/api/fetcher";
import {
  addCustomizedCartItem,
  addPredesignedCartItem,
  cancelPaymentAttempt,
  confirmPaymentAttempt,
  createCartSession,
  createCheckoutSession,
  createPaymentAttempt,
  getCartSession,
  getCheckoutSession,
  getOrder,
  getOrderByCheckout,
  getPaymentAttempt,
  lookupOrderByCode,
  removeCartItem,
  selectCheckoutShippingQuote,
  updateLocalOrderAddress,
} from "./api";

vi.mock("@/core/lib/api/fetcher", () => ({ requestJson: vi.fn() }));

describe("commerce client", () => {
  beforeEach(() => vi.mocked(requestJson).mockReset().mockResolvedValue({}));

  it("routes cart and checkout commands through the centralized fetcher", async () => {
    await createCartSession({ guest_session_id: "guest-1" });
    await getCartSession("cart/1");
    await addPredesignedCartItem("cart-1", {
      publication_slug: "drop-1", garment_type: "tshirt", color: "Negra", size: "M", grammage_g: 240, quantity: 1,
    });
    await addCustomizedCartItem("cart-1", {
      garment_type: "tshirt", color: "Negra", size: "M", grammage_g: 240,
      quantity: 1, unit_price_mxn: 500, front_assets: [], back_assets: [],
    });
    await removeCartItem("cart-1", "line/1");
    await createCheckoutSession({
      cart_id: "cart-1", email: "buyer@example.com", phone: "5555555555",
      address: { line1: "Calle 1", city: "Torreón", state: "Coahuila", postal_code: "27000" },
    });
    await getCheckoutSession("checkout-1");
    await selectCheckoutShippingQuote("checkout-1", "quote-1");

    expect(requestJson).toHaveBeenCalledTimes(8);
    expect(requestJson).toHaveBeenCalledWith(expect.stringContaining("cart%2F1"), { method: "GET" });
    expect(requestJson).toHaveBeenCalledWith(expect.stringContaining("line%2F1"), { method: "DELETE" });
  });

  it("routes payment and order commands with encoded identifiers", async () => {
    await createPaymentAttempt("checkout-1", { return_origin: "https://saut.mx" });
    await getPaymentAttempt("attempt-1");
    await confirmPaymentAttempt("attempt-1");
    await cancelPaymentAttempt("attempt-1");
    await getOrder("order/1");
    await getOrderByCheckout("checkout/1");
    await lookupOrderByCode({ email: "buyer@example.com", order_code: "ABCD1234" });
    await updateLocalOrderAddress("order-1", {
      address: { line1: "Calle 2", city: "Torreón", state: "Coahuila", postal_code: "27000" },
      reason: "Corrección",
    });

    expect(requestJson).toHaveBeenCalledTimes(8);
    expect(requestJson).toHaveBeenCalledWith(expect.stringContaining("order%2F1"), { method: "GET" });
    expect(requestJson).toHaveBeenCalledWith(expect.stringContaining("orders/lookup?"), { method: "GET" });
  });
});
