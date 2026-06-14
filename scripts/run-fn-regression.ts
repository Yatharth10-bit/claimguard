import { analyzeClaimProtected } from "@/lib/claimIntelligence/protectedAnalysis";
import { runClaimIntelligence } from "@/lib/claimIntelligence/engine";
import {
  FALSE_NEGATIVE_REGRESSION_CASES,
  SAFER_REGRESSION_CASES,
  fnCaseInput,
  meetsMaxRisk,
  meetsMinRisk,
  saferCaseInput,
} from "@/lib/claimIntelligence/fnRegressionCases";
import { CLAIM_RULES_VERSION } from "@/lib/claimRulesVersion";

const mode = process.argv.includes("--engine") ? "engine" : "protected";

function analyze(input: ReturnType<typeof fnCaseInput>) {
  if (mode === "engine") {
    return runClaimIntelligence({ ...input, sector: input.sector }, { skipCache: true });
  }
  return analyzeClaimProtected(input);
}

let fnPassed = 0;
let fnFailed = 0;
const fnFailures: string[] = [];

for (const testCase of FALSE_NEGATIVE_REGRESSION_CASES) {
  const result = analyze(fnCaseInput(testCase));
  if (result.riskLevel === "low") {
    fnFailed++;
    fnFailures.push(`${testCase.id}: MUST NOT be safe — got low for "${testCase.claim}" [${testCase.productCategory}]`);
  } else if (!meetsMinRisk(result.riskLevel, testCase.minRisk)) {
    fnFailed++;
    fnFailures.push(
      `${testCase.id}: expected >= ${testCase.minRisk}, got ${result.riskLevel} (${result.riskScore}) — "${testCase.claim}"`,
    );
  } else {
    fnPassed++;
  }
}

let safePassed = 0;
let safeFailed = 0;
const safeFailures: string[] = [];

for (const testCase of SAFER_REGRESSION_CASES) {
  const result = analyze(saferCaseInput(testCase));
  if (!meetsMaxRisk(result.riskLevel, testCase.maxRisk)) {
    safeFailed++;
    safeFailures.push(
      `${testCase.id}: over-flagged — max ${testCase.maxRisk}, got ${result.riskLevel} — "${testCase.claim}"`,
    );
  } else {
    safePassed++;
  }
}

const hero = analyze({
  claimText: "Make you white",
  productCategory: "Facewash",
  sector: "Skincare",
  market: "United States FDA + FTC",
  contextType: "Website",
  ingredients: [],
});

console.log("\n=== ClaimGuard False Negative Regression ===");
console.log(`Rules: ${CLAIM_RULES_VERSION} | Mode: ${mode}`);
console.log(`\nFalse-negative suite: ${fnPassed}/${FALSE_NEGATIVE_REGRESSION_CASES.length} passed`);
if (fnFailures.length) {
  console.log("\nFN failures:");
  fnFailures.forEach((f) => console.log(`  ✗ ${f}`));
}

console.log(`\nSafer-claim suite: ${safePassed}/${SAFER_REGRESSION_CASES.length} passed`);
if (safeFailures.length) {
  console.log("\nOver-flag failures:");
  safeFailures.forEach((f) => console.log(`  ✗ ${f}`));
}

console.log(`\nHero case: "Make you white" + Facewash → ${hero.riskLevel} (${hero.riskScore})`);
if ("mainIssue" in hero && hero.mainIssue) console.log(`  Main issue: ${hero.mainIssue}`);
if ("saferRewrite" in hero) console.log(`  Safer rewrite: ${hero.saferRewrite}`);

const totalFailed = fnFailed + safeFailed;
console.log(`\n${totalFailed === 0 ? "ALL PASSED" : `FAILED: ${totalFailed} case(s)`}`);
process.exit(totalFailed > 0 ? 1 : 0);