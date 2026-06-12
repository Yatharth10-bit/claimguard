/**
 * ClaimGuard pricing — aligned with Competitor Intelligence Report (Jun 2026).
 * US/IN anchors from report; other regions use market-appropriate local pricing.
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
};

export const PRICING_REGIONS: Record<PricingRegionCode, PricingRegion> = {
  US: { country: "United States", currency: "USD", locale: "en-US", guard: 39, shield: 99, agency: 299, enterpriseFrom: 799, foundingGuard: 29 },
  IN: { country: "India", currency: "INR", locale: "en-IN", guard: 999, shield: 2499, agency: 7999, enterpriseFrom: 24999 },
  GB: { country: "United Kingdom", currency: "GBP", locale: "en-GB", guard: 32, shield: 79, agency: 249, enterpriseFrom: 649 },
  EU: { country: "European Union", currency: "EUR", locale: "en-IE", guard: 36, shield: 89, agency: 279, enterpriseFrom: 749 },
  CA: { country: "Canada", currency: "CAD", locale: "en-CA", guard: 49, shield: 129, agency: 399, enterpriseFrom: 999 },
  AU: { country: "Australia", currency: "AUD", locale: "en-AU", guard: 59, shield: 149, agency: 449, enterpriseFrom: 1199 },
  SG: { country: "Singapore", currency: "SGD", locale: "en-SG", guard: 49, shield: 129, agency: 399, enterpriseFrom: 999 },
  AE: { country: "United Arab Emirates", currency: "AED", locale: "en-AE", guard: 149, shield: 369, agency: 1099, enterpriseFrom: 2999 },
};

export const ANNUAL_DISCOUNT = 0.2;
export const TRIAL_DAYS = 7;
export const TRIAL_CTA = `Start ${TRIAL_DAYS}-day trial`;

export type PaidBillingTier = "guard" | "shield";

/** Maps UI tiers to existing Dodo product env keys (growth = Guard, team = Shield). */
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
    features: ["5 claim scans / month", "1 product", "Risk score + safer rewrites", "No credit card required"],
    cta: "Start free",
    href: "/signup",
    highlighted: false,
  },
  {
    id: "guard",
    name: "Guard",
    subtitle: "Starter",
    description: "For founders publishing their first compliant copy.",
    features: ["3 products", "30 claim checks / month", "Paste-based copy scanner (website + Amazon)", "Task board + PDF export", "Disclaimer checker"],
    cta: TRIAL_CTA,
    href: "/signup?next=%2Fsettings",
    highlighted: false,
    paidTier: "guard" as PaidBillingTier,
  },
  {
    id: "shield",
    name: "Shield",
    subtitle: "Pro",
    description: "For brands running a repeatable compliance workflow.",
    features: ["15 products", "Unlimited claim checks", "Weekly digest + regulation feed", "SOP generator + compliance copilot", "Task board + audit trail"],
    cta: TRIAL_CTA,
    href: "/signup?next=%2Fsettings",
    highlighted: true,
    paidTier: "shield" as PaidBillingTier,
  },
  {
    id: "agency",
    name: "Agency",
    subtitle: "Teams",
    description: "For agencies and multi-brand operators.",
    features: ["50 products", "Multi-brand workspaces", "SOP generator", "10 team seats", "Priority support"],
    cta: "Contact sales",
    href: "/signup?next=%2Fsettings",
    highlighted: false,
  },
] as const;

export const PRICE_ANCHOR_COPY =
  "Less than one consultant hour ($300) buys six months of ClaimGuard Shield.";

export const FOUNDING_OFFER_COPY =
  "Founding brands: $29/mo Guard locked for life (first 50 users).";

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