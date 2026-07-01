import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/core/design-system/feedback/ToastHost";
import { NewsletterForm } from "./NewsletterForm";

function renderForm() {
  return render(
    <ToastProvider>
      <NewsletterForm />
    </ToastProvider>
  );
}

describe("NewsletterForm", () => {
  it("submits a normalized payload and reports success", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    renderForm();

    await userEvent.type(screen.getByRole("textbox", { name: /correo electr/i }), "cliente@example.com");
    await userEvent.click(screen.getByRole("button", { name: "ENVIAR" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/newsletter", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: "cliente@example.com" }),
    }));
    expect(await screen.findByText("Correo registrado correctamente.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /correo electr/i })).toHaveValue("");
  });

  it("shows the API error and restores the submit action", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ message: "Correo no aceptado" }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    ));
    renderForm();

    await userEvent.type(screen.getByRole("textbox", { name: /correo electr/i }), "cliente@example.com");
    await userEvent.click(screen.getByRole("button", { name: "ENVIAR" }));

    expect(await screen.findByText("Correo no aceptado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ENVIAR" })).toBeEnabled();
  });
});
