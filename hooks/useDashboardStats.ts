"use client";

import { useEffect, useState } from "react";

type DashboardStats = {
  featureStats: {
    amazon: { listings: number; high_risk: number };
    social: { scanned: number; flagged: number };
    labels: number;
    substantiation: number;
    competitors: number;
  };
  complianceScore: {
    score: number;
    grade: string;
    summary: string;
    checklist: { id: string; label: string; done: boolean }[];
  };
};

let cache: DashboardStats | null = null;
let inflight: Promise<DashboardStats | null> | null = null;

async function fetchDashboardStats(): Promise<DashboardStats | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch("/api/dashboard")
    .then(async (res) => {
      if (!res.ok) return null;
      const body = await res.json();
      cache = body;
      return body as DashboardStats;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardStats | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchDashboardStats().then((result) => {
      if (!active) return;
      if (result) setData(result);
      else setError(true);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error, refresh: () => { cache = null; void fetchDashboardStats().then(setData); } };
}

export function invalidateDashboardStats() {
  cache = null;
}