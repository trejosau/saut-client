import type * as React from "react";

export type CssVars<T extends string> = React.CSSProperties &
    Partial<Record<T, string>>;
