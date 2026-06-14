"use client";

import { memo } from "react";
import type { ClaimIntelligenceResult } from "@/lib/claimIntelligence/types";
import { riskCategoryLabel } from "@/lib/claimIntelligence/riskCategories";

type Props = {
  intelligence: ClaimIntelligenceResult | null;
  loading?: boolean;
  enriching?: boolean;
};

function ClaimIntelligencePanelInner({ intelligence, loading, enriching }: Props) {
  if (loading && !intelligence) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-32 rounded bg-black/5" />
        <div className="h-16 rounded-xl bg-black/5" />
        <div className="h-24 rounded-xl bg-black/5" />
      </div>
    );
  }

  if (!intelligence) return null;

  return (
    <div className="mt-5 space-y-4 border-t border-black/[.06] pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-lavender/10 px-3 py-1 text-xs font-bold text-lavender">
          Confidence {intelligence.confidenceScore}%
        </span>
        <span className="text-xs text-muted">Estimated from public + regulatory patterns</span>
        {enriching && <span className="text-xs text-muted animate-pulse">Loading deeper analysis…</span>}
      </div>

      <div className="rounded-xl bg-stone p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Main issue</p>
        <p className="mt-2 text-sm leading-6 text-ink">{intelligence.mainIssue}</p>
      </div>

      <div className="rounded-xl bg-stone p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Why it matters</p>
        <p className="mt-2 text-sm leading-6 text-ink">{intelligence.whyItMatters}</p>
      </div>

      <div className="rounded-xl border border-mint bg-mint/30 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-safe">Suggested next action</p>
        <p className="mt-2 text-sm leading-6 text-safe">{intelligence.suggestedNextAction}</p>
      </div>

      {intelligence.riskCategories.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Risk categories</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {intelligence.riskCategories.slice(0, 5).map((cat) => (
              <span key={cat} className="rounded-full border border-black/[.06] bg-white px-3 py-1 text-xs font-medium text-ink">
                {riskCategoryLabel(cat)}
              </span>
            ))}
          </div>
        </div>
      )}

      {intelligence.similarPatterns.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Similar patterns (public data)</p>
          <ul className="mt-2 space-y-2">
            {intelligence.similarPatterns.map((p) => (
              <li key={p.pattern} className="rounded-xl bg-stone p-3 text-sm leading-6">
                <span className="font-semibold text-ink">{p.pattern}</span>
                <span className="text-muted"> · {p.frequency}</span>
                <p className="mt-1 text-xs text-muted">{p.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {intelligence.retrievedExamples.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Similar claim examples</p>
          <ul className="mt-2 space-y-2">
            {intelligence.retrievedExamples.slice(0, 3).map((ex, i) => (
              <li key={i} className="rounded-xl border border-black/[.06] p-3 text-sm">
                <p className="leading-6 text-ink">&ldquo;{ex.claimText.slice(0, 120)}{ex.claimText.length > 120 ? "…" : ""}&rdquo;</p>
                <p className="mt-1 text-xs text-muted">{ex.sector} · {ex.riskLevel} risk · {Math.round(ex.similarity * 100)}% match</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] leading-5 text-muted">
        Engine {intelligence.modelVersion} · Rules {intelligence.rulesVersion} · Dataset {intelligence.datasetVersion}
        · Layers: {intelligence.layersUsed.join(", ")}
      </p>
    </div>
  );
}

export const ClaimIntelligencePanel = memo(ClaimIntelligencePanelInner);