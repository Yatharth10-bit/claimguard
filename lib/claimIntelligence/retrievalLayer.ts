import type { ClaimIntelligenceInput, RetrievedExample } from "@/lib/claimIntelligence/types";
import { retrieveFromMegaDataset } from "@/lib/claimIntelligence/megaSeedGenerator";
import { jaccardSimilarity } from "@/lib/claimIntelligence/similarity";

export type DbExampleRow = {
  claim_text: string;
  sector: string;
  risk_level: string;
  risk_reason: string;
  safer_rewrite: string;
  confidence_score: number;
  source: string;
};

export function retrieveSimilarExamples(
  input: ClaimIntelligenceInput,
  dbExamples: DbExampleRow[] = [],
  limit = 5,
): RetrievedExample[] {
  const pool = retrieveFromMegaDataset(input.claimText, input.sector, input.productCategory, 12);
  const scored: RetrievedExample[] = [];

  for (const ex of pool) {
    const sim = jaccardSimilarity(input.claimText, ex.claimText);
    if (sim < 0.05) continue;
    let bonus = 0;
    if (input.productCategory && ex.productCategory === input.productCategory) bonus += 0.05;
    if (input.contextType && ex.channel === input.contextType) bonus += 0.03;
    if (input.market && ex.region === input.market) bonus += 0.02;
    scored.push({
      claimText: ex.claimText,
      sector: ex.sector,
      riskLevel: ex.riskLevel,
      riskReason: ex.riskReason,
      saferRewrite: ex.saferRewrite,
      confidenceScore: ex.confidenceScore,
      source: ex.source,
      similarity: Math.min(0.99, sim + bonus),
    });
  }

  for (const row of dbExamples) {
    const sim = jaccardSimilarity(input.claimText, row.claim_text);
    if (sim < 0.1) continue;
    scored.push({
      claimText: row.claim_text,
      sector: row.sector,
      riskLevel: row.risk_level as "low" | "medium" | "high",
      riskReason: row.risk_reason,
      saferRewrite: row.safer_rewrite,
      confidenceScore: row.confidence_score,
      source: row.source,
      similarity: sim + 0.08,
    });
  }

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}