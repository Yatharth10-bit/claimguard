"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/contexts/AuthContext";
import type { UsageSnapshot } from "@/lib/usage";

export function useUsage() {
  const { user, loading: authLoading } = useAuthSession();
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
    if (authLoading) return;
    if (!user) {
      setUsage(null);
      setLoading(false);
      setError("");
      return;
    }
    void refresh();
  }, [authLoading, user?.id, refresh]);

  return { usage, loading: authLoading || loading, error, refresh };
}