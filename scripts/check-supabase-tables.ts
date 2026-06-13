import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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

const tables = [
  "profiles",
  "products",
  "claims",
  "usage_counters",
  "billing_subscriptions",
  "amazon_listings",
  "amazon_scan_results",
  "notifications",
  "social_connections",
  "social_posts",
  "label_scans",
  "substantiation_entries",
  "competitor_trackers",
];

async function main() {
  for (const table of tables) {
    const { error } = await admin.from(table).select("*", { count: "exact", head: true });
    console.log(`${table}:`, error ? `${error.code} ${error.message}` : "OK");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});