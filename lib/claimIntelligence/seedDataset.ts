import { EXPANDED_REGRESSION_CASES } from "@/lib/expandedRegressionCases";
import { analyzeClaim } from "@/lib/analyzeClaim";
import type { ClaimExampleRecord, RiskCategory } from "@/lib/claimIntelligence/types";
import { detectRiskCategories } from "@/lib/claimIntelligence/riskCategories";

const SECTORS = [
  "Supplements", "Food", "Beverages", "Skincare", "Cosmetics", "Wellness", "Fitness",
  "Weight loss", "Baby products", "Pet products", "Hair care", "Dental care", "Sleep products",
  "Gut health", "Immune health", "Ayurvedic products", "Herbal products", "Medical-adjacent products",
  "DTC consumer goods", "Functional drinks", "Protein powders", "Beauty products", "Personal care products",
  "Household",
];

const CHANNELS = ["Website", "Amazon listing", "Ad copy", "Social media", "Influencer script", "Label"];
const REGIONS = ["United States FDA + FTC", "India FSSAI", "European Union", "United Kingdom", "Canada"];

const RISKY_TEMPLATES: { claim: string; risk: "high" | "medium"; category: RiskCategory }[] = [
  { claim: "Cures inflammation and boosts immunity naturally.", risk: "high", category: "cure_claim" },
  { claim: "Treats acne and reverses aging overnight.", risk: "high", category: "cosmetic_drug_boundary" },
  { claim: "Prevents diabetes and lowers blood sugar fast.", risk: "high", category: "disease_prevention" },
  { claim: "Guaranteed weight loss in 14 days.", risk: "medium", category: "weight_loss_claim" },
  { claim: "Clinically proven to eliminate joint pain.", risk: "high", category: "pain_relief_claim" },
  { claim: "Doctor recommended hormone balance formula.", risk: "medium", category: "misleading_scientific_proof" },
  { claim: "Burns fat and detoxes toxins from your body.", risk: "medium", category: "weight_loss_claim" },
  { claim: "Anti-anxiety relief without prescription.", risk: "high", category: "mental_health_claim" },
  { claim: "Repairs damaged skin and heals scars.", risk: "high", category: "cosmetic_drug_boundary" },
  { claim: "FDA approved wellness miracle.", risk: "high", category: "fda_labeling_risk" },
  { claim: "Eliminates bloating and gut inflammation.", risk: "medium", category: "disease_treatment" },
  { claim: "Medical-grade pain relief you can trust.", risk: "high", category: "pain_relief_claim" },
];

const SAFE_TEMPLATES: { claim: string; category: RiskCategory }[] = [
  { claim: "Supports digestive comfort and a balanced gut routine.", category: "structure_function_claim" },
  { claim: "Helps skin feel hydrated and smooth.", category: "general_wellness_claim" },
  { claim: "Part of a balanced diet and active lifestyle.", category: "general_wellness_claim" },
  { claim: "Supports immune system health as part of daily wellness.", category: "structure_function_claim" },
  { claim: "Formulated with collagen peptides for skin appearance support.", category: "ingredient_benefit_claim" },
  { claim: "Designed to support a restful nighttime routine.", category: "general_wellness_claim" },
];

const PREFIXES = ["Our", "This", "New", "Premium", "Daily", "Advanced", "Natural", "Organic", "Plant-based", "Clean"];
const SUFFIXES = ["for daily use.", "as part of your routine.", "with quality ingredients.", "for modern wellness.", "backed by our quality standards."];

let cachedSeed: ClaimExampleRecord[] | null = null;

function sectorToCategory(sector: string): string {
  const map: Record<string, string> = {
    Supplements: "Dietary Supplement", Food: "Food", Beverages: "Beverage", Skincare: "Cosmetic",
    Cosmetics: "Cosmetic", Wellness: "Dietary Supplement", Fitness: "Dietary Supplement",
    "Weight loss": "Dietary Supplement", "Baby products": "Children's Product", "Pet products": "Pet Food",
    "Hair care": "Cosmetic", "Dental care": "Personal Care", "Sleep products": "Dietary Supplement",
    "Gut health": "Dietary Supplement", "Immune health": "Dietary Supplement", "Ayurvedic products": "Dietary Supplement",
    "Herbal products": "Dietary Supplement", "Medical-adjacent products": "Medical Device",
    "DTC consumer goods": "Consumer Product", "Functional drinks": "Beverage", "Protein powders": "Dietary Supplement",
    "Beauty products": "Cosmetic", "Personal care products": "Personal Care", Household: "Household Cleaner",
  };
  return map[sector] || "Consumer Product";
}

function buildExample(
  claimText: string,
  sector: string,
  channel: string,
  region: string,
  riskLevel: "low" | "medium" | "high",
  riskCategory: RiskCategory,
  idx: number,
  trustScore: number,
  source: string,
): ClaimExampleRecord {
  const analysis = analyzeClaim({
    claimText,
    productCategory: sectorToCategory(sector),
    ingredients: [],
    market: region,
    contextType: channel,
  });
  const categories = detectRiskCategories(claimText, analysis.riskyPhrases);
  return {
    id: `seed-${idx}`,
    sector,
    productCategory: sectorToCategory(sector),
    productType: sector,
    region,
    channel,
    claimText,
    riskLevel: riskLevel || analysis.riskLevel,
    riskCategory: categories[0] || riskCategory,
    riskReason: analysis.explanation.split(".")[0] + ".",
    saferRewrite: analysis.saferRewrite,
    confidenceScore: trustScore >= 80 ? 88 + (idx % 10) : 72 + (idx % 15),
    source,
    sourceUrl: "",
    trustScore,
  };
}

export function getSeedDatasetSize(): number {
  return getSeedExamples().length;
}

export function getSeedExamples(): ClaimExampleRecord[] {
  if (cachedSeed) return cachedSeed;
  const examples: ClaimExampleRecord[] = [];
  let idx = 0;

  for (const base of EXPANDED_REGRESSION_CASES) {
    const sector = SECTORS[idx % SECTORS.length];
    examples.push(buildExample(
      base.claim,
      sector,
      base.context || "Website",
      base.market,
      base.expected,
      "general_wellness_claim",
      idx++,
      90,
      "regression_suite",
    ));
  }

  for (const template of RISKY_TEMPLATES) {
    for (const sector of SECTORS) {
      for (let v = 0; v < 150; v++) {
        const prefix = PREFIXES[v % PREFIXES.length];
        const suffix = SUFFIXES[v % SUFFIXES.length];
        const claim = `${prefix} ${template.claim.replace(/\.$/, "")} ${suffix}`;
        examples.push(buildExample(claim, sector, CHANNELS[v % CHANNELS.length], REGIONS[v % REGIONS.length], template.risk, template.category, idx++, 75, "pattern_library"));
      }
    }
  }

  for (const template of SAFE_TEMPLATES) {
    for (const sector of SECTORS) {
      for (let v = 0; v < 50; v++) {
        const claim = `${PREFIXES[v % PREFIXES.length]} ${template.claim}`;
        examples.push(buildExample(claim, sector, CHANNELS[v % CHANNELS.length], REGIONS[v % REGIONS.length], "low", template.category, idx++, 85, "pattern_library"));
      }
    }
  }

  cachedSeed = examples;
  return examples;
}

export function getSeedExamplesForQuery(sector: string | undefined, limit = 800): ClaimExampleRecord[] {
  const all = getSeedExamples();
  if (!sector) return all.slice(0, limit);
  const sectorLower = sector.toLowerCase();
  const filtered = all.filter((e) => e.sector.toLowerCase().includes(sectorLower) || e.productCategory.toLowerCase().includes(sectorLower));
  return (filtered.length ? filtered : all).slice(0, limit);
}