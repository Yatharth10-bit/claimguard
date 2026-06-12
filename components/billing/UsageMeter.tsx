"use client";

import Link from "next/link";
import { Gauge, Package, Sparkles } from "lucide-react";
import { formatProductLimit, formatScanLimit } from "@/lib/planLimits";
import type { UsageSnapshot } from "@/lib/usage";

type UsageMeterProps = {
  usage: UsageSnapshot | null;
  compact?: boolean;
};

export function UsageMeter({ usage, compact = false }: UsageMeterProps) {
  if (!usage) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-stone px-3 py-1 text-[11px] font-semibold text-muted">
        <Gauge size={12} />
        {formatScanLimit(usage.limits, usage.claimScansUsed)}
      </span>
    );
  }

  const lowScans = usage.scansRemaining !== null && usage.scansRemaining <= 1;

  return (
    <div className={`rounded-2xl border p-4 ${lowScans ? "border-amber-100 bg-amber-50" : "border-black/[.06] bg-stone"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Plan usage</p>
          <p className="mt-1 text-sm font-bold capitalize">{usage.limits.label} plan</p>
        </div>
        {lowScans && usage.plan === "radar" && (
          <Link href="/settings" className="primary !py-2 text-xs">
            <Sparkles size={14} />
            Upgrade
          </Link>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Gauge size={15} />
          {formatScanLimit(usage.limits, usage.claimScansUsed)}
        </p>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Package size={15} />
          {formatProductLimit(usage.limits, usage.productCount)}
        </p>
      </div>
    </div>
  );
}