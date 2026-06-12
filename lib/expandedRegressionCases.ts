import { PRODUCT_REGRESSION_CASES, type RegressionCase } from "@/lib/productRegressionCases";

const CONTEXT_VARIANTS = ["Website", "Amazon listing", "Ad copy", "Social media", "Influencer script", "Label", "Email campaign", "Retail packaging", "Product page hero", "Marketplace title"];
const MARKET_VARIANTS = [
  "United States FDA + FTC",
  "India FSSAI",
  "European Union",
  "United Kingdom",
  "Canada",
  "Australia",
  "United States FDA + FTC",
  "India FSSAI",
  "European Union",
  "United Kingdom",
];

export type ExpandedRegressionCase = RegressionCase & {
  variantIndex: number;
  market: string;
};

function buildExpandedCases(): ExpandedRegressionCase[] {
  const expanded: ExpandedRegressionCase[] = [];
  for (const base of PRODUCT_REGRESSION_CASES) {
    for (let index = 0; index < 10; index++) {
      expanded.push({
        ...base,
        name: `${base.name} · v${index + 1}`,
        context: CONTEXT_VARIANTS[index],
        market: MARKET_VARIANTS[index],
        variantIndex: index,
      });
    }
  }
  return expanded;
}

export const EXPANDED_REGRESSION_CASES = buildExpandedCases();

if (EXPANDED_REGRESSION_CASES.length !== 1000) {
  throw new Error(`Expanded regression suite must contain exactly 1000 cases; found ${EXPANDED_REGRESSION_CASES.length}.`);
}