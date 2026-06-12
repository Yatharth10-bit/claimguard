import { AlertTriangle } from "lucide-react";
import { RISKY_PATTERN_TIPS } from "@/lib/claimLearnings";

export function RiskPatternTips() {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-medium" />
        <h2 className="font-bold">Patterns that fail most often</h2>
      </div>
      <p className="mt-1 text-xs text-muted">Learned from 100-product regression testing</p>
      <div className="mt-4 space-y-4">
        {RISKY_PATTERN_TIPS.map((tip) => (
          <div key={tip.id} className="rounded-xl bg-stone p-4">
            <p className="text-sm font-bold text-ink">{tip.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{tip.detail}</p>
            <p className="mt-2 text-[11px] text-muted">
              e.g. {tip.examples.map((e) => `"${e}"`).join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}