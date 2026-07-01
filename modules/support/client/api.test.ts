import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addSupportCaseMessage,
  createSupportCase,
  getMySupportCase,
  listMySupportCases,
  listSupportReasons,
} from "./api";
import { requestJson } from "@/core/lib/api/fetcher";

vi.mock("@/core/lib/api/fetcher", () => ({ requestJson: vi.fn() }));

describe("support client", () => {
  beforeEach(() => vi.mocked(requestJson).mockReset());

  it("unwraps reasons and encodes guest identity", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ reasons: [{ code: "order", label: "Pedido", requires_order: true }] });
    await expect(listSupportReasons()).resolves.toEqual([{ code: "order", label: "Pedido", requires_order: true }]);

    vi.mocked(requestJson).mockResolvedValueOnce({ items: [], total: 0, limit: 50, offset: 0 });
    await listMySupportCases({ guest_email: "user+guest@example.com", guest_order_code: "AB CD" });
    expect(requestJson).toHaveBeenLastCalledWith(
      "/api/support/cases?guest_email=user%2Bguest%40example.com&guest_order_code=AB+CD",
      { method: "GET" }
    );
  });

  it("uses encoded case URLs and serializes mutations", async () => {
    vi.mocked(requestJson).mockResolvedValue({});
    await getMySupportCase("case/one");
    expect(requestJson).toHaveBeenLastCalledWith("/api/support/cases/case%2Fone", { method: "GET" });

    await createSupportCase({ reason: "other", message: "Necesito ayuda" });
    expect(requestJson).toHaveBeenLastCalledWith("/api/support/cases", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ reason: "other", message: "Necesito ayuda" }),
    }));

    await addSupportCaseMessage("case-1", { message: "Seguimiento" });
    expect(requestJson).toHaveBeenLastCalledWith("/api/support/cases/case-1/messages", expect.objectContaining({ method: "POST" }));
  });
});
