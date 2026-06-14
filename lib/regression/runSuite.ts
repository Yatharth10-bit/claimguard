import { analyzeClaim } from "@/lib/analyzeClaim";
import { CLAIM_RULES_VERSION } from "@/lib/claimRulesVersion";
import { EXPANDED_REGRESSION_CASES } from "@/lib/expandedRegressionCases";

export type RegressionCase = {
  id: string;
  claim: string;
  category: string;
  market: string;
  context: string;
  expected: "low" | "medium" | "high";
  sector?: string;
};

export type RegressionRunResult = {
  rulesVersion: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  failures: { id: string; claim: string; expected: string; actual: string }[];
  throughputPerHour: number;
};

function allCases(): RegressionCase[] {
  return EXPANDED_REGRESSION_CASES.map((c, i) => ({
    id: `exp-${i}`,
    claim: c.claim,
    category: c.category,
    market: c.market || "United States FDA + FTC",
    context: c.context || "Website",
    expected: c.expected,
  }));
}

export function runRegressionSuite(limit?: number): RegressionRunResult {
  const start = Date.now();
  const cases = limit ? allCases().slice(0, limit) : allCases();
  const failures: RegressionRunResult["failures"] = [];
  let passed = 0;

  for (const testCase of cases) {
    const result = analyzeClaim({
      claimText: testCase.claim,
      productCategory: testCase.category,
      market: testCase.market,
      contextType: testCase.context,
      ingredients: [],
    });
    if (result.riskLevel === testCase.expected) {
      passed++;
    } else {
      failures.push({
        id: testCase.id,
        claim: testCase.claim.slice(0, 80),
        expected: testCase.expected,
        actual: result.riskLevel,
      });
    }
  }

  const durationMs = Date.now() - start;
  const throughputPerHour = durationMs > 0
    ? Math.round((cases.length / durationMs) * 3600000)
    : 0;

  return {
    rulesVersion: CLAIM_RULES_VERSION,
    total: cases.length,
    passed,
    failed: failures.length,
    durationMs,
    failures: failures.slice(0, 50),
    throughputPerHour,
  };
}