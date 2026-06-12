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

/** Five high-impact steps — each one directly shapes dashboard personalization. */
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
];

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