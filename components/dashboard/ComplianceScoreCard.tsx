"use client";

import Link from "next/link";
import { CheckCircle2, Gauge, RefreshCw } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const gradeColors: Record<string, string> = {
  A: "text-emerald-600",
  B: "text-blue-600",
  C: "text-amber-600",
  D: "text-orange-600",
  F: "text-red-600",
};

export function ComplianceScoreCard() {
  const { data, loading, error, refresh } = useDashboardStats();
  const scoreData = data?.complianceScore;

  if (loading) {
    return (
      <div className="surface animate-pulse p-5">
        <div className="h-4 w-1/3 rounded bg-stone" />
        <div className="mt-4 h-10 w-1/2 rounded bg-stone" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 rounded bg-stone" />)}
        </div>
      </div>
    );
  }

  if (error || !scoreData) {
    return (
      <div className="surface p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Compliance score</p>
        <p className="mt-3 text-sm text-muted">Unable to load score right now.</p>
        <button type="button" className="secondary mt-3 text-sm" onClick={() => refresh()}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const doneCount = scoreData.checklist.filter((c) => c.done).length;

  return (
    <div className="surface p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <Gauge size={22} />
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Brand risk score</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{scoreData.score}</span>
            <span className={`text-xl font-bold ${gradeColors[scoreData.grade] || ""}`}>Grade {scoreData.grade}</span>
          </div>
          <p className="mt-2 text-sm text-muted">{scoreData.summary}</p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Checklist · {doneCount}/{scoreData.checklist.length}
        </p>
        <ul className="mt-3 space-y-2">
          {scoreData.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} className={item.done ? "text-emerald-500" : "text-slate-300"} />
              <span className={item.done ? "text-muted line-through" : ""}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <Link href="/products" className="secondary mt-4 inline-flex text-sm">Improve score</Link>
    </div>
  );
}