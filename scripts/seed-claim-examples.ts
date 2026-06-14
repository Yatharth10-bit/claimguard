/**
 * Seeds claim_examples from in-memory seed dataset.
 * Run after claim-intelligence-engine.sql migration.
 * Usage: npm run db:seed-claims
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { getSeedExamples } from "../lib/claimIntelligence/seedDataset";

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
const MAX_INSERT = Number(process.env.SEED_LIMIT || 5000);

async function main() {
  const examples = getSeedExamples().slice(0, MAX_INSERT);
  console.log(`Seeding ${examples.length} claim examples…`);

  let inserted = 0;
  for (let i = 0; i < examples.length; i += BATCH) {
    const chunk = examples.slice(i, i + BATCH).map((ex) => ({
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
      source_url: ex.sourceUrl,
      trust_score: ex.trustScore,
      reviewed: ex.trustScore >= 85,
      approved_for_production: ex.trustScore >= 90,
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
    console.log(`  ${inserted}/${examples.length}`);
  }

  console.log(`Done. ${inserted} examples inserted.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});