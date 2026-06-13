import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { BRAND_ONBOARDING_ENABLED, isOnboardingComplete } from "@/lib/brandProfile";

/** Allow only same-origin relative paths (blocks open redirects). */
export function sanitizeRedirectPath(next?: string | null): string | null {
  if (!next) return null;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("://") || trimmed.includes("\\")) return null;
  return trimmed;
}

export function postAuthPath(
  profile: BrandComplianceProfile | null,
  options?: { next?: string | null; signup?: boolean },
): string {
  const safeNext = sanitizeRedirectPath(options?.next);
  if (safeNext) return safeNext;
  if (!BRAND_ONBOARDING_ENABLED) return "/dashboard";
  if (options?.signup) return "/onboarding";
  return isOnboardingComplete(profile) ? "/dashboard" : "/onboarding";
}

export function profileFromRow(row: { brand_compliance_profile?: unknown } | null | undefined): BrandComplianceProfile | null {
  if (!row?.brand_compliance_profile || typeof row.brand_compliance_profile !== "object") return null;
  return row.brand_compliance_profile as BrandComplianceProfile;
}

export function onboardingCompleteFromRow(row: { brand_compliance_profile?: unknown } | null | undefined): boolean {
  return isOnboardingComplete(profileFromRow(row));
}