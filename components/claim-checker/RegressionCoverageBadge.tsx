import { ShieldCheck } from "lucide-react";
import { REGRESSION_STATS } from "@/lib/claimLearnings";

type RegressionCoverageBadgeProps = {
  compact?: boolean;
};

export function RegressionCoverageBadge({ compact = false }: RegressionCoverageBadgeProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-[11px] font-bold text-safe">
        <ShieldCheck size={12} />
        {REGRESSION_STATS.totalProducts}-product validated
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-mint p-4 sm:flex sm:items-center sm:gap-4">
      <span className="mb-3 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-safe sm:mb-0">
        <ShieldCheck size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-safe">Rules engine validated across {REGRESSION_STATS.totalProducts} product scenarios</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          {REGRESSION_STATS.sectors} categories · {REGRESSION_STATS.classificationAccuracy} classification · {REGRESSION_STATS.rewriteSafety} high-risk rewrite safety
        </p>
      </div>
    </div>
  );
}