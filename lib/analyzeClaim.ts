import { matchClaimRules, REWRITE_RULES } from "@/lib/claimRules";
import { CLAIM_RULES_VERSION } from "@/lib/claimRulesVersion";
import { getSourceReferences } from "@/lib/regulatorySources";

export type AnalyzeClaimInput = {
  claimText: string;
  productCategory: string;
  ingredients: string[];
  market: string;
  contextType: string;
};

export type ClaimAnalysisResult = {
  riskLevel: "low" | "medium" | "high" | "needs_review";
  riskScore: number;
  riskyPhrases: string[];
  explanation: string;
  saferRewrite: string;
  sourceReferences: { title: string; url: string; organization: string; category: string }[];
  checklist: string[];
  disclaimer: string;
  rulesVersion: string;
};

export const CLAIM_DISCLAIMER = "ClaimGuard provides rules-engine risk flags and educational guidance only. It is not legal, regulatory, or medical advice, does not guarantee compliance, and is not a substitute for qualified professional review before you publish.";

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
  const matches = matchClaimRules(input.claimText, input.productCategory, input.market);
  const highMatches = matches.filter((rule) => rule.severity === "high");
  const mediumMatches = matches.filter((rule) => rule.severity === "medium");
  const contextModifier = /ad copy|social media|influencer script/i.test(input.contextType) ? 5 : 0;
  const regulatedCategoryModifier = /dietary supplement|drug|medical device|therapeutic|tobacco|alcohol|pesticide|children|financial|animal health/i.test(input.productCategory) ? 4 : 0;
  const ingredientModifier = input.ingredients.length === 0 ? 3 : 0;
  const marketModifier = /united states|fda|ftc|india|fssai/i.test(input.market) ? 0 : 4;
  const baseScore = highMatches.length ? 72 : mediumMatches.length ? 38 : 12;
  const riskScore = Math.min(99, baseScore + highMatches.length * 7 + mediumMatches.length * 4 + contextModifier + regulatedCategoryModifier + ingredientModifier + marketModifier);
  const riskLevel = highMatches.length || riskScore >= 75 ? "high" : mediumMatches.length || riskScore >= 40 ? "medium" : "low";
  const phrases = [...new Set(matches.map((rule) => rule.displayPhrase || rule.phrase))];
  const contextNote = `Reviewed as ${input.contextType.toLowerCase()} for ${input.productCategory} (${input.market}).`;

  let explanation: string;
  if (!matches.length) {
    explanation = `No high- or medium-risk phrase patterns matched this wording. ${contextNote} You may still want to verify substantiation, imagery, and full context before publishing.`;
  } else if (highMatches.length) {
    const phraseList = phrases.slice(0, 3).join(", ");
    explanation = `This claim may be high-risk because it includes language like "${phraseList}" that can imply disease treatment, prevention, or unsubstantiated outcomes. Consider using softer structure/function wording and linking evidence before you publish. ${contextNote}`;
  } else {
    const phraseList = phrases.slice(0, 3).join(", ");
    explanation = `This wording includes phrases such as "${phraseList}" that often need careful qualification and supporting evidence. A softer rewrite may reduce advertising and labeling risk. ${contextNote}`;
  }

  const checklist = [
    "Confirm every objective claim is supported by appropriate evidence.",
    `Review the complete ${input.contextType.toLowerCase()} context, including nearby visuals and qualifiers.`,
    input.ingredients.length ? "Confirm the wording accurately reflects the listed ingredients and product formulation." : "Add the ingredient list before final review.",
    riskLevel === "high"
      ? "Before publishing, ask a qualified compliance or regulatory professional to review this wording."
      : "Save the final approved wording and link it to your substantiation file.",
  ];

  return {
    riskLevel,
    riskScore,
    riskyPhrases: phrases,
    explanation,
    saferRewrite: saferRewrite(input.claimText),
    sourceReferences: getSourceReferences({ ...input, matchedSourceIds: [...new Set(matches.flatMap((rule) => rule.sourceIds || []))] }),
    checklist,
    disclaimer: CLAIM_DISCLAIMER,
    rulesVersion: CLAIM_RULES_VERSION,
  };
}
