"use client";

import * as React from "react";

import { Button, type ButtonProps } from "./Button";

export type IconButtonProps = Omit<ButtonProps, "children" | "leftIcon" | "rightIcon" | "size"> & {
  label: string;
  size?: Extract<NonNullable<ButtonProps["size"]>, "sm" | "md" | "lg" | "icon">;
  children?: React.ReactNode;
  icon?: React.ReactNode;
};

/** Accessible icon-only action. The visible label is always exposed to AT. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, icon, size = "icon", ...props }, ref) => (
    <Button ref={ref} size={size} aria-label={label} {...props}>
      <span aria-hidden="true" className="inline-flex items-center justify-center">{icon ?? children}</span>
    </Button>
  )
);

IconButton.displayName = "IconButton";
