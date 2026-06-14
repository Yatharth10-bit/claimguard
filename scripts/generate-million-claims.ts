/**
 * Export or seed the 1M+ mega product claim catalog to Supabase.
 *
 * Usage:
 *   npm run generate:million-claims              # export JSONL sample (1000 rows)
 *   npm run generate:million-claims -- --seed    # insert to DB (default 50k, set SEED_LIMIT=1000000 for full)
 *   SEED_LIMIT=100000 npm run generate:million-claims -- --seed
 */
import { createWriteStream } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  generateMegaExampleAtIndex,
  getDistinctProductCount,
  getMegaDatasetSize,
  iterateMegaBatchLight,
} from "../lib/claimIntelligence/megaSeedGenerator";

function loadEnv() {
  try {
    const { readFileSync } = require("fs") as typeof import("fs");
    const text = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const args = process.argv.slice(2);
const doSeed = args.includes("--seed");
const exportOnly = args.includes("--export");
const startAt = Number(process.env.SEED_START || 0);
const limit = Number(process.env.SEED_LIMIT || (doSeed ? 50_000 : 1000));
const batchSize = 500;

async function seedToDb() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  console.log(`Seeding ${limit.toLocaleString()} claims (start ${startAt})…`);
  let inserted = 0;

  for (let offset = 0; offset < limit; offset += batchSize) {
    const chunk = [...iterateMegaBatchLight(startAt + offset, Math.min(batchSize, limit - offset))].map((ex) => ({
      sector: ex.sector,
      product_category: ex.productCategory,
      product_type: ex.productType,
      region: ex.region,
      channel: ex.channel,
      claim_text: ex.claimText,
      risk_level: ex.riskLevel,
      risk_category: ex.riskCategory,
      risk_reason: ex.riskReason,
      safer_rewrite: ex.saferRewrite,
      confidence_score: ex.confidenceScore,
      source: ex.source,
      trust_score: ex.trustScore,
      reviewed: true,
      approved_for_production: ex.trustScore >= 88,
    }));

    const { error } = await admin.from("claim_examples").insert(chunk);
    if (error) {
      console.error(error.message);
      if (error.message.includes("does not exist")) {
        console.error("Run supabase/claim-intelligence-engine.sql first.");
      }
      process.exit(1);
    }
    inserted += chunk.length;
    process.stdout.write(`\r  ${inserted.toLocaleString()} / ${limit.toLocaleString()}`);
  }
  console.log("\nDone.");
}

function exportJsonl() {
  const outPath = resolve(__dirname, `../data/mega-claims-sample-${limit}.jsonl`);
  const stream = createWriteStream(outPath, { flags: "w" });
  for (let i = 0; i < limit; i++) {
    const ex = generateMegaExampleAtIndex(startAt + i);
    stream.write(JSON.stringify({
      product_type: ex.productType,
      sector: ex.sector,
      claim_text: ex.claimText,
      risk_level: ex.riskLevel,
      safer_rewrite: ex.saferRewrite,
    }) + "\n");
  }
  stream.end();
  console.log(`Exported ${limit} rows to ${outPath}`);
}

async function main() {
  console.log("Mega catalog stats:");
  console.log(`  Distinct products: ${getDistinctProductCount().toLocaleString()}`);
  console.log(`  Total claim variants: ${getMegaDatasetSize().toLocaleString()}`);
  console.log(`  Sectors: 27 · ~80 products each · 500 claims per product`);

  if (doSeed) await seedToDb();
  else if (exportOnly || !doSeed) exportJsonl();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});