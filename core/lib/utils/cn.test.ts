import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("joins only defined and truthy class names", () => {
    expect(cn("base", false, undefined, "active", null)).toBe("base active");
  });
});
