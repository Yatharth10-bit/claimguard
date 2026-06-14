import type { BioAnalysis } from "@/lib/socialIntelligence";
import { ClaimRiskBadge } from "./ClaimRiskBadge";

export function BioRiskCard({ bio, label }: { bio: BioAnalysis; label: string }) {
  return (
    <section className="surface p-5">
      <h3 className="font-bold">Bio claim scanner</h3>
      <p className="mt-1 text-xs text-muted">{label}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Bio risk:</span>
        <ClaimRiskBadge level={bio.risk_level} />
        <span className="text-sm text-muted">Score {bio.bio_risk_score} · Clarity {bio.brand_clarity_score}/100</span>
      </div>
      {bio.original_bio && (
        <blockquote className="mt-4 rounded-xl bg-stone p-3 text-sm">{bio.original_bio}</blockquote>
      )}
      {bio.risky_words.length > 0 && (
        <p className="mt-3 text-sm">
          <strong>Risky phrases:</strong> {bio.risky_words.join(", ")}
        </p>
      )}
      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-sm">
        <p className="text-xs font-bold uppercase text-muted">Safer bio rewrite</p>
        <p className="mt-1">{bio.safer_bio_rewrite}</p>
      </div>
      <p className="mt-3 text-xs text-muted">{bio.cta_improvement}</p>
    </section>
  );
}