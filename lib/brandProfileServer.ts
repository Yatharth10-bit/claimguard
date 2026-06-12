import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { EMPTY_BRAND_PROFILE } from "@/lib/brandProfile";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function loadBrandProfileServer(userId: string): Promise<BrandComplianceProfile | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("profiles")
    .select("brand_compliance_profile")
    .eq("id", userId)
    .maybeSingle();
  const remote = data?.brand_compliance_profile as BrandComplianceProfile | null;
  if (!remote) return null;
  return { ...EMPTY_BRAND_PROFILE, ...remote };
}