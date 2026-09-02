"use client";

import * as React from "react";

export function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactElement }) {
  const childProps = children.props as { "aria-label"?: string };
  return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    title: typeof content === "string" ? content : undefined,
    "aria-label": childProps["aria-label"] ?? (typeof content === "string" ? content : undefined),
  });
}
