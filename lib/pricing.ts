/**
 * ClaimGuard pricing — founder-friendly early pricing (Jun 2026).
 */

export type PricingRegionCode = "US" | "IN" | "GB" | "EU" | "CA" | "AU" | "SG" | "AE";

export type PricingRegion = {
  country: string;
  currency: string;
  locale: string;
  guard: number;
  shield: number;
  agency: number;
  enterpriseFrom: number;
  foundingGuard?: number;
  foundingShield?: number;
};

export const PRICING_REGIONS: Record<PricingRegionCode, PricingRegion> = {
  US: { country: "United States", currency: "USD", locale: "en-US", guard: 29, shield: 79, agency: 199, enterpriseFrom: 699, foundingGuard: 19, foundingShield: 59 },
  IN: { country: "India", currency: "INR", locale: "en-IN", guard: 799, shield: 1999, agency: 5999, enterpriseFrom: 19999, foundingGuard: 599, foundingShield: 1499 },
  GB: { country: "United Kingdom", currency: "GBP", locale: "en-GB", guard: 24, shield: 65, agency: 169, enterpriseFrom: 549, foundingGuard: 16, foundingShield: 49 },
  EU: { country: "European Union", currency: "EUR", locale: "en-IE", guard: 27, shield: 72, agency: 179, enterpriseFrom: 599, foundingGuard: 18, foundingShield: 55 },
  CA: { country: "Canada", currency: "CAD", locale: "en-CA", guard: 39, shield: 99, agency: 269, enterpriseFrom: 849, foundingGuard: 29, foundingShield: 79 },
  AU: { country: "Australia", currency: "AUD", locale: "en-AU", guard: 45, shield: 119, agency: 299, enterpriseFrom: 999, foundingGuard: 35, foundingShield: 89 },
  SG: { country: "Singapore", currency: "SGD", locale: "en-SG", guard: 39, shield: 99, agency: 269, enterpriseFrom: 849, foundingGuard: 29, foundingShield: 79 },
  AE: { country: "United Arab Emirates", currency: "AED", locale: "en-AE", guard: 109, shield: 289, agency: 749, enterpriseFrom: 2499, foundingGuard: 79, foundingShield: 219 },
};

export const ANNUAL_DISCOUNT = 0.2;
export const TRIAL_DAYS = 7;
export const TRIAL_CTA = `Start ${TRIAL_DAYS}-day trial`;
export const EARLY_FOUNDER_PRICING_LINE = "Early founder pricing — limited time.";

export type PaidBillingTier = "guard" | "shield";

/** Maps UI tiers to existing Dodo product env keys (growth = Starter, team = Growth). */
export const BILLING_TIER_TO_DODO: Record<PaidBillingTier, "growth" | "team"> = {
  guard: "growth",
  shield: "team",
};

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Radar",
    subtitle: "Free",
    description: "Try claim checks before you commit.",
    features: ["5 claim scans / month", "1 product", "Risk score + safer rewrites", "Onboarding personalization", "No credit card required"],
    cta: "Start free",
    href: "/signup",
    highlighted: false,
  },
  {
    id: "guard",
    name: "Starter",
    subtitle: "For small founders",
    description: "Basic claim checks and a personalized dashboard to test copy safely.",
    features: ["3 products", "30 claim checks / month", "Copy scanner (website + Amazon)", "Task board + PDF export", "Sector-specific tips"],
    cta: TRIAL_CTA,
    href: "/signup?next=%2Fsettings",
    highlighted: false,
    paidTier: "guard" as PaidBillingTier,
  },
  {
    id: "shield",
    name: "Growth",
    subtitle: "Most popular",
    description: "For active DTC brands publishing weekly across channels.",
    features: ["15 products", "Unlimited claim checks", "Competitor insights + social scan", "Weekly digest + regulation feed", "Compliance copilot + SOP generator"],
    cta: TRIAL_CTA,
    href: "/signup?next=%2Fsettings",
    highlighted: true,
    paidTier: "shield" as PaidBillingTier,
  },
  {
    id: "agency",
    name: "Pro",
    subtitle: "For scaling teams",
    description: "Advanced analytics, bulk checks, and competitor monitoring.",
    features: ["50 products", "Multi-brand workspaces", "Bulk claim checks", "Priority support", "10 team seats"],
    cta: "Contact sales",
    href: "/signup?next=%2Fsettings",
    highlighted: false,
  },
] as const;

export const PRICE_ANCHOR_COPY =
  "Less than one consultant hour ($300) buys months of ClaimGuard Growth.";

export const FOUNDING_OFFER_COPY =
  "Founding brands: Starter from $19/mo locked for life (first 100 users).";

export function formatPlanPrice(
  amount: number,
  region: PricingRegion,
  billingCycle: "monthly" | "annual",
) {
  const value = billingCycle === "annual" ? Math.round(amount * (1 - ANNUAL_DISCOUNT)) : amount;
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatEnterpriseFrom(region: PricingRegion) {
  return `From ${new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
    maximumFractionDigits: 0,
  }).format(region.enterpriseFrom)}/mo`;
}