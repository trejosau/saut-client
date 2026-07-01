import { beforeEach, describe, expect, it } from "vitest";

import {
  buildOrderCode,
  listLinkedOrders,
  migrateGuestLinkedOrdersToAccount,
  upsertLinkedOrder,
} from "./storage";

describe("linked order storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("normalizes order codes and customer email", () => {
    expect(buildOrderCode("ABCDEF12-3456-7890")).toBe("abcdef12");

    upsertLinkedOrder({
      order_id: "ABCDEF12-3456-7890",
      order_code: "",
      email: " USER@EXAMPLE.COM ",
      account_id: null,
    });

    expect(listLinkedOrders()).toEqual([
      expect.objectContaining({ order_code: "abcdef12", email: "user@example.com" }),
    ]);
  });

  it("migrates guest orders and de-duplicates account records", () => {
    upsertLinkedOrder({ order_id: "order-1", order_code: "a1", email: "u@example.com", account_id: null });
    upsertLinkedOrder({ order_id: "order-1", order_code: "a1", email: "u@example.com", account_id: "account-1" });

    migrateGuestLinkedOrdersToAccount("account-1");

    expect(listLinkedOrders()).toHaveLength(0);
    expect(listLinkedOrders("account-1")).toHaveLength(1);
  });
});
