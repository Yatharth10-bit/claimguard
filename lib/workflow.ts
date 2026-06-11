export type WorkflowProduct = {
  id: string;
  name: string;
  category: string;
  claims: string;
};

export type WorkflowClaim = {
  id: string;
  product: string;
  originalClaim: string;
  riskLevel: "low" | "medium" | "high";
  riskyPhrases: string[];
  status: string;
  date: string;
};

export type WorkflowRegulation = {
  id: string;
  organization: string;
  category: string;
  title: string;
  summary: string;
  officialUrl: string;
};

export type ImpactMatch = {
  id: string;
  product: string;
  regulation: WorkflowRegulation;
  matchedClaims: string[];
  reason: string;
  riskLevel: "low" | "medium" | "high";
  recommendedAction: string;
};

const topicTerms: Record<string, string[]> = {
  FDA: ["label", "supplement", "structure/function", "disease", "ingredient", "disclaimer"],
  FTC: ["advertising", "health", "claim", "substantiation", "testimonial", "endorsement"],
  FSSAI: ["food", "label", "safety", "ingredient", "claim"],
};

export function splitClaimLikeSentences(copy: string) {
  return copy
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+|[•●]\s*/)
    .map((sentence) => sentence.trim().replace(/^[-*]\s*/, ""))
    .filter((sentence) => sentence.length >= 3)
    .slice(0, 40);
}

export function needsSupplementDisclaimer(category: string, claimText: string) {
  if (!/dietary supplement/i.test(category)) return false;
  return /\b(supports?|helps?|maintains?|promotes?|healthy|wellness|immune|joint|calm|focus|energy|sleep)\b/i.test(claimText);
}

export function matchRegulationImpacts(
  products: WorkflowProduct[],
  claims: WorkflowClaim[],
  regulations: WorkflowRegulation[],
): ImpactMatch[] {
  const matches: ImpactMatch[] = [];
  for (const product of products) {
    const productClaims = claims.filter((claim) => claim.product === product.name);
    const searchable = [product.category, product.claims, ...productClaims.map((claim) => `${claim.originalClaim} ${claim.riskyPhrases.join(" ")}`)]
      .join(" ")
      .toLowerCase();

    for (const regulation of regulations) {
      const terms = topicTerms[regulation.organization] || [];
      const matchedTerms = terms.filter((term) => searchable.includes(term));
      const relevantByCategory =
        (/supplement/i.test(product.category) && /supplement|label|claim/i.test(`${regulation.category} ${regulation.title}`))
        || (/food|beverage/i.test(product.category) && /food|label|advertising/i.test(`${regulation.category} ${regulation.title}`));
      const relevantClaims = productClaims.filter((claim) =>
        matchedTerms.some((term) => `${claim.originalClaim} ${claim.riskyPhrases.join(" ")}`.toLowerCase().includes(term)),
      );
      if (!matchedTerms.length && !relevantByCategory) continue;

      const highestRisk = productClaims.some((claim) => claim.riskLevel === "high")
        ? "high"
        : productClaims.some((claim) => claim.riskLevel === "medium") ? "medium" : "low";
      const examples = relevantClaims.length ? relevantClaims : productClaims.slice(0, 2);
      matches.push({
        id: `${regulation.id}:${product.id}`,
        product: product.name,
        regulation,
        matchedClaims: examples.map((claim) => claim.originalClaim),
        reason: `${regulation.organization} ${regulation.category.toLowerCase()} guidance may affect ${product.name}${matchedTerms.length ? ` because its product or claim copy references ${matchedTerms.slice(0, 3).join(", ")}` : ` because it is a ${product.category.toLowerCase()}`}.`,
        riskLevel: highestRisk,
        recommendedAction: highestRisk === "high"
          ? "Create an expert-review task and revise flagged claims before the next publication."
          : "Review the official update, confirm substantiation, and document any wording changes.",
      });
    }
  }
  return matches.slice(0, 30);
}

export function calculateProductRisk(
  product: WorkflowProduct,
  claims: WorkflowClaim[],
  unresolvedTasks: number,
  regulationMatches: number,
) {
  const productClaims = claims.filter((claim) => claim.product === product.name);
  const high = productClaims.filter((claim) => claim.riskLevel === "high").length;
  const medium = productClaims.filter((claim) => claim.riskLevel === "medium").length;
  const outdated = productClaims.filter((claim) => {
    const date = Date.parse(claim.date);
    return Number.isFinite(date) && Date.now() - date > 180 * 24 * 60 * 60 * 1000;
  }).length;
  const missingDisclaimer = needsSupplementDisclaimer(product.category, product.claims) ? 1 : 0;
  const score = Math.min(100, 12 + high * 24 + medium * 11 + missingDisclaimer * 12 + outdated * 6 + unresolvedTasks * 8 + regulationMatches * 5);
  return {
    score,
    level: score >= 70 ? "High Risk" : score >= 40 ? "Medium Risk" : "Low Risk",
    factors: { high, medium, missingDisclaimer, outdated, unresolvedTasks, regulationMatches },
  };
}
