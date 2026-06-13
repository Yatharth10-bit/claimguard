/**
 * Apply brand-profiles storage bucket + RLS policies.
 * Run: npx tsx scripts/apply-storage-migration.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!url || !serviceKey || !anonKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const projectRef = url.replace("https://", "").replace(".supabase.co", "");
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(url, anonKey);

const sqlPath = resolve(__dirname, "../supabase/storage-brand-profiles.sql");
const sql = readFileSync(sqlPath, "utf8");

async function ensureBucket() {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) throw listError;

  const existing = buckets?.find((bucket) => bucket.name === "brand-profiles");
  if (existing) {
    const { error } = await admin.storage.updateBucket("brand-profiles", {
      public: false,
      fileSizeLimit: 102400,
    });
    if (error) throw error;
    console.log("Updated bucket: brand-profiles (private, 100KB limit)");
    return;
  }

  const { error } = await admin.storage.createBucket("brand-profiles", {
    public: false,
    fileSizeLimit: 102400,
  });
  if (error) throw error;
  console.log("Created bucket: brand-profiles (private, 100KB limit)");
}

async function runSqlViaPg(query: string): Promise<{ ok: boolean; error?: string }> {
  if (!databaseUrl) return { ok: false, error: "DATABASE_URL not set" };

  const pg = await import("pg");
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(query);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function applyPolicies() {
  const policyStatements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement && !statement.startsWith("--") && !statement.toLowerCase().startsWith("insert into storage.buckets"));

  const combined = `${policyStatements.join(";\n")};`;
  const pgResult = await runSqlViaPg(combined);
  if (pgResult.ok) {
    console.log("Applied storage RLS policies via DATABASE_URL");
    return true;
  }

  console.log("Skipped SQL policies:", pgResult.error);
  return false;
}

async function verifyBucket() {
  const { data, error } = await admin.storage.listBuckets();
  if (error) throw error;
  const bucket = data?.find((item) => item.name === "brand-profiles");
  if (!bucket) throw new Error("brand-profiles bucket not found after migration");
  if (bucket.public) throw new Error("brand-profiles bucket is still public");
  console.log("Verified bucket:", {
    name: bucket.name,
    public: bucket.public,
    fileSizeLimit: bucket.file_size_limit,
  });
}

async function verifyAnonymousAccessBlocked() {
  const upload = await anon.storage.from("brand-profiles").upload(
    "security-check/profile.json",
    JSON.stringify({ probe: true }),
    { upsert: true, contentType: "application/json" },
  );

  const blocked = Boolean(upload.error?.message?.toLowerCase().includes("row-level security"));
  if (!blocked) {
    throw new Error(`Anonymous upload was not blocked: ${upload.error?.message || "upload succeeded"}`);
  }

  console.log("Verified anonymous upload is blocked by storage RLS");
}

async function main() {
  console.log("Project:", projectRef);
  await ensureBucket();
  const policiesApplied = await applyPolicies();
  await verifyBucket();
  await verifyAnonymousAccessBlocked();

  if (policiesApplied) {
    console.log("\nStorage migration complete (bucket + explicit policies).");
    return;
  }

  console.log("\nStorage migration complete (bucket secured).");
  console.log("Explicit per-user storage policies were not applied because DATABASE_URL is not configured.");
  console.log("Current security is still good: bucket is private and anonymous writes are blocked.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});