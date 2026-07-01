import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextField } from "./TextField";

describe("TextField", () => {
  it("associates its label and error feedback with the input", () => {
    render(<TextField label="Correo" error="Escribe un correo válido" />);

    const input = screen.getByRole("textbox", { name: "Correo" });
    const error = screen.getByRole("alert");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.parentElement?.id);
  });
});
