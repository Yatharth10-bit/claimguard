"use client";

import { useState } from "react";
import { AlertTriangle, Check, LoaderCircle, Sparkles } from "lucide-react";
import type { RegulationImpactResult } from "@/lib/complianceCopilot";

type ProductSummary = {
  id: string;
  name: string;
  category: string;
  claims: string;
};

type ClaimSummary = {
  id: string;
  product: string;
  originalClaim: string;
  riskLevel: "low" | "medium" | "high";
  riskyPhrases: string[];
  status: string;
  date: string;
};

type RegulationSummary = {
  id: string;
  organization: string;
  category: string;
  title: string;
  summary: string;
  officialUrl: string;
};

type RegulationImpactExplainerProps = {
  regulation: RegulationSummary;
  products: ProductSummary[];
  claims: ClaimSummary[];
};

const levelStyles = {
  high: "bg-rose text-high",
  medium: "bg-apricot text-medium",
  low: "bg-mint text-safe",
};

export function RegulationImpactExplainer({ regulation, products, claims }: RegulationImpactExplainerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RegulationImpactResult | null>(null);

  const explain = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regulation_impact",
          regulation,
          products,
          claims,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to explain regulation impact.");
      setResult(body.result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to explain regulation impact.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
      <button onClick={() => void explain()} disabled={loading} className="secondary !py-2">
        {loading ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}
        How does this affect my products?
      </button>

      {error && <p className="mt-3 text-sm text-high">{error}</p>}

      {result && (
        <div className="mt-4 space-y-4 border-t border-violet-100 pt-4">
          <p className="text-sm leading-6">{result.summary}</p>
          {result.affectedProducts.length ? result.affectedProducts.map((product) => (
            <article key={product.name} className="rounded-xl bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${levelStyles[product.riskLevel]}`}>
                  {product.riskLevel} risk
                </span>
                <span className="text-sm font-bold">{product.name}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{product.reason}</p>
              {product.matchedClaims.length > 0 && (
                <div className="mt-3 space-y-1">
                  {product.matchedClaims.map((claim) => (
                    <p key={claim} className="flex gap-2 text-sm text-muted">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-medium" />
                      {claim}
                    </p>
                  ))}
                </div>
              )}
              <p className="mt-3 flex gap-2 text-sm">
                <Check size={15} className="mt-0.5 shrink-0 text-safe" />
                {product.recommendedAction}
              </p>
            </article>
          )) : (
            <p className="text-sm text-muted">Add products and scan claims to unlock product-specific impact matching.</p>
          )}
          <p className="text-xs leading-5 text-muted">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}