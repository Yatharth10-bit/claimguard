import { analyzeClaim, type AnalyzeClaimInput, type ClaimAnalysisResult } from "@/lib/analyzeClaim";
import {
  applyFalseNegativeGuard,
  isKnownSafeMarketingPhrase,
  runFalseNegativeGuard,
} from "@/lib/claimIntelligence/falseNegativeGuard";
import type { ClaimIntelligenceInput } from "@/lib/claimIntelligence/types";

/** Full rules-engine analysis with false-negative guard applied (used by regression + quick checks). */
export function analyzeClaimProtected(input: AnalyzeClaimInput | ClaimIntelligenceInput): ClaimAnalysisResult & {
  guardApplied?: boolean;
  similarPattern?: string;
  suggestedNextAction?: string;
} {
  const base = analyzeClaim(input);
  if (isKnownSafeMarketingPhrase(input.claimText)) {
    return {
      ...base,
      riskLevel: "low",
      riskScore: Math.min(base.riskScore, 18),
      riskyPhrases: [],
      explanation: `This wording uses softer structure/function language appropriate for ${input.productCategory}. ${base.explanation.split(".").slice(-1)[0] || ""}`.trim(),
    };
  }
  const guard = runFalseNegativeGuard(input, base);
  return applyFalseNegativeGuard(input, base, guard);
}