import { useEffect, useRef } from "react";

/**
 * Focus an element once it mounts.
 *
 * Dialogs should land focus on their first field, but the `autoFocus`
 * attribute is barred by jsx-a11y because it steals focus on page load. Inside
 * a dialog that objection doesn't apply — the user just opened it — so this
 * does the same job explicitly.
 */
export function useAutoFocus<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    ref.current?.focus();
  }, [enabled]);

  return ref;
}
