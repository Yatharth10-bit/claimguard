import type { AnalyzeClaimInput, ClaimAnalysisResult } from "@/lib/analyzeClaim";

export type RiskCategory =
  | "disease_treatment"
  | "disease_prevention"
  | "cure_claim"
  | "drug_like_claim"
  | "medical_claim"
  | "weight_loss_claim"
  | "performance_exaggeration"
  | "absolute_guarantee"
  | "misleading_scientific_proof"
  | "before_after_exaggeration"
  | "testimonial_risk"
  | "ftc_advertising_risk"
  | "fda_labeling_risk"
  | "cosmetic_drug_boundary"
  | "structure_function_claim"
  | "general_wellness_claim"
  | "unsupported_clinical_claim"
  | "ingredient_benefit_claim"
  | "mental_health_claim"
  | "pain_relief_claim";

export type ClaimExampleRecord = {
  id: string;
  sector: string;
  productCategory: string;
  productType: string;
  region: string;
  channel: string;
  claimText: string;
  riskLevel: "low" | "medium" | "high";
  riskCategory: RiskCategory;
  riskReason: string;
  saferRewrite: string;
  confidenceScore: number;
  source: string;
  sourceUrl: string;
  trustScore: number;
};

export type RetrievedExample = Pick<
  ClaimExampleRecord,
  "claimText" | "sector" | "riskLevel" | "riskReason" | "saferRewrite" | "confidenceScore" | "source"
> & { similarity: number };

export type ClaimIntelligenceResult = ClaimAnalysisResult & {
  confidenceScore: number;
  mainIssue: string;
  whyItMatters: string;
  suggestedNextAction: string;
  riskCategories: RiskCategory[];
  similarPatterns: { pattern: string; frequency: string; note: string }[];
  retrievedExamples: RetrievedExample[];
  modelVersion: string;
  promptVersion: string;
  datasetVersion: string;
  layersUsed: string[];
};

export type ClaimIntelligenceInput = AnalyzeClaimInput & {
  sector?: string;
};

export type FeedbackType =
  | "accurate"
  | "too_strict"
  | "too_weak"
  | "rewrite_bad"
  | "missed_risk"
  | "wrong_category";