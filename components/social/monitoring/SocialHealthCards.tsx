import type { ReactNode } from "react";
import type { SocialScanPayload } from "@/lib/socialIntelligence";
import { ClaimRiskBadge } from "./ClaimRiskBadge";

function MetricCard({
  label,
  value,
  note,
  tooltip,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tooltip?: string;
}) {
  return (
    <div className="surface p-4 transition hover:-translate-y-0.5" title={tooltip}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function SocialHealthCards({ scan }: { scan: SocialScanPayload }) {
  const h = scan.health_overview;
  const engTip = "Estimated from public likes, comments, post count, and visible follower count.";
  const complianceScore = h.claim_compliance_score ?? Math.max(0, 100 - h.high_risk_posts_count * 18);
  const captionRisk = h.caption_risk ?? h.compliance_risk;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <MetricCard label="Social health" value={`${h.overall_social_health}/100`} tooltip={engTip} />
      <MetricCard
        label="Claim compliance"
        value={<ClaimRiskBadge level={h.compliance_risk} />}
        note={`Score ~${complianceScore}/100`}
      />
      <MetricCard label="Bio risk" value={<ClaimRiskBadge level={h.bio_claim_risk} />} />
      <MetricCard label="Caption risk" value={<ClaimRiskBadge level={captionRisk} />} />
      <MetricCard
        label="Est. engagement"
        value={h.estimated_engagement === "Unavailable" ? "—" : `~${h.estimated_engagement}`}
        tooltip={engTip}
        note="Public data only"
      />
      <MetricCard label="High-risk posts" value={h.high_risk_posts_count} />
      <MetricCard label="Consistency" value={`${h.content_consistency_score}/100`} />
      <MetricCard
        label="Last scan"
        value={scan.account_overview?.last_scanned_label ?? "Recent"}
        note={scan.account_overview?.scan_status ?? "completed"}
      />
    </div>
  );
}