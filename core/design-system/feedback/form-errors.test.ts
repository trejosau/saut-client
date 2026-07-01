import { describe, expect, it } from "vitest";

import { fieldError, toFormErrorBag } from "./form-errors";

describe("form error normalization", () => {
  it("extracts API JSON messages and required fields", () => {
    const bag = toFormErrorBag(new Error(
      'Admin API error (400): {"message":"email y telefono son obligatorios"}'
    ));

    expect(bag.summary).toEqual(["email y telefono son obligatorios"]);
    expect(fieldError(bag, "email")).toBe("Este campo es obligatorio.");
    expect(fieldError(bag, "telefono")).toBe("Este campo es obligatorio.");
  });

  it("normalizes known messages and preserves a fallback", () => {
    expect(toFormErrorBag("Debe enviar al menos un campo de checklist").rawMessage)
      .toBe("Debes poner al menos un campo del checklist.");
    expect(toFormErrorBag(null, "Error controlado").summary).toEqual(["Error controlado"]);
  });

  it("returns null for fields without an error", () => {
    expect(fieldError(toFormErrorBag("email invalido"), "phone")).toBeNull();
  });
});
