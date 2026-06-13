/**
 * Diagnose and apply Supabase schema fixes using the service role key.
 * Run: npx tsx scripts/apply-supabase-migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  console.error("Load .env.local first, e.g.:");
  console.error('  $env:NEXT_PUBLIC_SUPABASE_URL="..."; $env:SUPABASE_SERVICE_ROLE_KEY="..."; npx tsx scripts/apply-supabase-migration.ts');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSqlViaRpc(sql: string): Promise<{ ok: boolean; error?: string }> {
  const projectRef = url!.replace("https://", "").replace(".supabase.co", "");
  const endpoints = [
    `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`,
    `https://${projectRef}.supabase.co/pg/query`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: serviceKey!,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      });
      if (response.ok) return { ok: true };
    } catch {
      // try next endpoint
    }
  }
  return { ok: false, error: "No SQL RPC endpoint available" };
}

async function diagnose() {
  console.log("\n=== ClaimGuard Supabase diagnostics ===\n");
  console.log("Project:", url);

  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ perPage: 5 });
  if (usersError) {
    console.log("Auth admin:", usersError.message);
  } else {
    console.log("Auth users found:", users.users.length, "(showing up to 5)");
    users.users.forEach((u) => console.log(" -", u.email, u.id));
  }

  const profileProbe = await admin.from("profiles").select("id, email, brand_compliance_profile").limit(3);
  if (profileProbe.error) {
    console.log("\nprofiles table ERROR:", profileProbe.error.message, profileProbe.error.code);
  } else {
    console.log("\nprofiles table: OK (", profileProbe.data?.length ?? 0, "rows sampled)");
    profileProbe.data?.forEach((row) => {
      const p = row.brand_compliance_profile as { onboardingCompleted?: boolean; brandName?: string } | null;
      console.log(" -", row.email, p?.onboardingCompleted ? `onboarded (${p.brandName})` : "not onboarded");
    });
  }

  for (const table of ["products", "claims", "usage_counters", "feedback_messages", "billing_subscriptions"]) {
    const { error } = await admin.from(table).select("*", { count: "exact", head: true });
    console.log(`${table}:`, error ? `MISSING/ERROR - ${error.message}` : "OK");
  }
}

async function backfillProfiles() {
  const { data: users, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error || !users?.users.length) {
    console.log("\nSkipping profile backfill:", error?.message || "no users");
    return;
  }

  let created = 0;
  for (const user of users.users) {
    const { data: existing } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (existing) continue;
    const { error: insertError } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: String(user.user_metadata?.full_name || ""),
    });
    if (!insertError) {
      created++;
      console.log("Created profile for", user.email);
    } else {
      console.log("Could not create profile for", user.email, "-", insertError.message);
    }
  }
  console.log(`\nProfile backfill complete. Created ${created} row(s).`);
}

async function main() {
  await diagnose();
  await backfillProfiles();

  const migrationPath = resolve(__dirname, "../supabase/profile-onboarding-migration.sql");
  const sql = readFileSync(migrationPath, "utf8");
  const ddlStatements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  console.log("\n=== Attempting DDL migration ===\n");
  const sqlResult = await runSqlViaRpc(ddlStatements.join(";\n") + ";");
  if (!sqlResult.ok) {
    console.log("Could not run DDL via API:", sqlResult.error);
    console.log("\nRun this SQL manually in Supabase Dashboard -> SQL Editor:");
    console.log("File: supabase/profile-onboarding-migration.sql");
    console.log("\nOr add your database password and re-run with DATABASE_URL set.");
  } else {
    console.log("DDL migration applied successfully.");
  }

  console.log("\n=== Re-checking profiles ===\n");
  const recheck = await admin.from("profiles").select("id, email, brand_compliance_profile").limit(5);
  if (recheck.error) {
    console.log("Still failing:", recheck.error.message);
    process.exit(1);
  }
  console.log("profiles column brand_compliance_profile is accessible.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});