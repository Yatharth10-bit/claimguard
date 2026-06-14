export type FnRegressionCase = {
  id: string;
  claim: string;
  productCategory: string;
  sector?: string;
  market?: string;
  context?: string;
  /** Minimum acceptable risk — high cases must be high; medium_high accepts medium or high */
  minRisk: "medium" | "high";
  family: string;
};

export type SaferRegressionCase = {
  id: string;
  claim: string;
  productCategory: string;
  sector?: string;
  maxRisk: "low" | "needs_review";
};

const DEFAULT_MARKET = "United States FDA + FTC";
const DEFAULT_CONTEXT = "Website";

export const FALSE_NEGATIVE_REGRESSION_CASES: FnRegressionCase[] = [
  // Skincare / Beauty
  { id: "fn-sk-01", claim: "Make you white", productCategory: "Facewash", sector: "Skincare", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sk-02", claim: "Makes your face white", productCategory: "Skincare", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sk-03", claim: "Whitens skin in 7 days", productCategory: "Cosmetic", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sk-04", claim: "Get fair skin naturally", productCategory: "Beauty", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sk-05", claim: "Removes blackness from face", productCategory: "Facewash", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sk-06", claim: "Reduces melanin", productCategory: "Skincare", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sk-07", claim: "Treats acne", productCategory: "Cosmetic", minRisk: "high", family: "cosmetic_treatment" },
  { id: "fn-sk-08", claim: "Cures eczema", productCategory: "Skincare", minRisk: "high", family: "cosmetic_treatment" },
  { id: "fn-sk-09", claim: "Heals psoriasis", productCategory: "Skincare", minRisk: "high", family: "cosmetic_treatment" },
  { id: "fn-sk-10", claim: "Removes scars permanently", productCategory: "Beauty", minRisk: "high", family: "cosmetic_treatment" },
  { id: "fn-sk-11", claim: "Reverses wrinkles", productCategory: "Cosmetic", minRisk: "high", family: "cosmetic_treatment" },
  { id: "fn-sk-12", claim: "Erases pigmentation completely", productCategory: "Skincare", minRisk: "high", family: "cosmetic_treatment" },

  // Supplements
  { id: "fn-sup-01", claim: "Cures inflammation", productCategory: "Dietary Supplement", sector: "Supplements", minRisk: "high", family: "disease_treatment" },
  { id: "fn-sup-02", claim: "Treats joint pain", productCategory: "Supplement", minRisk: "high", family: "disease_treatment" },
  { id: "fn-sup-03", claim: "Prevents diabetes", productCategory: "Dietary Supplement", minRisk: "high", family: "disease_prevention" },
  { id: "fn-sup-04", claim: "Boosts immunity to fight infections", productCategory: "Supplement", minRisk: "high", family: "disease_prevention" },
  { id: "fn-sup-05", claim: "Lowers blood pressure", productCategory: "Nutraceutical", minRisk: "high", family: "disease_prevention" },
  { id: "fn-sup-06", claim: "Controls cholesterol", productCategory: "Supplement", minRisk: "high", family: "disease_prevention" },
  { id: "fn-sup-07", claim: "Balances hormones", productCategory: "Wellness", minRisk: "medium", family: "hormone" },
  { id: "fn-sup-08", claim: "Treats anxiety", productCategory: "Supplement", minRisk: "high", family: "mental_health" },
  { id: "fn-sup-09", claim: "Cures IBS", productCategory: "Herbal Supplement", minRisk: "high", family: "disease_treatment" },
  { id: "fn-sup-10", claim: "Reverses fatty liver", productCategory: "Supplement", minRisk: "high", family: "disease_treatment" },
  { id: "fn-sup-11", claim: "Detoxes liver", productCategory: "Supplement", minRisk: "medium", family: "detox" },
  { id: "fn-sup-12", claim: "Cleanses kidneys", productCategory: "Wellness", minRisk: "medium", family: "detox" },

  // Food / Beverage
  { id: "fn-food-01", claim: "Prevents diabetes", productCategory: "Functional Food", sector: "Food", minRisk: "high", family: "disease_prevention" },
  { id: "fn-food-02", claim: "Burns fat", productCategory: "Beverage", minRisk: "high", family: "weight_loss" },
  { id: "fn-food-03", claim: "Detoxes your body", productCategory: "Juice", minRisk: "medium", family: "detox" },
  { id: "fn-food-04", claim: "Cures bloating", productCategory: "Functional Food", minRisk: "high", family: "disease_treatment" },
  { id: "fn-food-05", claim: "Boosts immunity", productCategory: "Beverage", minRisk: "medium", family: "immunity" },
  { id: "fn-food-06", claim: "Controls blood sugar", productCategory: "Food", minRisk: "high", family: "disease_prevention" },
  { id: "fn-food-07", claim: "Prevents heart disease", productCategory: "Functional Food", minRisk: "high", family: "disease_prevention" },
  { id: "fn-food-08", claim: "Melts belly fat", productCategory: "Beverage", sector: "Weight loss", minRisk: "high", family: "weight_loss" },
  { id: "fn-food-09", claim: "Reduces cholesterol", productCategory: "Food", minRisk: "high", family: "disease_prevention" },

  // Weight Loss
  { id: "fn-wl-01", claim: "Lose 10 kg in 10 days", productCategory: "Weight loss", minRisk: "high", family: "weight_loss" },
  { id: "fn-wl-02", claim: "Burns belly fat", productCategory: "Fitness", sector: "Weight loss", minRisk: "high", family: "weight_loss" },
  { id: "fn-wl-03", claim: "Melts fat overnight", productCategory: "Weight loss", minRisk: "high", family: "weight_loss" },
  { id: "fn-wl-04", claim: "No diet needed", productCategory: "Weight loss", minRisk: "high", family: "weight_loss" },
  { id: "fn-wl-05", claim: "Weight loss guaranteed", productCategory: "Fitness", minRisk: "high", family: "weight_loss" },
  { id: "fn-wl-06", claim: "Blocks fat absorption", productCategory: "Weight loss", minRisk: "high", family: "weight_loss" },
  { id: "fn-wl-07", claim: "Reverses obesity", productCategory: "Weight loss", minRisk: "high", family: "weight_loss" },
  { id: "fn-wl-08", claim: "Destroys fat cells", productCategory: "Fitness", minRisk: "high", family: "weight_loss" },

  // Mental Health
  { id: "fn-mh-01", claim: "Cures anxiety", productCategory: "Wellness", minRisk: "high", family: "mental_health" },
  { id: "fn-mh-02", claim: "Treats depression", productCategory: "Supplement", minRisk: "high", family: "mental_health" },
  { id: "fn-mh-03", claim: "Stops panic attacks", productCategory: "Wellness", minRisk: "high", family: "mental_health" },
  { id: "fn-mh-04", claim: "Fixes insomnia", productCategory: "Sleep aid", minRisk: "high", family: "mental_health" },
  { id: "fn-mh-05", claim: "Replaces therapy", productCategory: "Wellness", minRisk: "high", family: "mental_health" },
  { id: "fn-mh-06", claim: "Treats ADHD", productCategory: "Supplement", minRisk: "high", family: "mental_health" },
  { id: "fn-mh-07", claim: "Eliminates stress permanently", productCategory: "Wellness", minRisk: "high", family: "mental_health" },

  // Baby
  { id: "fn-baby-01", claim: "Boosts baby immunity", productCategory: "Baby products", minRisk: "high", family: "baby" },
  { id: "fn-baby-02", claim: "Cures colic", productCategory: "Baby products", minRisk: "high", family: "baby" },
  { id: "fn-baby-03", claim: "Treats rashes", productCategory: "Children's Product", minRisk: "high", family: "baby" },
  { id: "fn-baby-04", claim: "Prevents infection", productCategory: "Baby products", minRisk: "high", family: "baby" },
  { id: "fn-baby-05", claim: "Heals eczema", productCategory: "Baby products", minRisk: "high", family: "baby" },
  { id: "fn-baby-06", claim: "Makes baby sleep all night", productCategory: "Baby products", minRisk: "high", family: "baby" },

  // Pet
  { id: "fn-pet-01", claim: "Cures dog arthritis", productCategory: "Pet products", minRisk: "high", family: "pet" },
  { id: "fn-pet-02", claim: "Treats pet anxiety", productCategory: "Pet Food", minRisk: "high", family: "pet" },
  { id: "fn-pet-03", claim: "Heals joint pain", productCategory: "Animal Health", minRisk: "high", family: "pet" },
  { id: "fn-pet-04", claim: "Prevents disease", productCategory: "Pet products", minRisk: "high", family: "pet" },
  { id: "fn-pet-05", claim: "Cures itching", productCategory: "Pet care", minRisk: "high", family: "pet" },
  { id: "fn-pet-06", claim: "Fixes digestion", productCategory: "Pet Food", minRisk: "high", family: "pet" },

  // Testimonials
  { id: "fn-test-01", claim: "This cured my acne", productCategory: "Skincare", context: "Social media", minRisk: "high", family: "testimonial" },
  { id: "fn-test-02", claim: "I lost 15 kg in 2 weeks", productCategory: "Weight loss", context: "Influencer script", minRisk: "high", family: "testimonial" },
  { id: "fn-test-03", claim: "My diabetes improved", productCategory: "Supplement", context: "Social media", minRisk: "high", family: "testimonial" },
  { id: "fn-test-04", claim: "My pain disappeared", productCategory: "Wellness", minRisk: "high", family: "testimonial" },
  { id: "fn-test-05", claim: "This healed my eczema", productCategory: "Skincare", minRisk: "high", family: "testimonial" },
  { id: "fn-test-06", claim: "My anxiety is gone", productCategory: "Wellness", minRisk: "high", family: "testimonial" },
  { id: "fn-test-07", claim: "My inflammation vanished", productCategory: "Supplement", minRisk: "high", family: "testimonial" },

  // Semantic variants (whitening family)
  { id: "fn-sem-01", claim: "Turn your skin white", productCategory: "Facewash", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sem-02", claim: "White glow facewash", productCategory: "Facewash", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sem-03", claim: "Get fair fast", productCategory: "Beauty", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sem-04", claim: "Remove darkness", productCategory: "Skincare", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sem-05", claim: "Bright white skin", productCategory: "Cosmetic", minRisk: "high", family: "skin_whitening" },
  { id: "fn-sem-06", claim: "Milky white complexion", productCategory: "Skincare", minRisk: "high", family: "skin_whitening" },
];

export const SAFER_REGRESSION_CASES: SaferRegressionCase[] = [
  { id: "safe-01", claim: "Helps brighten the appearance of dull skin", productCategory: "Skincare", maxRisk: "low" },
  { id: "safe-02", claim: "Leaves skin looking fresh and radiant", productCategory: "Cosmetic", maxRisk: "low" },
  { id: "safe-03", claim: "Supports digestive wellness", productCategory: "Supplement", maxRisk: "low" },
  { id: "safe-04", claim: "Supports immune system health", productCategory: "Dietary Supplement", maxRisk: "low" },
  { id: "safe-05", claim: "Supports a healthy inflammatory response", productCategory: "Supplement", maxRisk: "low" },
  { id: "safe-06", claim: "Helps maintain normal energy levels", productCategory: "Functional Food", maxRisk: "low" },
  { id: "safe-07", claim: "Supports joint comfort", productCategory: "Supplement", maxRisk: "low" },
  { id: "safe-08", claim: "Helps you unwind", productCategory: "Wellness", maxRisk: "low" },
  { id: "safe-09", claim: "Supports restful sleep", productCategory: "Sleep aid", maxRisk: "needs_review" },
  { id: "safe-10", claim: "Helps maintain healthy skin and coat", productCategory: "Pet products", maxRisk: "low" },
  { id: "safe-11", claim: "Designed for everyday wellness", productCategory: "Wellness", maxRisk: "low" },
  { id: "safe-12", claim: "Part of a balanced lifestyle", productCategory: "Food", maxRisk: "low" },
];

const RISK_RANK: Record<string, number> = {
  low: 0,
  needs_review: 1,
  medium: 2,
  high: 3,
};

export function meetsMinRisk(actual: string, minRisk: "medium" | "high"): boolean {
  return (RISK_RANK[actual] ?? 0) >= RISK_RANK[minRisk];
}

export function meetsMaxRisk(actual: string, maxRisk: "low" | "needs_review"): boolean {
  return (RISK_RANK[actual] ?? 99) <= RISK_RANK[maxRisk];
}

export function fnCaseInput(c: FnRegressionCase) {
  return {
    claimText: c.claim,
    productCategory: c.productCategory,
    sector: c.sector,
    market: c.market || DEFAULT_MARKET,
    contextType: c.context || DEFAULT_CONTEXT,
    ingredients: [] as string[],
  };
}

export function saferCaseInput(c: SaferRegressionCase) {
  return {
    claimText: c.claim,
    productCategory: c.productCategory,
    sector: c.sector,
    market: DEFAULT_MARKET,
    contextType: DEFAULT_CONTEXT,
    ingredients: [] as string[],
  };
}