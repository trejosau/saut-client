import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox/Checkbox";
import { RadioTiles } from "./radio/RadioTiles";
import { SelectField } from "./select/SelectField";
import { Switch } from "./switch/Switch";
import { TextAreaField } from "./textarea/TextAreaField";

describe("shared form primitives", () => {
  it("associates textarea errors with their field", () => {
    render(<TextAreaField label="Notas" error="Las notas son requeridas" />);
    const textarea = screen.getByRole("textbox", { name: "Notas" });
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Las notas son requeridas");
  });

  it("changes checkbox and switch values through their labels", async () => {
    const user = userEvent.setup();
    render(<><Checkbox label="Acepto" /><Switch label="Notificaciones" /></>);

    await user.click(screen.getByRole("checkbox", { name: "Acepto" }));
    await user.click(screen.getByRole("switch", { name: "Notificaciones" }));

    expect(screen.getByRole("checkbox", { name: "Acepto" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Notificaciones" })).toBeChecked();
  });

  it("selects an option from the accessible listbox", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField label="Talla" placeholder="Selecciona" options={[
      { value: "m", label: "Mediana" },
      { value: "l", label: "Grande" },
    ]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Talla" }));
    await user.click(screen.getByRole("option", { name: "Grande" }));

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Talla" })).toHaveTextContent("Grande");
  });

  it("reports radio tile changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioTiles name="color" label="Color" options={[
      { value: "black", label: "Negro" },
      { value: "beige", label: "Beige" },
    ]} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("radio", { name: "Beige" }));
    expect(onValueChange).toHaveBeenCalledWith("beige");
  });
});
