import { describe, expect, it } from "vitest";

import { ApiError } from "@/core/lib/api/errors";
import { fieldError, toFormErrorBag } from "./form-errors";

describe("form error normalization", () => {
  it("keeps server field errors and exposes a summary", () => {
    const bag = toFormErrorBag(new ApiError("Revisa los campos", {
      status: 422,
      fieldErrors: { email: ["Correo inválido"], name: ["Nombre requerido"] },
    }));

    expect(fieldError(bag, "email")).toBe("Correo inválido");
    expect(fieldError(bag, "name")).toBe("Nombre requerido");
    expect(bag.summary).toEqual(["Revisa los campos"]);
  });
});
