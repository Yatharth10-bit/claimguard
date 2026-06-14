"use client";

import Link from "next/link";
import { AlertTriangle, FileText, Instagram, ScanText, Target } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function FeatureStatsGrid() {
  const { data, loading } = useDashboardStats();
  const stats = data?.featureStats;

  const cards = [
    { href: "/products", label: "Amazon high risk", value: stats?.amazon.high_risk, note: `${stats?.amazon.listings ?? 0} listings`, icon: AlertTriangle, tone: "bg-orange-50 text-orange-600" },
    { href: "/social", label: "Social flagged", value: stats?.social.flagged, note: `${stats?.social.scanned ?? 0} scanned`, icon: Instagram, tone: "bg-pink-50 text-pink-600" },
    { href: "/products", label: "Label scans", value: stats?.labels, note: "Product labels", icon: ScanText, tone: "bg-blue-50 text-blue-600" },
    { href: "/products", label: "Substantiation", value: stats?.substantiation, note: "Evidence entries", icon: FileText, tone: "bg-emerald-50 text-emerald-600" },
    { href: "/competitors", label: "Competitors", value: stats?.competitors, note: "Active trackers", icon: Target, tone: "bg-purple-50 text-purple-600" },
  ];

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="surface animate-pulse p-5">
            <div className="h-10 w-10 rounded-xl bg-stone" />
            <div className="mt-3 h-6 w-1/3 rounded bg-stone" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className="surface block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.tone}`}>
              <card.icon size={18} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{card.label}</p>
              <p className="mt-1 text-2xl font-extrabold">{card.value ?? 0}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">{card.note}</p>
        </Link>
      ))}
    </div>
  );
}