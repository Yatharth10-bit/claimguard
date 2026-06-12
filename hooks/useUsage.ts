"use client";

import { useCallback, useEffect, useState } from "react";
import type { UsageSnapshot } from "@/lib/usage";

export function useUsage() {
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/usage");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load usage.");
      setUsage(body.usage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { usage, loading, error, refresh };
}