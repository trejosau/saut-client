"use client";

import * as React from "react";

const subscribe = () => () => undefined;

/** Returns false during server rendering and true in the browser without an effect-driven render. */
export function useHydrated() {
  return React.useSyncExternalStore(subscribe, () => true, () => false);
}
