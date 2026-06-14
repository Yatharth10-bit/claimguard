import { analyzeClaim } from "@/lib/analyzeClaim";
import { matchClaimRules } from "@/lib/claimRules";
import { buildRegulatoryContext } from "@/lib/claimIntelligence/regulatoryLayer";
import { matchInternetPatterns } from "@/lib/claimIntelligence/patternLayer";
import { retrieveSimilarExamples, type DbExampleRow } from "@/lib/claimIntelligence/retrievalLayer";
import { detectRiskCategories, riskCategoryLabel } from "@/lib/claimIntelligence/riskCategories";
import { getSeedDatasetSize } from "@/lib/claimIntelligence/seedDataset";
import type { ClaimIntelligenceInput, ClaimIntelligenceResult } from "@/lib/claimIntelligence/types";
import {
  CLAIM_DATASET_VERSION,
  CLAIM_MODEL_VERSION,
  CLAIM_PROMPT_VERSION,
  CLAIM_RULES_VERSION,
} from "@/lib/claimIntelligence/versions";

function buildMainIssue(riskCategories: string[], riskyPhrases: string[]): string {
  if (!riskyPhrases.length) return "No high-risk phrase patterns detected in this wording.";
  const primary = riskCategories[0] ? riskCategoryLabel(riskCategories[0] as never) : "compliance-sensitive language";
  const phrase = riskyPhrases[0];
  return `${primary} — language like "${phrase}" may need softer structure/function wording or stronger substantiation.`;
}

function buildWhyItMatters(riskLevel: string, categories: string[]): string {
  if (riskLevel === "high") {
    return "This wording could be interpreted as disease treatment, prevention, or an unsupported outcome claim. That can increase FDA/FTC labeling and advertising risk.";
  }
  if (riskLevel === "medium") {
    return "This wording may need careful qualification, typicality support, and evidence before use in ads, labels, or social captions.";
  }
  return "No major phrase-level risk was detected, but context, imagery, and substantiation still matter before publishing.";
}

function buildNextAction(riskLevel: string, contextType: string): string {
  const channel = contextType.toLowerCase();
  if (riskLevel === "high") {
    return `Use the safer rewrite on ${channel}, product pages, and ads. Ask a qualified compliance reviewer before publishing.`;
  }
  if (riskLevel === "medium") {
    return `Consider the safer rewrite for ${channel}. Link the final wording to your substantiation file before approval.`;
  }
  return `Save this approved wording and confirm substantiation for ${channel} before publishing.`;
}

function calibrateConfidence(
  riskLevel: string,
  ruleMatches: number,
  retrieved: { similarity: number }[],
  patternCount: number,
): number {
  let base = riskLevel === "high" ? 86 : riskLevel === "medium" ? 78 : 72;
  if (ruleMatches) base += 4;
  if (retrieved[0]?.similarity > 0.35) base += 5;
  if (patternCount) base += 3;
  return Math.min(97, base);
}

export function runClaimIntelligenceQuick(input: ClaimIntelligenceInput): Pick<ClaimIntelligenceResult, "riskLevel" | "riskScore" | "riskyPhrases" | "rulesVersion"> {
  const base = analyzeClaim(input);
  return {
    riskLevel: base.riskLevel,
    riskScore: base.riskScore,
    riskyPhrases: base.riskyPhrases,
    rulesVersion: CLAIM_RULES_VERSION,
  };
}

export function runClaimIntelligence(
  input: ClaimIntelligenceInput,
  dbExamples: DbExampleRow[] = [],
): ClaimIntelligenceResult {
  const base = analyzeClaim(input);
  const ruleMatches = matchClaimRules(input.claimText, input.productCategory, input.market);
  const riskCategories = detectRiskCategories(input.claimText, base.riskyPhrases);
  const retrievedExamples = retrieveSimilarExamples(input, dbExamples.filter((e) => e), 5);
  const similarPatterns = matchInternetPatterns(input);
  const regulatory = buildRegulatoryContext(input, ruleMatches);

  const confidenceScore = calibrateConfidence(base.riskLevel, ruleMatches.length, retrievedExamples, similarPatterns.length);
  const mainIssue = buildMainIssue(riskCategories, base.riskyPhrases);
  const whyItMatters = buildWhyItMatters(base.riskLevel, riskCategories);
  const suggestedNextAction = buildNextAction(base.riskLevel, input.contextType);

  let explanation = base.explanation;
  if (retrievedExamples.length) {
    explanation += ` Similar approved examples in our dataset (${getSeedDatasetSize().toLocaleString()} public/regression patterns) support this assessment.`;
  }
  if (similarPatterns.length) {
    explanation += ` Pattern note: "${similarPatterns[0].pattern}" is ${similarPatterns[0].frequency.toLowerCase()} in ${input.sector || input.productCategory} marketing.`;
  }

  const layersUsed = ["rule", "retrieval", "internet_patterns", "regulatory", "reasoning"];

  return {
    ...base,
    rulesVersion: CLAIM_RULES_VERSION,
    explanation,
    sourceReferences: regulatory.sourceReferences,
    confidenceScore,
    mainIssue,
    whyItMatters,
    suggestedNextAction,
    riskCategories,
    similarPatterns,
    retrievedExamples,
    modelVersion: CLAIM_MODEL_VERSION,
    promptVersion: CLAIM_PROMPT_VERSION,
    datasetVersion: CLAIM_DATASET_VERSION,
    layersUsed,
  };
}