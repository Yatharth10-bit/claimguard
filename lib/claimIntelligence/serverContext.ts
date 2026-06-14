import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbExampleRow } from "@/lib/claimIntelligence/retrievalLayer";
import type { DbClaimRuleRow } from "@/lib/claimIntelligence/dbRulesLayer";

export async function fetchApprovedExamples(
  admin: SupabaseClient,
  sector?: string,
  limit = 200,
): Promise<DbExampleRow[]> {
  let query = admin
    .from("claim_examples")
    .select("claim_text, sector, risk_level, risk_reason, safer_rewrite, confidence_score, source")
    .eq("approved_for_production", true)
    .limit(limit);

  if (sector) {
    query = query.ilike("sector", `%${sector}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

export async function fetchActiveDbRules(
  admin: SupabaseClient,
  sector?: string,
  limit = 100,
): Promise<DbClaimRuleRow[]> {
  let query = admin
    .from("claim_rules")
    .select("pattern, sector, region, risk_category, severity, explanation, safer_alternative_pattern")
    .eq("active", true)
    .limit(limit);

  if (sector) {
    query = query.or(`sector.eq.,sector.ilike.%${sector}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}