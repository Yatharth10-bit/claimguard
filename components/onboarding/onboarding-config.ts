import type { BrandComplianceProfile } from "@/lib/brandProfile";

export type FlashcardField =
  | "brandName"
  | "sector"
  | "productType"
  | "commonClaims"
  | "ingredients"
  | "salesRegions"
  | "salesChannels"
  | "mainConcern"
  | "complianceLevel"
  | "firstClaim";

export type FlashcardInputType =
  | "text"
  | "textarea"
  | "select-cards"
  | "multi-select"
  | "single-select";

export type OnboardingStep = {
  id: FlashcardField;
  question: string;
  inputType: FlashcardInputType;
  placeholder?: string;
  helperText?: string;
  options?: string[];
  suggestions?: string[];
  skippable?: boolean;
};

export const SECTOR_OPTIONS = [
  "Supplements",
  "Functional Food",
  "Skincare / Cosmetics",
  "Wellness Products",
  "Herbal / Ayurvedic Products",
  "Amazon / Marketplace Brand",
  "DTC Consumer Brand",
  "Other",
] as const;

export const REGION_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "European Union",
  "Canada",
  "Australia",
  "Global / Multiple Regions",
  "Not sure yet",
] as const;

export const CHANNEL_OPTIONS = [
  "Own Website",
  "Amazon",
  "Flipkart",
  "Shopify Store",
  "Instagram / Meta Ads",
  "Google Ads",
  "Retail Stores",
  "Distributors",
  "Other Marketplaces",
] as const;

export const CONCERN_OPTIONS = [
  "Risky product claims",
  "FDA / FTC / FSSAI / EU compliance",
  "Amazon listing suspension",
  "Label disclaimers",
  "Ad copy getting rejected",
  "Ingredient-specific rules",
  "Not knowing what is legally safe to say",
  "Preparing for future audits",
] as const;

export const COMPLIANCE_LEVEL_OPTIONS = [
  "Beginner — I need simple guidance",
  "Intermediate — I know the basics",
  "Advanced — I need faster review and monitoring",
  "I work with a consultant or legal advisor",
] as const;

const PRODUCT_SUGGESTIONS: Record<string, string[]> = {
  Supplements: ["Ashwagandha gummies", "Protein powder", "Immunity supplement", "Multivitamin capsules"],
  "Functional Food": ["Probiotic yogurt", "High-protein snack bar", "Herbal tea", "Fortified beverage"],
  "Skincare / Cosmetics": ["Face serum", "Retinol cream", "Vitamin C moisturizer", "Sunscreen SPF 50"],
  "Wellness Products": ["Sleep support drops", "Stress relief gummies", "Energy wellness drink"],
  "Herbal / Ayurvedic Products": ["Turmeric capsules", "Triphala powder", "Ashwagandha tonic"],
  "Amazon / Marketplace Brand": ["Collagen peptides", "Hair growth supplement", "Detox tea"],
  "DTC Consumer Brand": ["Daily wellness stack", "Beauty-from-within gummies"],
  Other: ["Ashwagandha gummies", "Protein powder", "Face serum", "Herbal tea"],
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "brandName",
    question: "What is your brand name?",
    inputType: "text",
    placeholder: "Example: GlowWell Naturals",
  },
  {
    id: "sector",
    question: "Which sector best describes your brand?",
    inputType: "select-cards",
    options: [...SECTOR_OPTIONS],
  },
  {
    id: "productType",
    question: "What type of product do you mainly sell?",
    inputType: "text",
    placeholder: "Example: Ashwagandha gummies",
    suggestions: PRODUCT_SUGGESTIONS.Other,
  },
  {
    id: "commonClaims",
    question: "What claims do you commonly use in your marketing?",
    inputType: "textarea",
    helperText: "Paste 2–5 common claims from your website, ads, label, Amazon listing, or Instagram captions.",
    placeholder: "Example: Supports immunity, reduces inflammation, improves gut health",
  },
  {
    id: "ingredients",
    question: "Which key ingredients or active components should ClaimGuard watch?",
    inputType: "textarea",
    placeholder: "Example: Ashwagandha, turmeric, collagen, vitamin C, niacinamide",
  },
  {
    id: "salesRegions",
    question: "Where do you sell or plan to sell this product?",
    inputType: "multi-select",
    options: [...REGION_OPTIONS],
  },
  {
    id: "salesChannels",
    question: "Where do customers see or buy your product?",
    inputType: "multi-select",
    options: [...CHANNEL_OPTIONS],
  },
  {
    id: "mainConcern",
    question: "What are you most worried about right now?",
    inputType: "select-cards",
    options: [...CONCERN_OPTIONS],
  },
  {
    id: "complianceLevel",
    question: "How familiar are you with product compliance?",
    inputType: "single-select",
    options: [...COMPLIANCE_LEVEL_OPTIONS],
  },
  {
    id: "firstClaim",
    question: "Paste your first claim to check",
    inputType: "textarea",
    helperText: "ClaimGuard will use this to personalize your first dashboard risk card.",
    placeholder: "Example: Our formula cures inflammation and boosts immunity.",
    skippable: true,
  },
];

export function getProductSuggestions(sector: string): string[] {
  return PRODUCT_SUGGESTIONS[sector] || PRODUCT_SUGGESTIONS.Other;
}

export type OnboardingDraft = Pick<
  BrandComplianceProfile,
  | "brandName"
  | "sector"
  | "productType"
  | "commonClaims"
  | "ingredients"
  | "salesRegions"
  | "salesChannels"
  | "mainConcern"
  | "complianceLevel"
  | "firstClaim"
>;

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  brandName: "",
  sector: "",
  productType: "",
  commonClaims: "",
  ingredients: "",
  salesRegions: [],
  salesChannels: [],
  mainConcern: "",
  complianceLevel: "",
  firstClaim: "",
};

export function isStepValid(step: OnboardingStep, draft: OnboardingDraft): boolean {
  const value = draft[step.id];
  if (step.skippable) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}