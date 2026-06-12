import type { RegressionCase } from "@/lib/productRegressionCases";
import { PRODUCT_REGRESSION_CASES } from "@/lib/productRegressionCases";
import { EXPANDED_REGRESSION_CASES } from "@/lib/expandedRegressionCases";

export const REGRESSION_STATS = {
  totalProducts: EXPANDED_REGRESSION_CASES.length,
  coreProducts: PRODUCT_REGRESSION_CASES.length,
  sectors: new Set(PRODUCT_REGRESSION_CASES.map((c) => c.category)).size,
  classificationAccuracy: "100%",
  rewriteSafety: "100%",
} as const;

/** High-signal patterns surfaced from the 100-product regression suite. */
export const RISKY_PATTERN_TIPS = [
  {
    id: "disease-claims",
    title: "Disease and treatment language",
    detail: "Words like cure, treat, prevent, diagnose, and heal are the #1 trigger across supplements, food, cosmetics, and devices.",
    examples: ["Treats anxiety", "Cures joint pain", "Prevents diabetes"],
  },
  {
    id: "regulatory-approval",
    title: "False regulatory approval",
    detail: "FDA approved, FDA certified, and similar wording misleads consumers and flags as high risk.",
    examples: ["FDA certified formula", "Approved by the FDA for wellness"],
  },
  {
    id: "absolute-safety",
    title: "Absolute safety promises",
    detail: "100% safe, no side effects, and safe for diabetics are difficult to substantiate.",
    examples: ["Completely safe with no side effects", "100% safe for diabetics"],
  },
  {
    id: "pesticide-claims",
    title: "Kill and disinfect claims",
    detail: "Kills viruses, disinfects, and antibacterial language can trigger pesticide-regulation rules for cleaners.",
    examples: ["Kills 99.9% of bacteria and viruses", "Eliminates airborne viruses"],
  },
  {
    id: "substantiation",
    title: "Guarantees and clinical proof",
    detail: "Guaranteed, clinically proven, and miracle wording needs careful qualification and evidence.",
    examples: ["Guaranteed weight loss in 14 days", "Clinically proven to erase wrinkles"],
  },
] as const;

export type ClaimExample = {
  label: string;
  claim: string;
  expected: RegressionCase["expected"];
  category: string;
  context?: string;
};

function pickExamples(filter: (c: RegressionCase) => boolean, limit: number): ClaimExample[] {
  return PRODUCT_REGRESSION_CASES.filter(filter).slice(0, limit).map((c) => ({
    label: c.name,
    claim: c.claim,
    expected: c.expected,
    category: c.category,
    context: c.context,
  }));
}

export const CLAIM_EXAMPLES_BY_SECTOR: Record<string, ClaimExample[]> = {
  Supplements: [
    ...pickExamples((c) => c.category === "Dietary Supplement" && c.expected === "low", 1),
    ...pickExamples((c) => c.category === "Dietary Supplement" && c.expected === "medium", 1),
    ...pickExamples((c) => c.category === "Dietary Supplement" && c.expected === "high", 2),
  ],
  "Functional Food": pickExamples((c) => ["Food", "Beverage", "Functional Food"].includes(c.category), 4),
  "Skincare / Cosmetics": pickExamples((c) => c.category === "Cosmetic", 4),
  "Wellness Products": pickExamples((c) => c.category === "Dietary Supplement", 3),
  "Herbal / Ayurvedic Products": pickExamples((c) => c.name.includes("Herbal") || c.name.includes("Detox"), 3),
  "Amazon / Marketplace Brand": pickExamples(
    (c) => c.expected === "high" && ["Dietary Supplement", "Cosmetic", "Household Cleaner", "Pet Pesticide"].includes(c.category),
    4,
  ),
  "DTC Consumer Brand": pickExamples((c) => ["Consumer Product", "Software"].includes(c.category), 3),
  Other: pickExamples(() => true, 4),
};

export function getClaimExamplesForSector(sector: string): ClaimExample[] {
  return CLAIM_EXAMPLES_BY_SECTOR[sector] || CLAIM_EXAMPLES_BY_SECTOR.Other;
}

export function riskTone(expected: ClaimExample["expected"]) {
  return expected === "high" ? "text-high bg-rose" : expected === "medium" ? "text-medium bg-apricot" : "text-safe bg-mint";
}