import DodoPayments from "dodopayments";

export type BillingPlan = "growth_monthly" | "growth_annual" | "team_monthly" | "team_annual";

const productIds: Record<BillingPlan, string | undefined> = {
  growth_monthly: process.env.DODO_GROWTH_MONTHLY_PRODUCT_ID,
  growth_annual: process.env.DODO_GROWTH_ANNUAL_PRODUCT_ID,
  team_monthly: process.env.DODO_TEAM_MONTHLY_PRODUCT_ID,
  team_annual: process.env.DODO_TEAM_ANNUAL_PRODUCT_ID,
};

export function isDodoConfigured() {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY);
}

export function getDodoProductId(plan: BillingPlan) {
  const productId = productIds[plan];
  if (!productId) throw new Error(`Dodo Payments product ID is missing for ${plan}.`);
  return productId;
}

export function getDodoClient() {
  if (!process.env.DODO_PAYMENTS_API_KEY) throw new Error("Dodo Payments is not configured.");
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  });
}

