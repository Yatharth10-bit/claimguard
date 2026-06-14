import { runClaimIntelligence } from "@/lib/claimIntelligence/engine";
import { EXPANDED_REGRESSION_CASES } from "@/lib/expandedRegressionCases";
import { CLAIM_RULES_VERSION } from "@/lib/claimIntelligence/versions";

export type EvaluationReport = {
  runType: string;
  datasetVersion: string;
  ruleVersion: string;
  totalExamples: number;
  accuracyEstimate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  rewriteQualityScore: number;
  sectorBreakdown: Record<string, { total: number; correct: number }>;
  riskCategoryBreakdown: Record<string, number>;
  notes: string;
};

export function runClaimEvaluation(limit = 500): EvaluationReport {
  const cases = EXPANDED_REGRESSION_CASES.slice(0, limit);
  let correct = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let rewriteSafe = 0;
  const sectorBreakdown: Record<string, { total: number; correct: number }> = {};
  const riskCategoryBreakdown: Record<string, number> = {};

  for (const c of cases) {
    const result = runClaimIntelligence({
      claimText: c.claim,
      productCategory: c.category,
      ingredients: [],
      market: c.market,
      contextType: c.context || "Website",
      sector: c.category,
    });

    const match = result.riskLevel === c.expected;
    if (match) correct++;
    if (result.riskLevel === "high" && c.expected === "low") falsePositives++;
    if (result.riskLevel === "low" && c.expected === "high") falseNegatives++;
    if (result.saferRewrite && result.saferRewrite !== c.claim) rewriteSafe++;

    const sector = c.category;
    if (!sectorBreakdown[sector]) sectorBreakdown[sector] = { total: 0, correct: 0 };
    sectorBreakdown[sector].total++;
    if (match) sectorBreakdown[sector].correct++;

    for (const cat of result.riskCategories) {
      riskCategoryBreakdown[cat] = (riskCategoryBreakdown[cat] || 0) + 1;
    }
  }

  const total = cases.length;
  return {
    runType: "regression_suite",
    datasetVersion: "expanded-1000",
    ruleVersion: CLAIM_RULES_VERSION,
    totalExamples: total,
    accuracyEstimate: Math.round((correct / total) * 1000) / 10,
    falsePositiveRate: Math.round((falsePositives / total) * 1000) / 10,
    falseNegativeRate: Math.round((falseNegatives / total) * 1000) / 10,
    rewriteQualityScore: Math.round((rewriteSafe / total) * 1000) / 10,
    sectorBreakdown,
    riskCategoryBreakdown,
    notes: "Evaluation uses approved regression suite only. Internet-learned examples require separate review before production promotion.",
  };
}