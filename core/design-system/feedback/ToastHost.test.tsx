import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast, notify } from "./ToastHost";

function Trigger() {
  const toast = useToast();
  return <button type="button" onClick={() => toast.success("Guardado")}>Avisar</button>;
}

describe("global notification host", () => {
  it("supports typed notifications, dismissal and duplicate suppression", async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Avisar" }));
    await userEvent.click(screen.getByRole("button", { name: "Avisar" }));
    expect(screen.getAllByText("Guardado")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar notificación" }));
    expect(screen.queryByText("Guardado")).not.toBeInTheDocument();
  });

  it("accepts the imperative API when a provider is mounted", async () => {
    render(<ToastProvider />);
    await Promise.resolve();
    notify.info("Información");
    await waitFor(() => expect(screen.getByText("Información")).toBeInTheDocument());
  });

  it("bounds duplicate history so unique notifications do not grow it indefinitely", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    render(<ToastProvider />);
    await Promise.resolve();

    notify.info("Mensaje inicial");
    for (let index = 0; index < 110; index += 1) notify.info(`Mensaje ${index}`);
    await waitFor(() => expect(screen.getByText("Mensaje 109")).toBeInTheDocument());

    notify.info("Mensaje inicial");
    await waitFor(() => expect(screen.getByText("Mensaje inicial")).toBeInTheDocument());
  });
});
