import { analyzeClaim } from "@/lib/analyzeClaim";

export type CompetitorClaim = {
  text: string;
  risk: "low" | "medium" | "high";
  risky_phrases: string[];
};

function hashContent(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0").slice(0, 16);
}

export function scanCompetitorContent(
  rawContent: string,
  product: { category: string; market: string },
): {
  content_hash: string;
  claims_found: CompetitorClaim[];
  high_risk_claims: CompetitorClaim[];
} {
  const sentences = rawContent
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const claims_found: CompetitorClaim[] = [];
  const high_risk_claims: CompetitorClaim[] = [];

  for (const sentence of sentences) {
    if (!/supports?|helps?|cures?|treats?|prevents?|boosts?|guarantee|proven|clinically/i.test(sentence)) continue;
    const analysis = analyzeClaim({
      claimText: sentence,
      productCategory: product.category,
      ingredients: [],
      market: product.market,
      contextType: "Website",
    });
    const claim: CompetitorClaim = {
      text: sentence,
      risk: analysis.riskLevel,
      risky_phrases: analysis.riskyPhrases,
    };
    claims_found.push(claim);
    if (analysis.riskLevel === "high") high_risk_claims.push(claim);
  }

  return {
    content_hash: hashContent(rawContent),
    claims_found,
    high_risk_claims,
  };
}