"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import {
  CHANNEL_OPTIONS,
  COMPLIANCE_LEVEL_OPTIONS,
  CONCERN_OPTIONS,
  EMPTY_ONBOARDING_DRAFT,
  REGION_OPTIONS,
  SECTOR_OPTIONS,
  type OnboardingDraft,
} from "@/components/onboarding/onboarding-config";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import { BRAND_ONBOARDING_ENABLED } from "@/lib/brandProfile";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function BrandProfileSettings() {
  const { profile, loading, saving, updateProfile, isComplete } = useBrandProfile();
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_ONBOARDING_DRAFT);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setDraft({
        brandName: profile.brandName,
        sector: profile.sector,
        productType: profile.productType,
        commonClaims: profile.commonClaims,
        ingredients: profile.ingredients,
        salesRegions: profile.salesRegions,
        salesChannels: profile.salesChannels,
        mainConcern: profile.mainConcern,
        complianceLevel: profile.complianceLevel,
        firstClaim: profile.firstClaim,
      });
    }
  }, [profile]);

  if (!BRAND_ONBOARDING_ENABLED) return null;

  const save = async () => {
    if (!profile) return;
    await updateProfile({
      ...profile,
      ...draft,
      onboardingCompleted: true,
    });
    setMessage("Brand compliance profile updated.");
  };

  const toggleMulti = (field: "salesRegions" | "salesChannels", option: string) => {
    setDraft((prev) => {
      const current = prev[field];
      const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
      return { ...prev, [field]: next };
    });
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading brand profile...</p>;
  }

  if (!isComplete) {
    return (
      <section className="surface p-6 lg:col-span-2">
        <h2 className="font-bold">Brand compliance profile</h2>
        <p className="mt-2 text-sm text-muted">Complete onboarding to personalize your dashboard.</p>
        <Link href="/onboarding" className="primary mt-5">
          Set up profile <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  return (
    <section className="surface p-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Brand compliance profile</h2>
          <p className="mt-1 text-sm text-muted">Edit how ClaimGuard personalizes your dashboard and regulation feed.</p>
        </div>
        <Link href="/onboarding" className="secondary text-sm">Re-run setup</Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Brand name">
          <input className="input" value={draft.brandName} onChange={(e) => setDraft({ ...draft, brandName: e.target.value })} />
        </Field>
        <Field label="Sector">
          <select className="input" value={draft.sector} onChange={(e) => setDraft({ ...draft, sector: e.target.value })}>
            <option value="">Select sector</option>
            {SECTOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Product type">
          <input className="input" value={draft.productType} onChange={(e) => setDraft({ ...draft, productType: e.target.value })} />
        </Field>
        <Field label="Compliance experience">
          <select className="input" value={draft.complianceLevel} onChange={(e) => setDraft({ ...draft, complianceLevel: e.target.value })}>
            <option value="">Select level</option>
            {COMPLIANCE_LEVEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Common marketing claims">
            <textarea className="input min-h-[80px]" value={draft.commonClaims} onChange={(e) => setDraft({ ...draft, commonClaims: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Key ingredients / actives">
            <textarea className="input min-h-[80px]" value={draft.ingredients} onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <span className="label">Sales regions</span>
          <div className="flex flex-wrap gap-2">
            {REGION_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleMulti("salesRegions", option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${draft.salesRegions.includes(option) ? "border-[#14b8a6] bg-mint text-safe" : "border-black/[.08] bg-white"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <span className="label">Sales channels</span>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleMulti("salesChannels", option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${draft.salesChannels.includes(option) ? "border-[#14b8a6] bg-mint text-safe" : "border-black/[.08] bg-white"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <Field label="Main compliance concern">
            <select className="input" value={draft.mainConcern} onChange={(e) => setDraft({ ...draft, mainConcern: e.target.value })}>
              <option value="">Select concern</option>
              {CONCERN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-muted">{message}</p>}
      <button onClick={() => void save()} disabled={saving} className="primary mt-5">
        {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
        Save brand profile
      </button>
    </section>
  );
}