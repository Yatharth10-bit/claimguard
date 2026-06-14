import { REGULATORY_SOURCES } from "@/lib/regulatorySources";
import { analyzeClaim } from "@/lib/analyzeClaim";
import { syncRegulations } from "@/lib/syncRegulations";
import type { RiskCategory } from "@/lib/claimIntelligence/types";
import { detectRiskCategories } from "@/lib/claimIntelligence/riskCategories";

export type LearningSourceConfig = {
  sourceUrl: string;
  sourceType: "regulatory" | "compliance_blog" | "brand_website" | "social_public";
  trustLevel: "high" | "medium" | "low";
  sector: string;
  fetchFrequency: "daily" | "weekly" | "few_days";
};

export const DEFAULT_LEARNING_SOURCES: LearningSourceConfig[] = REGULATORY_SOURCES.slice(0, 12).map((s) => ({
  sourceUrl: s.url,
  sourceType: "regulatory" as const,
  trustLevel: "high" as const,
  sector: s.category,
  fetchFrequency: "daily" as const,
}));

const SAMPLE_CLAIM_PHRASES = [
  "Supports immune system health and a healthy inflammatory response.",
  "Cures inflammation and boosts immunity.",
  "Clinically proven weight loss in 7 days.",
  "Helps skin feel hydrated and smooth.",
  "Treats acne and reverses aging.",
  "Guaranteed results or your money back.",
  "Doctor recommended daily wellness formula.",
  "Detox cleanse for total body reset.",
];

export type ExtractedClaim = {
  claimText: string;
  sector: string;
  riskLevel: "low" | "medium" | "high";
  riskCategory: RiskCategory;
  riskReason: string;
  saferRewrite: string;
  confidenceScore: number;
  trustScore: number;
  source: string;
  sourceUrl: string;
  approvedForProduction: boolean;
};

export async function runDailyRegulatorySync() {
  const result = await syncRegulations();
  const count = Array.isArray(result) ? result.length : result.updates?.length ?? 0;
  return { sourcesSynced: count, status: "completed" as const, persisted: !Array.isArray(result) && result.persisted };
}

export function extractClaimsFromText(text: string, source: LearningSourceConfig): ExtractedClaim[] {
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 12 && s.length < 400);
  const claims: ExtractedClaim[] = [];

  for (const sentence of sentences.slice(0, 20)) {
    const lower = sentence.toLowerCase();
    const hasClaimSignal = /support|boost|cure|treat|prevent|clinically|guarantee|doctor|detox|immunity|inflammation|wrinkle|acne|weight|pain|heal/i.test(lower);
    if (!hasClaimSignal) continue;

    const analysis = analyzeClaim({
      claimText: sentence,
      productCategory: source.sector,
      ingredients: [],
      market: "United States FDA + FTC",
      contextType: "Website",
    });

    const trustScore = source.trustLevel === "high" ? 92 : source.trustLevel === "medium" ? 70 : 45;
    const approved = source.trustLevel === "high" && analysis.riskLevel !== "low";

    claims.push({
      claimText: sentence,
      sector: source.sector,
      riskLevel: analysis.riskLevel,
      riskCategory: detectRiskCategories(sentence, analysis.riskyPhrases)[0] || "general_wellness_claim",
      riskReason: analysis.explanation.split(".")[0] + ".",
      saferRewrite: analysis.saferRewrite,
      confidenceScore: approved ? 85 : 60,
      trustScore,
      source: source.sourceType,
      sourceUrl: source.sourceUrl,
      approvedForProduction: approved,
    });
  }

  return claims;
}

export function generateSyntheticLearningBatch(): ExtractedClaim[] {
  return SAMPLE_CLAIM_PHRASES.map((claimText, i) => {
    const analysis = analyzeClaim({
      claimText,
      productCategory: "Dietary Supplement",
      ingredients: [],
      market: "United States FDA + FTC",
      contextType: "Website",
    });
    return {
      claimText,
      sector: "Supplements",
      riskLevel: analysis.riskLevel,
      riskCategory: detectRiskCategories(claimText, analysis.riskyPhrases)[0] || "general_wellness_claim",
      riskReason: analysis.explanation.split(".")[0] + ".",
      saferRewrite: analysis.saferRewrite,
      confidenceScore: 80,
      trustScore: 75,
      source: "synthetic_seed",
      sourceUrl: "",
      approvedForProduction: false,
    };
  });
}