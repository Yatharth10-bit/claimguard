import { matchClaimRules, REWRITE_RULES } from "@/lib/claimRules";
import { getSourceReferences } from "@/lib/regulatorySources";

export type AnalyzeClaimInput = {
  claimText: string;
  productCategory: string;
  ingredients: string[];
  market: string;
  contextType: string;
};

export type ClaimAnalysisResult = {
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  riskyPhrases: string[];
  explanation: string;
  saferRewrite: string;
  sourceReferences: { title: string; url: string; organization: string; category: string }[];
  checklist: string[];
  disclaimer: string;
};

export const CLAIM_DISCLAIMER = "ClaimGuard provides AI-assisted risk flags and educational guidance. It is not legal advice. Consult a qualified compliance professional before publishing high-risk claims.";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function saferRewrite(claimText: string) {
  let rewrite = claimText;
  for (const rule of REWRITE_RULES) {
    rewrite = rewrite.replace(new RegExp(`\\b${escapeRegExp(rule.phrase)}\\b`, "gi"), rule.replacement);
  }
  const cleaned = rewrite
    .replace(/\b(supports?|supporting)\s+(supports?|supporting)\b/gi, "$1")
    .replace(/\b(wellness support)\s+\1\b/gi, "$1")
    .replace(/\b(healthy glucose metabolism)\s+\1\b/gi, "$1")
    .replace(/\b(general wellness)\s+\1\b/gi, "$1")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : cleaned;
}

export function analyzeClaim(input: AnalyzeClaimInput): ClaimAnalysisResult {
  const matches = matchClaimRules(input.claimText);
  const highMatches = matches.filter((rule) => rule.severity === "high");
  const mediumMatches = matches.filter((rule) => rule.severity === "medium");
  const contextModifier = /ad copy|social media|influencer script/i.test(input.contextType) ? 5 : 0;
  const supplementModifier = /dietary supplement/i.test(input.productCategory) ? 4 : 0;
  const ingredientModifier = input.ingredients.length === 0 ? 3 : 0;
  const marketModifier = /united states|fda|ftc|india|fssai/i.test(input.market) ? 0 : 4;
  const baseScore = highMatches.length ? 72 : mediumMatches.length ? 38 : 12;
  const riskScore = Math.min(99, baseScore + highMatches.length * 7 + mediumMatches.length * 4 + contextModifier + supplementModifier + ingredientModifier + marketModifier);
  const riskLevel = highMatches.length || riskScore >= 75 ? "high" : mediumMatches.length || riskScore >= 40 ? "medium" : "low";
  const uniqueExplanations = [...new Set(matches.map((rule) => rule.explanation))];
  const contextNote = `The claim was reviewed as ${input.contextType.toLowerCase()} for a ${input.productCategory.toLowerCase()} in ${input.market}.`;
  const explanation = matches.length
    ? `${uniqueExplanations.join(" ")} ${contextNote}`
    : `No configured high- or medium-risk phrases were found. ${contextNote} The full claim still needs truthful substantiation and contextual review.`;

  const checklist = [
    "Confirm every objective claim is supported by appropriate evidence.",
    `Review the complete ${input.contextType.toLowerCase()} context, including nearby visuals and qualifiers.`,
    input.ingredients.length ? "Confirm the wording accurately reflects the listed ingredients and product formulation." : "Add the ingredient list before final review.",
    riskLevel === "high" ? "Escalate this claim to a qualified compliance professional before publishing." : "Document the final wording and supporting evidence.",
  ];

  return {
    riskLevel,
    riskScore,
    riskyPhrases: [...new Set(matches.map((rule) => rule.displayPhrase || rule.phrase))],
    explanation,
    saferRewrite: saferRewrite(input.claimText),
    sourceReferences: getSourceReferences(input),
    checklist,
    disclaimer: CLAIM_DISCLAIMER,
  };
}
