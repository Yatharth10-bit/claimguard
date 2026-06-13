import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { EMPTY_BRAND_PROFILE } from "@/lib/brandProfile";
import { loadRemoteBrandProfile } from "@/lib/brandProfileRemote";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function loadBrandProfileServer(userId: string): Promise<BrandComplianceProfile | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const remote = await loadRemoteBrandProfile(admin, userId);
  if (!remote) return null;
  return { ...EMPTY_BRAND_PROFILE, ...remote };
}