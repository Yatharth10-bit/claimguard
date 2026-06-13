/**
 * Production Supabase provisioning for ClaimGuard.
 * Run: npx tsx scripts/deploy-supabase.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Optional: DATABASE_URL (direct Postgres) or SUPABASE_DB_PASSWORD for DDL/policies.
 * Optional: SUPABASE_ACCESS_TOKEN for Management API auth URL updates.
 */

import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { ensureBrandProfilesBucket } from "../lib/brandProfileRemote";

function loadEnvFile(path: string) {
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(__dirname, "../.env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = url?.replace("https://", "").replace(".supabase.co", "") || "";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PRODUCTION_URLS = [
  "https://claimguard.in",
  "https://www.claimguard.in",
  "https://claimguard-silk.vercel.app",
  "http://localhost:3002",
];

const REDIRECT_URLS = [
  ...PRODUCTION_URLS.map((origin) => `${origin}/auth/callback`),
  "http://localhost:3002/auth/callback",
];

const SQL_FILES = [
  "profile-onboarding-migration.sql",
  "storage-brand-profiles.sql",
  "feature-expansion-migration.sql",
  "usage-counter-rpc.sql",
];

async function runPg(sql: string): Promise<{ ok: boolean; error?: string }> {
  const databaseUrl = process.env.DATABASE_URL
    || (process.env.SUPABASE_DB_PASSWORD
      ? `postgresql://postgres.${projectRef}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
      : "");

  if (!databaseUrl) {
    return { ok: false, error: "DATABASE_URL or SUPABASE_DB_PASSWORD not set" };
  }

  const pg = await import("pg");
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runManagementSql(sql: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "SUPABASE_ACCESS_TOKEN not set" };

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: `${response.status} ${body}` };
  }
  return { ok: true };
}

async function applySqlFile(fileName: string) {
  const filePath = resolve(__dirname, "../supabase", fileName);
  const sql = readFileSync(filePath, "utf8");
  console.log(`\nApplying ${fileName}...`);

  const pgResult = await runPg(sql);
  if (pgResult.ok) {
    console.log(`  OK via Postgres (${fileName})`);
    return true;
  }

  const mgmtResult = await runManagementSql(sql);
  if (mgmtResult.ok) {
    console.log(`  OK via Management API (${fileName})`);
    return true;
  }

  console.log(`  Skipped ${fileName}:`, pgResult.error || mgmtResult.error);
  return false;
}

async function ensureBucket(name: string, fileSizeLimit: number) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  const existing = buckets?.find((bucket) => bucket.name === name);
  if (existing) {
    await admin.storage.updateBucket(name, { public: false, fileSizeLimit });
    console.log(`Bucket updated: ${name}`);
    return;
  }
  await admin.storage.createBucket(name, { public: false, fileSizeLimit });
  console.log(`Bucket created: ${name}`);
}

async function backfillProfiles() {
  const { data: users, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  let created = 0;
  for (const user of users.users) {
    const { data: existing } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (existing) continue;
    const { error: insertError } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: String(user.user_metadata?.full_name || ""),
    });
    if (!insertError) created++;
  }
  console.log(`Profile backfill: ${created} row(s) created`);
}

async function diagnoseTables() {
  const tables = [
    "profiles",
    "products",
    "claims",
    "usage_counters",
    "billing_subscriptions",
    "amazon_listings",
    "amazon_scan_results",
    "notifications",
    "feedback_messages",
  ];

  console.log("\n=== Table diagnostics ===");
  for (const table of tables) {
    const { error } = await admin.from(table).select("*", { count: "exact", head: true });
    console.log(`  ${table}:`, error ? `MISSING (${error.message})` : "OK");
  }

  const columnProbe = await admin.from("profiles").select("brand_compliance_profile").limit(1);
  console.log(
    "  profiles.brand_compliance_profile:",
    columnProbe.error ? `MISSING (${columnProbe.error.message})` : "OK",
  );
}

async function updateAuthUrls() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.log("\nAuth URLs: skipped (set SUPABASE_ACCESS_TOKEN to auto-configure)");
    return;
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: "https://claimguard.in",
      uri_allow_list: REDIRECT_URLS.join(","),
    }),
  });

  if (!response.ok) {
    console.log("Auth URLs: failed", response.status, await response.text());
    return;
  }
  console.log("Auth URLs: updated for production + localhost");
}

async function main() {
  console.log("ClaimGuard Supabase deploy");
  console.log("Project:", url);

  await diagnoseTables();
  await backfillProfiles();
  await ensureBrandProfilesBucket(admin);
  await ensureBucket("compliance-documents", 10 * 1024 * 1024);

  let sqlApplied = 0;
  for (const file of SQL_FILES) {
    if (await applySqlFile(file)) sqlApplied++;
  }

  if (sqlApplied === 0) {
    console.log("\nDDL migrations were not applied automatically.");
    console.log("Add DATABASE_URL to .env.local (Supabase -> Settings -> Database -> URI), then re-run:");
    console.log("  npx tsx scripts/deploy-supabase.ts");
    console.log("\nOr run supabase/deploy-all.sql once in the Supabase SQL Editor.");
  }

  await updateAuthUrls();
  await diagnoseTables();

  console.log("\nDeploy script finished.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});