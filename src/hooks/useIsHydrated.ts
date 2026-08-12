"use client";

import { useSyncExternalStore } from "react";

// Nothing to subscribe to — the value flips exactly once, at hydration.
const noopSubscribe = () => () => {};

/**
 * `false` during the server render and the first client render, `true` after.
 *
 * The usual way to write this is `useState(false)` plus a `useEffect` that
 * immediately calls `setState(true)`, which React now flags as a cascading
 * render (`react-hooks/set-state-in-effect`). `useSyncExternalStore` expresses
 * the same thing as what it actually is — a value that differs between the
 * server and client snapshots — with no extra render pass.
 *
 * Use it to guard anything non-deterministic across environments: locale
 * formatting, `matchMedia`, `navigator`, `localStorage`.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
