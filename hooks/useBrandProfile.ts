"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BRAND_ONBOARDING_ENABLED,
  EMPTY_BRAND_PROFILE,
  isOnboardingComplete,
  loadBrandProfile,
  resolveUserId,
  saveBrandProfile,
  type BrandComplianceProfile,
} from "@/lib/brandProfile";

export function useBrandProfile() {
  const [profile, setProfile] = useState<BrandComplianceProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(BRAND_ONBOARDING_ENABLED);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!BRAND_ONBOARDING_ENABLED) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = await resolveUserId();
    setUserId(id);
    const loaded = await loadBrandProfile(id);
    setProfile(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateProfile = useCallback(
    async (next: BrandComplianceProfile) => {
      setSaving(true);
      await saveBrandProfile(next, userId);
      setProfile(next);
      setSaving(false);
    },
    [userId],
  );

  const completeOnboarding = useCallback(
    async (draft: Omit<BrandComplianceProfile, "onboardingCompleted" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const next: BrandComplianceProfile = {
        ...EMPTY_BRAND_PROFILE,
        ...draft,
        onboardingCompleted: true,
        createdAt: profile?.createdAt || now,
        updatedAt: now,
      };
      await updateProfile(next);
      return next;
    },
    [profile?.createdAt, updateProfile],
  );

  return {
    profile,
    loading,
    saving,
    refresh,
    updateProfile,
    completeOnboarding,
    isComplete: isOnboardingComplete(profile),
    enabled: BRAND_ONBOARDING_ENABLED,
  };
}