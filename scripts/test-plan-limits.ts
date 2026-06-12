import { PLAN_LIMITS, resolvePlanTier } from "../lib/planLimits";

const cases = [
  { subscription: null, expected: "radar" },
  { subscription: { plan: "growth_monthly", status: "active" }, expected: "guard" },
  { subscription: { plan: "team_annual", status: "trialing" }, expected: "shield" },
  { subscription: { plan: "growth_monthly", status: "cancelled" }, expected: "radar" },
] as const;

let failed = 0;

for (const testCase of cases) {
  const actual = resolvePlanTier(testCase.subscription);
  if (actual !== testCase.expected) {
    failed++;
    console.log(`FAIL plan resolve: expected ${testCase.expected}, got ${actual}`);
  }
}

const radar = PLAN_LIMITS.radar;
if (radar.monthlyScans !== 5 || radar.maxProducts !== 1 || radar.weeklyDigest) {
  failed++;
  console.log("FAIL radar limits");
}

const shield = PLAN_LIMITS.shield;
if (shield.monthlyScans !== null || !shield.weeklyDigest || !shield.sopGenerator) {
  failed++;
  console.log("FAIL shield limits");
}

console.log(failed ? `\nPlan limit tests failed: ${failed}` : "\nPlan limit tests passed");
process.exit(failed ? 1 : 0);