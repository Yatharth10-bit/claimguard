import { ClaimRiskBadge } from "./ClaimRiskBadge";

type CompareAccount = {
  id: string;
  handle: string;
  is_competitor: boolean;
  latest_scan: {
    overall_score: number;
    high_risk_posts_count: number;
    payload?: {
      health_overview?: { compliance_risk: string; estimated_engagement: string };
      engagement?: { engagement_rate_estimate: number | null };
      content_categories?: { category: string; count: number }[];
    };
  } | null;
};

export function CompetitorSocialCompare({ accounts }: { accounts: CompareAccount[] }) {
  const withScan = accounts.filter((a) => a.latest_scan?.payload);
  if (withScan.length < 2) return null;

  const own = withScan.find((a) => !a.is_competitor) || withScan[0];
  const competitors = withScan.filter((a) => a.is_competitor || a.id !== own.id);

  return (
    <section className="surface p-5">
      <h3 className="font-bold">Competitor Instagram intelligence</h3>
      <p className="mt-1 text-xs text-muted">Competitor insights are based on public data only.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider text-muted">
              <th className="py-2 pr-3">Account</th>
              <th className="py-2 pr-3">Health</th>
              <th className="py-2 pr-3">Compliance</th>
              <th className="py-2 pr-3">~Engagement</th>
              <th className="py-2 pr-3">High-risk</th>
              <th className="py-2">Top category</th>
            </tr>
          </thead>
          <tbody>
            {[own, ...competitors].map((a) => {
              const p = a.latest_scan?.payload;
              const topCat = p?.content_categories?.[0]?.category || "—";
              return (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-3 pr-3 font-bold">
                    @{a.handle}
                    {a.is_competitor && <span className="ml-1 text-xs font-normal text-muted">(competitor)</span>}
                  </td>
                  <td className="py-3 pr-3">{a.latest_scan?.overall_score ?? "—"}/100</td>
                  <td className="py-3 pr-3">
                    {p?.health_overview?.compliance_risk ? (
                      <ClaimRiskBadge level={p.health_overview.compliance_risk} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {p?.engagement?.engagement_rate_estimate != null
                      ? `~${p.engagement.engagement_rate_estimate}%`
                      : p?.health_overview?.estimated_engagement || "Unavailable"}
                  </td>
                  <td className="py-3 pr-3">{a.latest_scan?.high_risk_posts_count ?? 0}</td>
                  <td className="py-3">{topCat}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted">
        Gap opportunity: compare competitor claim styles and avoid copying risky phrases — use safer educational angles instead.
      </p>
    </section>
  );
}