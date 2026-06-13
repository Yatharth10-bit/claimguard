import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

/** Set to false to disable onboarding redirects and dashboard personalization without removing code. */
export const BRAND_ONBOARDING_ENABLED = true;

export type BrandComplianceProfile = {
  brandName: string;
  sector: string;
  productType: string;
  commonClaims: string;
  ingredients: string;
  salesRegions: string[];
  salesChannels: string[];
  mainConcern: string;
  complianceLevel: string;
  firstClaim: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export const EMPTY_BRAND_PROFILE: BrandComplianceProfile = {
  brandName: "",
  sector: "",
  productType: "",
  commonClaims: "",
  ingredients: "",
  salesRegions: [],
  salesChannels: [],
  mainConcern: "",
  complianceLevel: "",
  firstClaim: "",
  onboardingCompleted: false,
  createdAt: "",
  updatedAt: "",
};

const DEV_PROFILE_KEY = "claimguard-brand-profile-dev";

export function profileStorageKey(userId: string) {
  return `claimguard-brand-profile-${userId}`;
}

function readLocalProfile(key: string): BrandComplianceProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return { ...EMPTY_BRAND_PROFILE, ...JSON.parse(stored) };
  } catch {
    return null;
  }
}

function writeLocalProfile(key: string, profile: BrandComplianceProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(profile));
}

export function isOnboardingComplete(profile: BrandComplianceProfile | null): boolean {
  return Boolean(profile?.onboardingCompleted && profile.brandName.trim());
}

export function formatRegionsList(regions: string[]): string {
  if (!regions.length) return "your selected markets";
  if (regions.length === 1) return regions[0];
  if (regions.length === 2) return `${regions[0]} and ${regions[1]}`;
  return `${regions.slice(0, -1).join(", ")}, and ${regions[regions.length - 1]}`;
}

export function sectorLabel(sector: string): string {
  const map: Record<string, string> = {
    Supplements: "supplement",
    "Functional Food": "functional food",
    "Skincare / Cosmetics": "skincare and cosmetics",
    "Wellness Products": "wellness",
    "Herbal / Ayurvedic Products": "herbal and ayurvedic",
    "Amazon / Marketplace Brand": "marketplace",
    "DTC Consumer Brand": "DTC consumer",
    Other: "consumer product",
  };
  return map[sector] || sector.toLowerCase() || "consumer product";
}

export async function resolveUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;
  }
  if (typeof window !== "undefined") {
    try {
      const devUser = localStorage.getItem("claimguard-dev-user");
      if (devUser) return JSON.parse(devUser).email || "dev-user";
    } catch {
      return "dev-user";
    }
  }
  return null;
}

function mergeProfiles(local: BrandComplianceProfile | null, remote: BrandComplianceProfile | null): BrandComplianceProfile | null {
  if (remote?.onboardingCompleted) return { ...EMPTY_BRAND_PROFILE, ...remote };
  if (local?.onboardingCompleted) return { ...EMPTY_BRAND_PROFILE, ...local };
  if (remote?.brandName || remote?.sector) return { ...EMPTY_BRAND_PROFILE, ...remote };
  if (local) return { ...EMPTY_BRAND_PROFILE, ...local };
  return null;
}

function isNewer(left: BrandComplianceProfile, right: BrandComplianceProfile) {
  return new Date(left.updatedAt || 0).getTime() >= new Date(right.updatedAt || 0).getTime();
}

export async function loadBrandProfile(userId?: string | null): Promise<BrandComplianceProfile | null> {
  const id = userId ?? (await resolveUserId());
  const localKey = id ? profileStorageKey(id) : DEV_PROFILE_KEY;
  const local = readLocalProfile(localKey);

  const supabase = getSupabaseBrowser();
  if (!supabase || !id || !isSupabaseConfigured()) {
    return local;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("brand_compliance_profile")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return local;
  }

  const remote = data?.brand_compliance_profile as BrandComplianceProfile | null;
  let best = mergeProfiles(local, remote);

  if (local && remote && local.onboardingCompleted && remote.onboardingCompleted) {
    best = isNewer(local, remote)
      ? { ...EMPTY_BRAND_PROFILE, ...local }
      : { ...EMPTY_BRAND_PROFILE, ...remote };
  }

  if (best) {
    writeLocalProfile(localKey, best);
  }

  if (local?.onboardingCompleted && !remote?.onboardingCompleted) {
    await saveBrandProfile(local, id, { skipRemoteMerge: true });
  }

  return best;
}

export async function saveBrandProfile(
  profile: BrandComplianceProfile,
  userId?: string | null,
  options?: { skipRemoteMerge?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const id = userId ?? (await resolveUserId());
  const localKey = id ? profileStorageKey(id) : DEV_PROFILE_KEY;
  const now = new Date().toISOString();
  const payload: BrandComplianceProfile = {
    ...profile,
    createdAt: profile.createdAt || now,
    updatedAt: now,
  };
  writeLocalProfile(localKey, payload);

  const supabase = getSupabaseBrowser();
  if (!supabase || !id || !isSupabaseConfigured()) {
    return { ok: true };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id,
      email: user?.email || null,
      full_name: String(user?.user_metadata?.full_name || ""),
      brand_compliance_profile: payload,
    }, { onConflict: "id" });

  if (error && !options?.skipRemoteMerge) {
    return { ok: false, error: error.message };
  }

  return { ok: !error };
}

export function getCheckFirstClaimHref(options: {
  isLoggedIn: boolean;
  profile: BrandComplianceProfile | null;
}): string {
  if (!BRAND_ONBOARDING_ENABLED) {
    return options.isLoggedIn ? "/claim-checker" : "/signup?next=%2Fclaim-checker";
  }
  if (!options.isLoggedIn) {
    return "/signup?next=%2Fonboarding";
  }
  if (!isOnboardingComplete(options.profile)) {
    return "/onboarding";
  }
  return "/claim-checker";
}