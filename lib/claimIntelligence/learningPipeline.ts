import { REGULATORY_SOURCES } from "@/lib/regulatorySources";
import { analyzeClaim } from "@/lib/analyzeClaim";
import { syncRegulations } from "@/lib/syncRegulations";
import { getSeedExamples } from "@/lib/claimIntelligence/seedDataset";
import type { RiskCategory } from "@/lib/claimIntelligence/types";
import { detectRiskCategories } from "@/lib/claimIntelligence/riskCategories";

export type LearningSourceConfig = {
  sourceUrl: string;
  sourceType: "regulatory" | "compliance_blog" | "brand_website" | "social_public";
  trustLevel: "high" | "medium" | "low";
  sector: string;
  fetchFrequency: "daily" | "weekly" | "few_days";
};

export const DEFAULT_LEARNING_SOURCES: LearningSourceConfig[] = REGULATORY_SOURCES.slice(0, 16).map((s) => ({
  sourceUrl: s.url,
  sourceType: "regulatory" as const,
  trustLevel: "high" as const,
  sector: s.category,
  fetchFrequency: "daily" as const,
}));

const ALLOWED_HOSTS = new Set(
  REGULATORY_SOURCES.map((s) => {
    try { return new URL(s.url).hostname; } catch { return ""; }
  }).filter(Boolean),
);

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

export async function fetchRegulatoryPageText(url: string): Promise<string> {
  const hostname = new URL(url).hostname;
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new Error(`Host not allowlisted: ${hostname}`);
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "ClaimGuard-Learning/1.0" },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

export function extractClaimsFromText(text: string, source: LearningSourceConfig): ExtractedClaim[] {
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 12 && s.length < 400);
  const claims: ExtractedClaim[] = [];

  for (const sentence of sentences.slice(0, 25)) {
    const lower = sentence.toLowerCase();
    const hasClaimSignal = /support|boost|cure|treat|prevent|clinically|guarantee|doctor|detox|immunity|inflammation|wrinkle|acne|weight|pain|heal|claim|advertis|label|substantiat/i.test(lower);
    if (!hasClaimSignal) continue;

    const analysis = analyzeClaim({
      claimText: sentence,
      productCategory: source.sector,
      ingredients: [],
      market: "United States FDA + FTC",
      contextType: "Website",
    });

    const trustScore = source.trustLevel === "high" ? 92 : source.trustLevel === "medium" ? 70 : 45;
    const approved = false;

    claims.push({
      claimText: sentence.slice(0, 500),
      sector: source.sector,
      riskLevel: analysis.riskLevel,
      riskCategory: detectRiskCategories(sentence, analysis.riskyPhrases)[0] || "general_wellness_claim",
      riskReason: analysis.explanation.split(".")[0] + ".",
      saferRewrite: analysis.saferRewrite,
      confidenceScore: approved ? 85 : 55,
      trustScore,
      source: source.sourceType,
      sourceUrl: source.sourceUrl,
      approvedForProduction: approved,
    });
  }

  return claims;
}

export async function runRegulatoryLearningFetch(limit = 4): Promise<ExtractedClaim[]> {
  const all: ExtractedClaim[] = [];
  for (const source of DEFAULT_LEARNING_SOURCES.slice(0, limit)) {
    try {
      const text = await fetchRegulatoryPageText(source.sourceUrl);
      all.push(...extractClaimsFromText(text, source));
    } catch {
      continue;
    }
  }
  return all;
}

export function generateSyntheticLearningBatch(): ExtractedClaim[] {
  const fromSeed = getSeedExamples()
    .filter((e) => e.trustScore >= 85)
    .slice(0, 20)
    .map((e) => ({
      claimText: e.claimText,
      sector: e.sector,
      riskLevel: e.riskLevel,
      riskCategory: e.riskCategory,
      riskReason: e.riskReason,
      saferRewrite: e.saferRewrite,
      confidenceScore: e.confidenceScore,
      trustScore: e.trustScore,
      source: "seed_promotion_candidate",
      sourceUrl: "",
      approvedForProduction: false,
    }));

  const synthetic = SAMPLE_CLAIM_PHRASES.map((claimText) => {
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

  return [...fromSeed, ...synthetic];
}