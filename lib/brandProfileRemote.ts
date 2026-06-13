import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { EMPTY_BRAND_PROFILE } from "@/lib/brandProfile";

const BUCKET = "brand-profiles";
export const PROFILE_MARKER = "__cg_brand_profile_v1__:";

export function formatProfileCompanyName(companyName: string | null | undefined): string {
  if (!companyName?.startsWith(PROFILE_MARKER)) return companyName || "";
  try {
    const profile = JSON.parse(companyName.slice(PROFILE_MARKER.length)) as { brandName?: string };
    return profile.brandName || "";
  } catch {
    return "";
  }
}

export function isEncodedBrandProfileCompanyName(companyName: string | null | undefined): boolean {
  return Boolean(companyName?.startsWith(PROFILE_MARKER));
}

function profilePath(userId: string) {
  return `${userId}/profile.json`;
}

function parseProfile(value: unknown): BrandComplianceProfile | null {
  if (!value || typeof value !== "object") return null;
  return { ...EMPTY_BRAND_PROFILE, ...(value as BrandComplianceProfile) };
}

async function loadFromStorage(admin: SupabaseClient, userId: string): Promise<BrandComplianceProfile | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(profilePath(userId));
  if (error || !data) return null;
  try {
    const text = await data.text();
    return parseProfile(JSON.parse(text));
  } catch {
    return null;
  }
}

async function saveToStorage(admin: SupabaseClient, userId: string, profile: BrandComplianceProfile): Promise<{ ok: boolean; error?: string }> {
  const { error } = await admin.storage.from(BUCKET).upload(profilePath(userId), JSON.stringify(profile), {
    upsert: true,
    contentType: "application/json",
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

async function loadFromCompanyNameFallback(admin: SupabaseClient, userId: string): Promise<BrandComplianceProfile | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("company_name")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data?.company_name?.startsWith(PROFILE_MARKER)) return null;
  try {
    return parseProfile(JSON.parse(data.company_name.slice(PROFILE_MARKER.length)));
  } catch {
    return null;
  }
}

async function saveToCompanyNameFallback(admin: SupabaseClient, userId: string, profile: BrandComplianceProfile): Promise<{ ok: boolean; error?: string }> {
  const { error } = await admin
    .from("profiles")
    .update({ company_name: `${PROFILE_MARKER}${JSON.stringify(profile)}` })
    .eq("id", userId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function loadRemoteBrandProfile(
  admin: SupabaseClient,
  userId: string,
): Promise<BrandComplianceProfile | null> {
  const fromStorage = await loadFromStorage(admin, userId);
  if (fromStorage) return fromStorage;

  const columnResult = await admin
    .from("profiles")
    .select("brand_compliance_profile")
    .eq("id", userId)
    .maybeSingle();

  if (!columnResult.error && columnResult.data?.brand_compliance_profile) {
    return parseProfile(columnResult.data.brand_compliance_profile);
  }

  return loadFromCompanyNameFallback(admin, userId);
}

export async function saveRemoteBrandProfile(
  admin: SupabaseClient,
  userId: string,
  userEmail: string | undefined,
  fullName: string | undefined,
  profile: BrandComplianceProfile,
): Promise<{ ok: boolean; error?: string; method?: string }> {
  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update({ brand_compliance_profile: profile })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (!updateError && updated) {
    return { ok: true, method: "column" };
  }

  const columnMissing = Boolean(
    updateError?.message?.includes("brand_compliance_profile")
    || updateError?.code === "42703"
    || updateError?.code === "PGRST204",
  );

  if (!columnMissing && !updated) {
    const { error: insertError } = await admin.from("profiles").insert({
      id: userId,
      email: userEmail || null,
      full_name: fullName || "",
      brand_compliance_profile: profile,
    });
    if (!insertError) return { ok: true, method: "insert" };
  }

  const storageResult = await saveToStorage(admin, userId, profile);
  if (storageResult.ok) return { ok: true, method: "storage" };

  const fallbackResult = await saveToCompanyNameFallback(admin, userId, profile);
  if (fallbackResult.ok) return { ok: true, method: "company_name" };

  return {
    ok: false,
    error: storageResult.error || fallbackResult.error || updateError?.message || "Could not save profile.",
  };
}

export async function ensureBrandProfilesBucket(admin: SupabaseClient) {
  const { data: buckets } = await admin.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.name === BUCKET)) return;
  await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 102400 });
}