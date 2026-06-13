"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/contexts/AuthContext";
import {
  BRAND_ONBOARDING_ENABLED,
  EMPTY_BRAND_PROFILE,
  isOnboardingComplete,
  loadBrandProfile,
  saveBrandProfile,
  type BrandComplianceProfile,
} from "@/lib/brandProfile";

export function useBrandProfile() {
  const { user, loading: authLoading } = useAuthSession();
  const [profile, setProfile] = useState<BrandComplianceProfile | null>(null);
  const [loading, setLoading] = useState(BRAND_ONBOARDING_ENABLED);
  const [saving, setSaving] = useState(false);
  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    if (!BRAND_ONBOARDING_ENABLED) {
      setLoading(false);
      return;
    }
    if (authLoading) return;
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const loaded = await loadBrandProfile(userId);
    setProfile(loaded);
    setLoading(false);
  }, [authLoading, userId]);

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
      setSaving(true);
      const result = await saveBrandProfile(next, userId);
      if (result.ok) setProfile(next);
      setSaving(false);
      return result.ok ? next : { error: result.error || "Could not save profile." };
    },
    [profile?.createdAt, userId],
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