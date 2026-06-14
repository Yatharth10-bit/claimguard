/**
 * Seeds claim_examples from the 1M+ mega catalog.
 * Run after claim-intelligence-engine.sql migration.
 *
 * Usage:
 *   npm run db:seed-claims
 *   SEED_LIMIT=1000000 npm run db:seed-claims   # full 1M (takes hours)
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { getMegaDatasetSize, iterateMegaBatchLight } from "../lib/claimIntelligence/megaSeedGenerator";

function loadEnv() {
  const text = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

loadEnv();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const BATCH = 500;
const MAX_INSERT = Math.min(
  Number(process.env.SEED_LIMIT || 50_000),
  getMegaDatasetSize(),
);
const START = Number(process.env.SEED_START || 0);

async function main() {
  console.log(`Seeding ${MAX_INSERT.toLocaleString()} from mega catalog (${getMegaDatasetSize().toLocaleString()} total virtual rows)…`);

  let inserted = 0;
  for (let offset = 0; offset < MAX_INSERT; offset += BATCH) {
    const size = Math.min(BATCH, MAX_INSERT - offset);
    const chunk = [...iterateMegaBatchLight(START + offset, size)].map((ex) => ({
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
      reviewed: ex.trustScore >= 85,
      approved_for_production: ex.trustScore >= 88,
    }));

    const { error } = await admin.from("claim_examples").insert(chunk);
    if (error) {
      console.error("Batch failed:", error.message);
      if (error.message.includes("does not exist")) {
        console.error("Run supabase/claim-intelligence-engine.sql first.");
      }
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  ${inserted.toLocaleString()}/${MAX_INSERT.toLocaleString()}`);
  }

  console.log(`Done. ${inserted.toLocaleString()} examples inserted.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});