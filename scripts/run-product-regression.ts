import { analyzeClaim } from "../lib/analyzeClaim";
import { PRODUCT_REGRESSION_CASES } from "../lib/productRegressionCases";

const classificationFailures: string[] = [];
const rewriteFailures: string[] = [];
const sectorResults = new Map<string, { total: number; passed: number }>();

for (const testCase of PRODUCT_REGRESSION_CASES) {
  const analysis = analyzeClaim({
    claimText: testCase.claim,
    productCategory: testCase.category,
    ingredients: ["Representative ingredient"],
    market: "United States FDA + FTC",
    contextType: testCase.context || "Website",
  });

  const rewriteAnalysis = analyzeClaim({
    claimText: analysis.saferRewrite,
    productCategory: testCase.category,
    ingredients: ["Representative ingredient"],
    market: "United States FDA + FTC",
    contextType: testCase.context || "Website",
  });

  const sector = sectorResults.get(testCase.category) || { total: 0, passed: 0 };
  sector.total++;
  sectorResults.set(testCase.category, sector);

  if (analysis.riskLevel !== testCase.expected) {
    classificationFailures.push(
      `${testCase.name} [${testCase.category}]: expected ${testCase.expected}, got ${analysis.riskLevel} — "${testCase.claim}" (phrases: ${analysis.riskyPhrases.join(", ") || "none"})`,
    );
  } else {
    sector.passed++;
  }

  if (testCase.expected === "high" && rewriteAnalysis.riskLevel === "high") {
    rewriteFailures.push(`${testCase.name}: rewrite remains high risk — "${analysis.saferRewrite}"`);
  }
}

const highCases = PRODUCT_REGRESSION_CASES.filter((c) => c.expected === "high").length;
const classificationPassed = PRODUCT_REGRESSION_CASES.length - classificationFailures.length;
const rewritePassed = highCases - rewriteFailures.length;

console.log("\n100-product regression report");
console.log(`Classification accuracy: ${classificationPassed}/${PRODUCT_REGRESSION_CASES.length}`);
console.log(`High-risk rewrite safety: ${rewritePassed}/${highCases}`);
console.log("\nSector results:");
[...sectorResults.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([name, stats]) => {
  console.log(`  ${name}: ${stats.passed}/${stats.total}`);
});

if (classificationFailures.length) {
  console.log("\nClassification failures:");
  classificationFailures.forEach((line) => console.log(`  ${line}`));
}
if (rewriteFailures.length) {
  console.log("\nRewrite failures:");
  rewriteFailures.forEach((line) => console.log(`  ${line}`));
}

process.exit(classificationFailures.length || rewriteFailures.length ? 1 : 0);