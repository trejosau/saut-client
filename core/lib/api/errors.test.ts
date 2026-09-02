import { describe, expect, it } from "vitest";

import { ApiError, errorMessage, normalizeApiError } from "./errors";

describe("API error contract", () => {
  it("keeps status, code and de-duplicated field errors", () => {
    const error = new ApiError("Revisa los campos", {
      status: 422,
      fieldErrors: { email: ["Correo inválido", "Correo inválido"] },
    });

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fieldErrors).toEqual({ email: ["Correo inválido"] });
    expect(error.retryable).toBe(false);
  });

  it("normalizes abort/network failures and provides status fallbacks", () => {
    expect(normalizeApiError(new TypeError("offline")).code).toBe("NETWORK_ERROR");
    expect(errorMessage(new ApiError("", { status: 403 }))).toContain("permisos");
  });
});
