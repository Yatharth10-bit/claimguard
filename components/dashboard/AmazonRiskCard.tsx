"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function AmazonRiskCard() {
  const [stats, setStats] = useState<{ listings: number; high_risk: number } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/feature-stats")
      .then(async (response) => {
        if (!response.ok) return { listings: 0, high_risk: 0 };
        const body = await response.json();
        return body.amazon || { listings: 0, high_risk: 0 };
      })
      .then((amazon) => {
        if (active) setStats(amazon);
      })
      .catch(() => {
        if (active) setStats({ listings: 0, high_risk: 0 });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Link href="/products" className="surface block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><AlertTriangle size={18} /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Amazon listings at risk</p>
          <p className="mt-1 text-2xl font-extrabold">{stats ? stats.high_risk : "—"}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        {stats ? `${stats.listings} listing${stats.listings === 1 ? "" : "s"} tracked` : "Loading..."} · Scan before publish
      </p>
    </Link>
  );
}