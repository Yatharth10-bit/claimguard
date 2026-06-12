"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardCheck, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import { RegressionCoverageBadge } from "@/components/claim-checker/RegressionCoverageBadge";
import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { formatRegionsList, sectorLabel } from "@/lib/brandProfile";
import {
  analyzeFirstClaimPreview,
  getPersonalizedRegulationFeed,
  getSectorRiskCards,
  riskCardToneClass,
} from "@/lib/personalizedDashboard";

type PersonalizedHeaderProps = {
  profile: BrandComplianceProfile;
};

export function PersonalizedDashboardHeader({ profile }: PersonalizedHeaderProps) {
  return {
    title: `Welcome, ${profile.brandName}`,
    subtitle: `Your compliance dashboard is personalized for ${sectorLabel(profile.sector)} brands selling in ${formatRegionsList(profile.salesRegions)}.`,
  };
}

type PersonalizedSectionsProps = {
  profile: BrandComplianceProfile;
};

export function PersonalizedDashboardSections({ profile }: PersonalizedSectionsProps) {
  const riskCards = getSectorRiskCards(profile);
  const regulationFeed = getPersonalizedRegulationFeed(profile);
  const firstClaim = analyzeFirstClaimPreview(profile);
  const prominent = riskCards.filter((card) => card.prominent);
  const regular = riskCards.filter((card) => !card.prominent);

  return (
    <div className="personalized-dashboard-layer mb-8 space-y-5">
      <RegressionCoverageBadge />
      {firstClaim && (
        <section className={`surface overflow-hidden border-l-4 p-5 sm:p-6 ${firstClaim.riskLevel === "high" ? "border-l-high" : firstClaim.riskLevel === "medium" ? "border-l-medium" : "border-l-safe"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#14a995]">Your first claim check</p>
              <h2 className="mt-2 font-bold">First claim review</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${firstClaim.riskLevel === "high" ? "bg-rose text-high" : firstClaim.riskLevel === "medium" ? "bg-apricot text-medium" : "bg-mint text-safe"}`}>
              {firstClaim.riskLabel}
            </span>
          </div>
          <blockquote className="mt-4 rounded-xl bg-stone p-4 text-sm font-semibold leading-6 text-ink">
            &ldquo;{firstClaim.claim}&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-muted"><strong className="text-ink">Why:</strong> {firstClaim.reason}</p>
          <p className="mt-2 text-sm text-muted"><strong className="text-ink">Safer rewrite:</strong> {firstClaim.saferRewrite}</p>
          <Link href="/claim-checker" className="primary mt-5">
            Review this claim <ArrowRight size={16} />
          </Link>
        </section>
      )}

      {prominent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-high" />
            <h2 className="font-bold">Priority for your concern</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {prominent.map((card) => (
              <div key={card.id} className="surface border border-amber-100 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <span className={`mb-3 inline-grid h-8 w-8 place-items-center rounded-lg ${riskCardToneClass(card.tone)}`}>
                  <ShieldCheck size={15} />
                </span>
                <h3 className="font-bold">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold">Personalized risk cards</h2>
            <p className="mt-1 text-xs text-muted">Tailored to {profile.sector || "your sector"} and sales channels</p>
          </div>
          <Link href="/claim-checker" className="text-sm font-semibold text-lavender">Run a check <Sparkles size={14} className="inline" /></Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {regular.slice(0, 6).map((card) => (
            <div key={card.id} className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className={`mb-3 inline-grid h-8 w-8 place-items-center rounded-lg ${riskCardToneClass(card.tone)}`}>
                <ClipboardCheck size={15} />
              </span>
              <h3 className="font-bold">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Landmark size={18} className="text-lavender" />
          <div>
            <h2 className="font-bold">Regulation feed for your brand</h2>
            <p className="mt-1 text-xs text-muted">Placeholder updates matched to your regions and channels</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {regulationFeed.map((item) => (
            <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span className="shrink-0 rounded-full bg-lilac px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-lavender">{item.tag}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">{item.organization}</p>
                <p className="mt-1 text-sm font-bold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{item.summary}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/regulations" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-lavender">
          View all regulations <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}