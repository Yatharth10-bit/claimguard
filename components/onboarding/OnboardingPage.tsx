"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText, LoaderCircle, ShieldCheck } from "lucide-react";
import { OnboardingFlashcard } from "@/components/onboarding/OnboardingFlashcard";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import {
  EMPTY_ONBOARDING_DRAFT,
  isStepValid,
  ONBOARDING_STEPS,
  type OnboardingDraft,
} from "@/components/onboarding/onboarding-config";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import { BRAND_ONBOARDING_ENABLED } from "@/lib/brandProfile";

export function OnboardingPage() {
  const router = useRouter();
  const { profile, loading, saving, completeOnboarding, isComplete } = useBrandProfile();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_ONBOARDING_DRAFT);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!BRAND_ONBOARDING_ENABLED) {
      router.replace("/dashboard");
      return;
    }
    if (!loading && isComplete) {
      router.replace("/dashboard");
    }
  }, [loading, isComplete, router]);

  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
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

  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;
  const canProceed = isStepValid(step, draft);

  const updateField = (field: keyof OnboardingDraft, value: string | string[]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const goNext = async () => {
    if (!canProceed) {
      setError("Please answer this question to continue.");
      return;
    }
    if (!isLast) {
      setDirection("forward");
      setStepIndex((i) => i + 1);
      return;
    }
    const saved = await completeOnboarding(draft);
    if (!saved || "error" in saved) {
      const detail = saved && "error" in saved ? saved.error : "Unknown error";
      setError(`We saved your answers locally but could not sync them to your account. ${detail}`);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setDirection("back");
    setStepIndex((i) => i - 1);
    setError("");
  };

  const skipStep = () => {
    if (!step.skippable) return;
    setDirection("forward");
    setStepIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1));
  };

  if (!BRAND_ONBOARDING_ENABLED || loading) {
    return (
      <div className="onboarding-shell grid min-h-screen place-items-center bg-stone">
        <LoaderCircle className="animate-spin text-muted" size={28} />
      </div>
    );
  }

  return (
    <div className="onboarding-shell relative min-h-screen overflow-hidden bg-stone px-4 py-8 sm:px-6">
      <div className="onboarding-bg-left" aria-hidden />
      <div className="onboarding-bg-right" aria-hidden />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-[#43dfc6]">
              <ShieldCheck size={16} />
            </span>
            <span className="hidden sm:inline">ClaimGuard</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-muted hover:text-ink">
            Back to home
          </Link>
        </div>

        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#14a995]">Brand Compliance Profile Setup</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-.04em] text-ink sm:text-3xl">
            Set up your Brand Compliance Profile
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
            Answer five quick questions so ClaimGuard can personalize your risk score, regulation feed, and claim checks for your brand.
          </p>
        </div>

        <OnboardingProgress current={stepIndex} total={ONBOARDING_STEPS.length} />

        <div className="mt-8">
          <OnboardingFlashcard step={step} draft={draft} direction={direction} onChange={updateField} />
        </div>

        {error && <p className="mt-4 text-center text-sm text-high">{error}</p>}

        <div className="mx-auto mt-8 flex max-w-xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="secondary w-full sm:w-auto disabled:opacity-40"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {step.skippable && (
              <button type="button" onClick={skipStep} className="text-sm font-semibold text-muted hover:text-ink">
                Skip for now
              </button>
            )}
            <button
              type="button"
              onClick={() => void goNext()}
              disabled={saving}
              className="primary w-full sm:w-auto"
            >
              {saving ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : isLast ? (
                <FileText size={16} />
              ) : (
                <ArrowRight size={16} />
              )}
              {isLast ? "Set up my dashboard" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}