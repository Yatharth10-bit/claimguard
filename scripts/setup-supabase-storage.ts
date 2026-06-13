/**
 * Connect to Supabase and provision brand profile storage + profile rows.
 * Run: npx tsx scripts/setup-supabase-storage.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { ensureBrandProfilesBucket } from "../lib/brandProfileRemote";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Load .env.local first.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Connecting to", url);

  await ensureBrandProfilesBucket(admin);
  console.log("Storage bucket: brand-profiles");

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
    if (!insertError) {
      created++;
      console.log("Created profile row:", user.email);
    }
  }
  console.log(`Profile rows created: ${created}`);

  const migrationPath = resolve(__dirname, "../supabase/profile-onboarding-migration.sql");
  console.log("\nNote: brand_compliance_profile column is still missing.");
  console.log("Onboarding now saves to Supabase Storage (brand-profiles bucket).");
  console.log("Optional SQL migration file:", migrationPath);
  console.log(readFileSync(migrationPath, "utf8").split("\n")[2]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});