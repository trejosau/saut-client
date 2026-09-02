import * as React from "react";

import { cn } from "@/core/lib/utils/cn";

export type CardProps = Omit<React.HTMLAttributes<HTMLElement>, "title"> & {
  as?: "article" | "section" | "div";
  variant?: "default" | "muted" | "interactive" | "dark";
  padding?: "none" | "sm" | "md" | "lg";
  title?: React.ReactNode;
  description?: React.ReactNode;
};

const variants = {
  default: "saut-card",
  muted: "saut-card saut-card--muted",
  interactive: "saut-card saut-card--interactive",
  dark: "saut-card saut-card--dark",
} as const;

const paddings = {
  none: "p-0",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-7",
} as const;

export function Card({ as = "article", variant = "default", padding = "md", title, description, className, children, ...props }: CardProps) {
  const Component = as;
  return (
    <Component className={cn(variants[variant], paddings[padding], className)} {...props}>
      {title !== undefined || description !== undefined ? (
        <CardHeader>
          {title !== undefined ? <CardTitle>{title}</CardTitle> : null}
          {description !== undefined ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      {children}
    </Component>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("saut-card__header", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("saut-card__title", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("saut-card__description", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("saut-card__content", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("saut-card__footer", className)} {...props} />;
}
