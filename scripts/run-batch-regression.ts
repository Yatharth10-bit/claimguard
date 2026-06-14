/**
 * Offline batch regression — does not affect live app latency.
 * Target: 10k+ cases/hour throughput on rules engine (expand corpus in productRegressionCases).
 *
 * Usage: npx tsx scripts/run-batch-regression.ts [--limit N]
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { runRegressionSuite } from "@/lib/regression/runSuite";

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

const result = runRegressionSuite(limit);

console.log(`Rules version: ${result.rulesVersion}`);
console.log(`Cases: ${result.total} | Passed: ${result.passed} | Failed: ${result.failed}`);
console.log(`Duration: ${result.durationMs}ms | Throughput: ~${result.throughputPerHour.toLocaleString()} cases/hour`);

if (result.failures.length) {
  console.log("\nSample failures:");
  for (const f of result.failures.slice(0, 10)) {
    console.log(`  [${f.id}] expected ${f.expected}, got ${f.actual}: ${f.claim}`);
  }
}

const outDir = join(process.cwd(), "reports");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `regression-${result.rulesVersion}-${Date.now()}.json`);
writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`\nReport written to ${outPath}`);

process.exit(result.failed > 0 ? 1 : 0);