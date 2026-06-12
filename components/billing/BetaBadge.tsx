import { PUBLIC_BETA } from "@/lib/planLimits";

export function BetaBadge() {
  if (!PUBLIC_BETA) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-violet-700">
      Public beta
    </span>
  );
}