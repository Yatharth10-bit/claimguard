import { analyzeClaim } from "../lib/analyzeClaim";
import { runCopilotFeatureTests } from "../lib/complianceCopilot";
import { EXPANDED_REGRESSION_CASES } from "../lib/expandedRegressionCases";

const classificationFailures: string[] = [];
const rewriteFailures: string[] = [];
const sectorResults = new Map<string, { total: number; passed: number }>();

for (const testCase of EXPANDED_REGRESSION_CASES) {
  const analysis = analyzeClaim({
    claimText: testCase.claim,
    productCategory: testCase.category,
    ingredients: ["Representative ingredient"],
    market: testCase.market,
    contextType: testCase.context || "Website",
  });

  const rewriteAnalysis = analyzeClaim({
    claimText: analysis.saferRewrite,
    productCategory: testCase.category,
    ingredients: ["Representative ingredient"],
    market: testCase.market,
    contextType: testCase.context || "Website",
  });

  const sector = sectorResults.get(testCase.category) || { total: 0, passed: 0 };
  sector.total++;
  sectorResults.set(testCase.category, sector);

  if (analysis.riskLevel !== testCase.expected) {
    classificationFailures.push(
      `${testCase.name} [${testCase.category}/${testCase.market}]: expected ${testCase.expected}, got ${analysis.riskLevel}`,
    );
  } else {
    sector.passed++;
  }

  if (testCase.expected === "high" && rewriteAnalysis.riskLevel === "high") {
    rewriteFailures.push(`${testCase.name}: rewrite remains high risk`);
  }
}

const highCases = EXPANDED_REGRESSION_CASES.filter((c) => c.expected === "high").length;
const classificationPassed = EXPANDED_REGRESSION_CASES.length - classificationFailures.length;
const rewritePassed = highCases - rewriteFailures.length;
const copilotTests = runCopilotFeatureTests();
const copilotPassed = copilotTests.filter((test) => test.passed).length;

console.log("\n1000-product expanded regression report");
console.log(`Classification accuracy: ${classificationPassed}/${EXPANDED_REGRESSION_CASES.length}`);
console.log(`High-risk rewrite safety: ${rewritePassed}/${highCases}`);
console.log(`Copilot feature tests: ${copilotPassed}/${copilotTests.length}`);

console.log("\nSector results (sample):");
[...sectorResults.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(0, 12).forEach(([name, stats]) => {
  console.log(`  ${name}: ${stats.passed}/${stats.total}`);
});

if (copilotTests.some((test) => !test.passed)) {
  console.log("\nCopilot feature failures:");
  copilotTests.filter((test) => !test.passed).forEach((test) => console.log(`  ${test.name}${test.detail ? ` — ${test.detail}` : ""}`));
}

if (classificationFailures.length) {
  console.log(`\nClassification failures: ${classificationFailures.length} (showing first 20)`);
  classificationFailures.slice(0, 20).forEach((line) => console.log(`  ${line}`));
}
if (rewriteFailures.length) {
  console.log(`\nRewrite failures: ${rewriteFailures.length} (showing first 20)`);
  rewriteFailures.slice(0, 20).forEach((line) => console.log(`  ${line}`));
}

const failed = classificationFailures.length || rewriteFailures.length || copilotTests.some((test) => !test.passed);
process.exit(failed ? 1 : 0);