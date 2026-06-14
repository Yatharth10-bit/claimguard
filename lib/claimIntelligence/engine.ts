import { analyzeClaim } from "@/lib/analyzeClaim";
import { matchClaimRules } from "@/lib/claimRules";
import { buildRegulatoryContext } from "@/lib/claimIntelligence/regulatoryLayer";
import { matchInternetPatterns } from "@/lib/claimIntelligence/patternLayer";
import { retrieveSimilarExamples, type DbExampleRow } from "@/lib/claimIntelligence/retrievalLayer";
import { matchDbClaimRules, type DbClaimRuleRow } from "@/lib/claimIntelligence/dbRulesLayer";
import { detectRiskCategories, riskCategoryLabel } from "@/lib/claimIntelligence/riskCategories";
import { getSeedDatasetSize } from "@/lib/claimIntelligence/seedDataset";
import {
  blendSaferRewrite,
  buildSectorInsight,
  refineRiskLevel,
  refineRiskScore,
} from "@/lib/claimIntelligence/reasoningLayer";
import { getCachedIntelligence, setCachedIntelligence } from "@/lib/claimIntelligence/cache";
import type { ClaimIntelligenceInput, ClaimIntelligenceResult } from "@/lib/claimIntelligence/types";
import {
  CLAIM_DATASET_VERSION,
  CLAIM_MODEL_VERSION,
  CLAIM_PROMPT_VERSION,
  CLAIM_RULES_VERSION,
} from "@/lib/claimIntelligence/versions";

export type IntelligenceContext = {
  dbExamples?: DbExampleRow[];
  dbRules?: DbClaimRuleRow[];
  skipCache?: boolean;
};

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
  hasDbRules: boolean,
): number {
  let base = riskLevel === "high" ? 86 : riskLevel === "medium" ? 78 : 72;
  if (ruleMatches) base += 4;
  if (retrieved[0]?.similarity > 0.35) base += 5;
  if (retrieved[0]?.similarity > 0.5) base += 3;
  if (patternCount) base += 3;
  if (hasDbRules) base += 2;
  return Math.min(97, base);
}

export function runClaimIntelligenceQuick(input: ClaimIntelligenceInput): Pick<ClaimIntelligenceResult, "riskLevel" | "riskScore" | "riskyPhrases" | "rulesVersion"> {
  const base = analyzeClaim(input);
  const dbRules = matchDbClaimRules(input.claimText, [], input.productCategory, input.market);
  const score = refineRiskScore(base, input, dbRules.length);
  const level = refineRiskLevel(base.riskLevel, score, dbRules.filter((r) => r.severity === "high").length);
  const staticPhrases = matchClaimRules(input.claimText, input.productCategory, input.market).map((r) => r.displayPhrase || r.phrase);
  const dbPhrases = dbRules.map((r) => r.displayPhrase || r.phrase);
  return {
    riskLevel: level,
    riskScore: score,
    riskyPhrases: [...new Set([...staticPhrases, ...dbPhrases])],
    rulesVersion: CLAIM_RULES_VERSION,
  };
}

export function runClaimIntelligence(
  input: ClaimIntelligenceInput,
  context: IntelligenceContext = {},
): ClaimIntelligenceResult {
  if (!context.skipCache) {
    const cached = getCachedIntelligence(input);
    if (cached) return { ...cached, layersUsed: [...cached.layersUsed, "cache"] };
  }

  const dbExamples = context.dbExamples || [];
  const dbRules = context.dbRules || [];

  const base = analyzeClaim(input);
  const staticRules = matchClaimRules(input.claimText, input.productCategory, input.market);
  const learnedRules = matchDbClaimRules(input.claimText, dbRules, input.productCategory, input.market);
  const allRules = [...staticRules, ...learnedRules];
  const highRules = allRules.filter((r) => r.severity === "high");

  const riskCategories = detectRiskCategories(input.claimText, base.riskyPhrases);
  const retrievedExamples = retrieveSimilarExamples(input, dbExamples, 5);
  const similarPatterns = matchInternetPatterns(input);
  const regulatory = buildRegulatoryContext(input, allRules);

  const refinedScore = refineRiskScore(base, input, learnedRules.length);
  const riskLevel = refineRiskLevel(base.riskLevel, refinedScore, highRules.length - staticRules.filter((r) => r.severity === "high").length);
  const phrases = [...new Set(allRules.map((r) => r.displayPhrase || r.phrase))];

  const confidenceScore = calibrateConfidence(riskLevel, allRules.length, retrievedExamples, similarPatterns.length, learnedRules.length > 0);
  const mainIssue = buildMainIssue(riskCategories, phrases.length ? phrases : base.riskyPhrases);
  const whyItMatters = buildWhyItMatters(riskLevel, riskCategories);
  const suggestedNextAction = buildNextAction(riskLevel, input.contextType);
  const saferRewrite = blendSaferRewrite(base.saferRewrite, input.claimText, retrievedExamples, riskLevel);

  let explanation = base.explanation;
  if (phrases.length) {
    const phraseList = phrases.slice(0, 3).join(", ");
    if (riskLevel === "high") {
      explanation = `This claim may be high-risk because it includes language like "${phraseList}" that can imply disease treatment, prevention, or unsubstantiated outcomes. Consider using softer structure/function wording and linking evidence before you publish.`;
    } else if (riskLevel === "medium") {
      explanation = `This wording includes phrases such as "${phraseList}" that often need careful qualification and supporting evidence. A softer rewrite may reduce advertising and labeling risk.`;
    }
  }

  const sectorInsight = buildSectorInsight(input);
  if (sectorInsight) explanation += ` ${sectorInsight}`;

  if (retrievedExamples.length) {
    explanation += ` Similar examples in our dataset (${getSeedDatasetSize().toLocaleString()}+ patterns) support this assessment.`;
  }
  if (similarPatterns.length) {
    explanation += ` Pattern note: "${similarPatterns[0].pattern}" is ${similarPatterns[0].frequency.toLowerCase()} in ${input.sector || input.productCategory} marketing.`;
  }

  const layersUsed = ["rule", "retrieval", "internet_patterns", "regulatory", "reasoning"];
  if (learnedRules.length) layersUsed.push("db_rules");
  if (input.sector) layersUsed.push("sector_profile");

  const result: ClaimIntelligenceResult = {
    ...base,
    riskLevel,
    riskScore: refinedScore,
    riskyPhrases: phrases.length ? phrases : base.riskyPhrases,
    rulesVersion: CLAIM_RULES_VERSION,
    explanation,
    saferRewrite,
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

  setCachedIntelligence(input, result);
  return result;
}