import type { RiskCategory } from "@/lib/claimIntelligence/types";

const CATEGORY_PATTERNS: { category: RiskCategory; patterns: RegExp[] }[] = [
  { category: "cure_claim", patterns: [/\bcure[sd]?\b/i, /\bheal(s|ing)?\b/i, /\beradicate/i] },
  { category: "disease_treatment", patterns: [/\btreat(s|ment)?\b/i, /\bpain relief\b/i, /\barthritis\b/i, /\bdepression\b/i, /\banxiety\b/i] },
  { category: "disease_prevention", patterns: [/\bprevent(s|ion)?\b/i, /\bprotects? against\b/i] },
  { category: "drug_like_claim", patterns: [/\breverse[sd]?\b/i, /\beliminate[sd]?\b/i, /\bmedical[- ]grade\b/i] },
  { category: "weight_loss_claim", patterns: [/\bweight loss\b/i, /\bburns? fat\b/i, /\bslim down\b/i, /\bloses? \d+ (lb|kg|pounds)/i] },
  { category: "absolute_guarantee", patterns: [/\bguaranteed\b/i, /\b100% (safe|effective)\b/i, /\bno side effects\b/i] },
  { category: "misleading_scientific_proof", patterns: [/\bclinically proven\b/i, /\bscientifically proven\b/i, /\bdoctor recommended\b/i, /\bfda approved\b/i] },
  { category: "unsupported_clinical_claim", patterns: [/\bclinically validated\b/i, /\bpeer[- ]reviewed\b/i] },
  { category: "mental_health_claim", patterns: [/\banti[- ]anxiety\b/i, /\bdepression relief\b/i, /\bstress cure\b/i] },
  { category: "pain_relief_claim", patterns: [/\bpain relief\b/i, /\beliminates? pain\b/i, /\bchronic pain\b/i] },
  { category: "cosmetic_drug_boundary", patterns: [/\brepairs? skin\b/i, /\bregenerates?\b/i, /\breverses? aging\b/i, /\bacne cure\b/i] },
  { category: "before_after_exaggeration", patterns: [/\bbefore and after\b/i, /\btransform(s|ation)?\b/i, /\bmiracle\b/i] },
  { category: "testimonial_risk", patterns: [/\bcustomers? (saw|experienced)\b/i, /\breal results\b/i] },
  { category: "structure_function_claim", patterns: [/\bsupports?\b/i, /\bmaintains?\b/i, /\bhelps?\b/i] },
  { category: "general_wellness_claim", patterns: [/\bwellness\b/i, /\bdaily routine\b/i, /\bgeneral health\b/i] },
  { category: "ingredient_benefit_claim", patterns: [/\bwith (vitamin|collagen|probiotic|turmeric|ashwagandha)\b/i] },
  { category: "ftc_advertising_risk", patterns: [/\bworld'?s best\b/i, /\b#1\b/i, /\bfastest\b/i] },
  { category: "fda_labeling_risk", patterns: [/\bfda\b/i, /\bregistered\b/i, /\bcleared\b/i] },
];

export function detectRiskCategories(claimText: string, riskyPhrases: string[]): RiskCategory[] {
  const found = new Set<RiskCategory>();
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((p) => p.test(claimText))) found.add(category);
  }
  const lower = claimText.toLowerCase();
  if (riskyPhrases.some((p) => /cure|treat|heal/.test(p))) found.add("disease_treatment");
  if (riskyPhrases.some((p) => /immunity|inflammation|detox/.test(p))) found.add("ingredient_benefit_claim");
  if (!found.size && /\bsupports?\b/i.test(lower)) found.add("structure_function_claim");
  if (!found.size) found.add("general_wellness_claim");
  return [...found];
}

export function riskCategoryLabel(category: RiskCategory): string {
  return category.replace(/_/g, " ");
}