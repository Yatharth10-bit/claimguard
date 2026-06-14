"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function AmazonRiskCard() {
  const { data, loading } = useDashboardStats();
  const stats = data?.featureStats.amazon;

  return (
    <Link href="/products" className="surface block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><AlertTriangle size={18} /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Amazon listings at risk</p>
          {loading ? (
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-stone" />
          ) : (
            <p className="mt-1 text-2xl font-extrabold">{stats?.high_risk ?? 0}</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        {loading ? "Loading..." : `${stats?.listings ?? 0} listing${stats?.listings === 1 ? "" : "s"} tracked`} · Scan before publish
      </p>
    </Link>
  );
}