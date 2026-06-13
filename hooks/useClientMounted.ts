"use client";

import { useEffect, useState } from "react";

/**
 * Returns false during SSR and the first client render, then true after mount.
 * Use this before rendering buttons/inputs that browser extensions may mutate
 * before hydration (e.g. fdprocessedid attributes).
 */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}