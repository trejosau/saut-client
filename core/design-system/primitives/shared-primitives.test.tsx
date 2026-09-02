import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Badge, Card, Combobox, ConfirmDialog, FileUpload, FormErrorBag, LoadingState, Modal, NumberStepper, SelectField, ToastProvider } from "@/core/design-system";

describe("shared design-system primitives", () => {
  it("renders composable surface primitives", () => {
    render(<Card title="Resumen" description="Detalle"><Badge tone="success">Activo</Badge></Card>);
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("filters and selects a combobox option", async () => {
    const onValueChange = vi.fn();
    render(<Combobox label="Categoría" options={[{ value: "a", label: "Playera" }, { value: "b", label: "Gorra" }]} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Categoría" });
    await userEvent.click(input);
    await userEvent.type(input, "gor");
    await userEvent.click(screen.getByRole("option", { name: "Gorra" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(input).toHaveValue("Gorra");
  });

  it("validates files consistently and exposes a preview/removal action", async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    render(<FileUpload label="Adjunto" acceptedTypes={["image/png"]} maxSize={1024} onChange={onChange} onError={onError} />);
    const input = screen.getByLabelText("Adjunto") as HTMLInputElement;
    const invalid = new File(["x"], "nota.txt", { type: "text/plain" });
    await userEvent.upload(input, invalid, { applyAccept: false });
    expect(onError).toHaveBeenCalledOnce();
    const valid = new File(["x"], "logo.png", { type: "image/png" });
    await userEvent.upload(input, valid);
    expect(onChange).toHaveBeenCalledWith([valid]);
    expect(screen.getByText("logo.png")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Quitar logo.png" }));
    expect(screen.queryByText("logo.png")).not.toBeInTheDocument();
  });

  it("uses the same modal semantics and closes from the backdrop", async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Confirmación">Contenido</Modal>);
    expect(screen.getByRole("dialog", { name: "Confirmación" })).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps focus inside dialogs and restores it when they close", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<><button>Origen</button><Modal open={false} onClose={onClose} title="Edición"><button>Guardar</button></Modal></>);
    const origin = screen.getByRole("button", { name: "Origen" });
    origin.focus();
    rerender(<><button>Origen</button><Modal open onClose={onClose} title="Edición"><button>Guardar</button></Modal></>);
    const dialog = await screen.findByRole("dialog", { name: "Edición" });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Cerrar" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<><button>Origen</button><Modal open={false} onClose={onClose} title="Edición"><button>Guardar</button></Modal></>);
    await waitFor(() => expect(origin).toHaveFocus());
  });

  it("selects options using the shared select contract", async () => {
    const onValueChange = vi.fn();
    render(<SelectField label="Talla" options={[{ value: "s", label: "Chica" }, { value: "m", label: "Mediana" }]} onValueChange={onValueChange} />);
    const select = screen.getByRole("combobox", { name: "Talla" });
    await userEvent.click(select);
    await userEvent.click(screen.getByRole("option", { name: "Mediana" }));
    expect(onValueChange).toHaveBeenCalledWith("m");
  });

  it("runs a confirmation once and closes the shared dialog", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDialog open title="Eliminar" message="¿Continuar?" onConfirm={onConfirm} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("locks controlled confirmation actions and supports non-destructive intent", () => {
    render(<ConfirmDialog open title="Guardar" message="¿Continuar?" loading destructive={false} onConfirm={vi.fn()} onClose={vi.fn()} />);
    const confirm = screen.getByRole("button", { name: "Confirmar" });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute("aria-busy", "true");
    expect(confirm).toHaveClass("bg-primary");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("reports rejected confirmations through the global notification host", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("No se pudo guardar"));
    const onClose = vi.fn();
    render(<ToastProvider><ConfirmDialog open title="Guardar" message="¿Continuar?" onConfirm={onConfirm} onClose={onClose} /></ToastProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(screen.getByText("No se pudo guardar")).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirmar" })).not.toBeDisabled();
  });

  it("presents form errors with the shared alert primitive", () => {
    render(<FormErrorBag bag={{ summary: ["Correo es obligatorio."], fields: {}, rawMessage: "Correo es obligatorio." }} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Revisa estos errores")).toBeInTheDocument();
    expect(screen.getByText("Correo es obligatorio.")).toBeInTheDocument();
  });

  it("announces the shared loading state", () => {
    render(<LoadingState title="Cargando pedidos" />);
    expect(screen.getByRole("status", { name: "Cargando pedidos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cargando pedidos" })).toBeInTheDocument();
  });

  it("clamps number stepper values and exposes accessible actions", async () => {
    const onValueChange = vi.fn();
    render(<NumberStepper value={2} min={1} max={3} onValueChange={onValueChange} aria-label="cantidad" />);
    await userEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(onValueChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole("button", { name: "Disminuir cantidad" }));
    expect(onValueChange).toHaveBeenCalledWith(1);
  });
});
