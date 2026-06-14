import type { ClaimIntelligenceInput, RetrievedExample } from "@/lib/claimIntelligence/types";
import type { ClaimAnalysisResult } from "@/lib/analyzeClaim";
import { applySectorBoost, getSectorRiskProfile } from "@/lib/claimIntelligence/sectorProfile";

export function refineRiskScore(base: ClaimAnalysisResult, input: ClaimIntelligenceInput, extraRuleHits: number): number {
  let score = base.riskScore;
  if (extraRuleHits) score = Math.min(99, score + extraRuleHits * 3);
  const boosted = applySectorBoost(input.claimText, input.sector, score);
  return boosted.score;
}

export function refineRiskLevel(
  baseLevel: ClaimAnalysisResult["riskLevel"],
  refinedScore: number,
  extraHighHits: number,
): ClaimAnalysisResult["riskLevel"] {
  if (extraHighHits || refinedScore >= 75) return "high";
  if (refinedScore >= 40 || baseLevel === "medium") return "medium";
  return baseLevel;
}

export function blendSaferRewrite(
  originalRewrite: string,
  claimText: string,
  retrieved: RetrievedExample[],
  riskLevel: string,
): string {
  const top = retrieved.find((r) => r.similarity >= 0.25 && r.riskLevel === riskLevel && r.saferRewrite);
  if (!top?.saferRewrite) return originalRewrite;

  if (top.similarity >= 0.4 && top.saferRewrite.length > 12) {
    return top.saferRewrite;
  }

  if (originalRewrite === claimText && top.saferRewrite !== claimText) {
    return top.saferRewrite;
  }

  return originalRewrite;
}

export function buildSectorInsight(input: ClaimIntelligenceInput): string | null {
  const profile = getSectorRiskProfile(input.sector);
  if (!profile) return null;
  const hit = profile.priorityPatterns.some((p) => p.test(input.claimText));
  return hit ? profile.focusNote : null;
}