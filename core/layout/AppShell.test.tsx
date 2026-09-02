import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("provides a stable keyboard navigation target", () => {
    render(<AppShell><main>Contenido</main></AppShell>);

    const content = document.getElementById("main-content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("tabindex", "-1");
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
