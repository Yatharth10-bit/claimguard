import type { RiskCategory } from "@/lib/claimIntelligence/types";

export type ClaimTemplate = {
  template: string;
  risk: "low" | "medium" | "high";
  category: RiskCategory;
};

/** 500 claim variant templates — safe, medium, high across all product types. */
export function buildClaimTemplates(): ClaimTemplate[] {
  const templates: ClaimTemplate[] = [];

  const safe = [
    { t: "{product} supports {benefit} as part of a balanced daily routine.", r: "low" as const, c: "structure_function_claim" as RiskCategory },
    { t: "{product} helps you feel {benefit} when used as directed.", r: "low" as const, c: "general_wellness_claim" as RiskCategory },
    { t: "Formulated with {ingredient} to support {benefit}.", r: "low" as const, c: "ingredient_benefit_claim" as RiskCategory },
    { t: "{product} is designed to support {benefit} for everyday wellness.", r: "low" as const, c: "structure_function_claim" as RiskCategory },
    { t: "Made with quality {ingredient} for {benefit} support.", r: "low" as const, c: "ingredient_benefit_claim" as RiskCategory },
    { t: "{product} complements a healthy lifestyle and {benefit} goals.", r: "low" as const, c: "general_wellness_claim" as RiskCategory },
    { t: "Supports {benefit} as part of your self-care routine.", r: "low" as const, c: "structure_function_claim" as RiskCategory },
    { t: "{product} helps maintain {benefit} with consistent use.", r: "low" as const, c: "structure_function_claim" as RiskCategory },
    { t: "A thoughtful formula with {ingredient} for {benefit}.", r: "low" as const, c: "ingredient_benefit_claim" as RiskCategory },
    { t: "{product} for consumers seeking {benefit} support.", r: "low" as const, c: "general_wellness_claim" as RiskCategory },
  ];

  const medium = [
    { t: "{product} with {ingredient} may help support {benefit}.", r: "medium" as const, c: "structure_function_claim" as RiskCategory },
    { t: "Clinically studied {ingredient} for {benefit} support.", r: "medium" as const, c: "unsupported_clinical_claim" as RiskCategory },
    { t: "Doctor recommended {product} for {benefit}.", r: "medium" as const, c: "misleading_scientific_proof" as RiskCategory },
    { t: "Boosts {benefit} naturally with {ingredient}.", r: "medium" as const, c: "ingredient_benefit_claim" as RiskCategory },
    { t: "{product} — advanced {benefit} formula.", r: "medium" as const, c: "performance_exaggeration" as RiskCategory },
    { t: "Detox and cleanse for better {benefit}.", r: "medium" as const, c: "general_wellness_claim" as RiskCategory },
    { t: "Guaranteed {benefit} results with {product}.", r: "medium" as const, c: "absolute_guarantee" as RiskCategory },
    { t: "Scientifically formulated {product} for {benefit}.", r: "medium" as const, c: "misleading_scientific_proof" as RiskCategory },
    { t: "Anti-aging {benefit} support with {ingredient}.", r: "medium" as const, c: "cosmetic_drug_boundary" as RiskCategory },
    { t: "Rapid {benefit} support you can feel.", r: "medium" as const, c: "performance_exaggeration" as RiskCategory },
    { t: "World's best {product} for {benefit}.", r: "medium" as const, c: "ftc_advertising_risk" as RiskCategory },
    { t: "100% safe {product} for {benefit}.", r: "medium" as const, c: "absolute_guarantee" as RiskCategory },
    { t: "Burns fat and supports {benefit}.", r: "medium" as const, c: "weight_loss_claim" as RiskCategory },
    { t: "Hormone balance and {benefit} in one formula.", r: "medium" as const, c: "ingredient_benefit_claim" as RiskCategory },
    { t: "Before and after {benefit} transformation.", r: "medium" as const, c: "before_after_exaggeration" as RiskCategory },
  ];

  const high = [
    { t: "{product} cures {condition} and boosts {benefit}.", r: "high" as const, c: "cure_claim" as RiskCategory },
    { t: "Treats {condition} with {ingredient} — fast relief.", r: "high" as const, c: "disease_treatment" as RiskCategory },
    { t: "Prevents {condition} and supports {benefit}.", r: "high" as const, c: "disease_prevention" as RiskCategory },
    { t: "Reverses {condition} and restores {benefit}.", r: "high" as const, c: "drug_like_claim" as RiskCategory },
    { t: "Heals {condition} naturally with {product}.", r: "high" as const, c: "cure_claim" as RiskCategory },
    { t: "FDA approved {product} for {condition}.", r: "high" as const, c: "fda_labeling_risk" as RiskCategory },
    { t: "Eliminates {condition} and guarantees {benefit}.", r: "high" as const, c: "absolute_guarantee" as RiskCategory },
    { t: "Medical-grade {product} for {condition} relief.", r: "high" as const, c: "medical_claim" as RiskCategory },
    { t: "Clinically proven to cure {condition}.", r: "high" as const, c: "unsupported_clinical_claim" as RiskCategory },
    { t: "Pain relief from {condition} — no prescription needed.", r: "high" as const, c: "pain_relief_claim" as RiskCategory },
    { t: "Anti-anxiety and depression relief with {product}.", r: "high" as const, c: "mental_health_claim" as RiskCategory },
    { t: "Repairs skin and heals {condition} overnight.", r: "high" as const, c: "cosmetic_drug_boundary" as RiskCategory },
    { t: "Eradicates {condition} permanently.", r: "high" as const, c: "cure_claim" as RiskCategory },
    { t: "Kills {condition} causing bacteria and viruses.", r: "high" as const, c: "disease_treatment" as RiskCategory },
    { t: "Replaces medication for {condition}.", r: "high" as const, c: "drug_like_claim" as RiskCategory },
  ];

  const benefits = [
    "immune health", "digestive comfort", "joint comfort", "restful sleep", "skin hydration",
    "energy", "focus", "calm", "heart health", "gut balance", "hair appearance", "nail strength",
    "healthy weight management", "muscle recovery", "mobility", "glow", "clarity", "balance",
    "vitality", "wellness", "comfort", "metabolism", "hydration", "endurance", "flexibility",
  ];

  const conditions = [
    "inflammation", "bloating", "acne", "wrinkles", "joint pain", "anxiety", "insomnia",
    "diabetes", "high cholesterol", "arthritis", "eczema", "hair loss", "chronic pain",
    "depression", "gut issues", "hormone imbalance", "fatigue", "infection", "allergies",
    "psoriasis", "rosacea", "migraines", "IBS", "UTI", "colds", "flu", "stress",
  ];

  let idx = 0;
  for (const group of [safe, safe, safe, medium, medium, high]) {
    for (const item of group) {
      for (let v = 0; v < 3 && templates.length < 500; v++) {
        const benefit = benefits[(idx + v) % benefits.length];
        const condition = conditions[(idx + v * 2) % conditions.length];
        templates.push({
          template: item.t
            .replace("{product}", "{name}")
            .replace("{benefit}", benefit)
            .replace("{condition}", condition),
          risk: item.r,
          category: item.c,
        });
        idx++;
      }
    }
  }

  while (templates.length < 500) {
    const benefit = benefits[templates.length % benefits.length];
    templates.push({
      template: `Supports ${benefit} as part of daily wellness.`,
      risk: "low",
      category: "structure_function_claim",
    });
  }

  return templates.slice(0, 500);
}

let cachedTemplates: ClaimTemplate[] | null = null;

export function getClaimTemplates(): ClaimTemplate[] {
  if (!cachedTemplates) cachedTemplates = buildClaimTemplates();
  return cachedTemplates;
}