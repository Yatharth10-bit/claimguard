"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, LoaderCircle, Plus, ScanText, Sparkles, Target, TrendingUp,
} from "lucide-react";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import { EMPTY_BRAND_PROFILE } from "@/lib/brandProfile";
import { SECTOR_OPTIONS } from "@/components/onboarding/onboarding-config";
import type { CompetitorSuggestion } from "@/lib/competitorSuggestions";
import type { SectorInsight } from "@/lib/competitorInsights";

type Competitor = {
  id: string;
  brand_name: string;
  website_url: string | null;
  amazon_asin: string | null;
  latest_snapshot: {
    claims_found: { text: string; risk: string }[];
    high_risk_claims: { text: string }[];
    changed_from_previous: boolean;
    captured_at: string;
  } | null;
};

type InsightsPayload = {
  onboardingComplete: boolean;
  profile: { brandName: string; sector: string; mainConcern: string } | null;
  sectorInsight: SectorInsight;
  suggestions: CompetitorSuggestion[];
  comparison: {
    yourRiskLevel: string;
    competitorClaimStyle: string;
    complianceGap: string;
    marketingAggressivenessScore: number;
    saferOpportunities: string[];
    commonRiskyWords: string[];
    estimated: boolean;
  };
  recommendedAction: string;
  trackedCount: number;
  estimated: boolean;
};

const riskBadge: Record<string, string> = {
  high: "bg-rose text-high",
  medium: "bg-apricot text-medium",
  low: "bg-mint text-safe",
  unknown: "bg-stone text-muted",
};

function InsightsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="surface animate-pulse p-5">
          <div className="h-4 w-1/3 rounded bg-stone" />
          <div className="mt-4 h-8 w-2/3 rounded bg-stone" />
          <div className="mt-3 h-16 rounded bg-stone" />
        </div>
      ))}
    </div>
  );
}

export function CompetitorsPage() {
  const { profile, isComplete, updateProfile } = useBrandProfile();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [insights, setInsights] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [scanContent, setScanContent] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ brand_name: "", website_url: "", amazon_asin: "" });
  const [manualSector, setManualSector] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/competitors");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load competitors");
      setCompetitors(body.competitors || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/competitors/insights");
      if (!res.ok) return;
      const body = await res.json();
      setInsights(body);
    } catch {
      // non-fatal
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadInsights();
  }, [load, loadInsights]);

  const addCompetitor = async (prefill?: Partial<typeof form>) => {
    const data = { ...form, ...prefill };
    if (!data.brand_name.trim()) {
      setError("Brand name is required.");
      return;
    }
    if (!data.website_url?.trim() && !data.amazon_asin?.trim()) {
      setError("Provide a website URL or Amazon ASIN.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: data.brand_name,
          website_url: data.website_url || null,
          amazon_asin: data.amazon_asin || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add");
      setForm({ brand_name: "", website_url: "", amazon_asin: "" });
      setShowForm(false);
      await load();
      await loadInsights();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const scanCompetitor = async (id: string) => {
    const content = scanContent[id]?.trim();
    if (!content || content.length < 30) {
      setError("Paste at least 30 characters of competitor copy to scan.");
      return;
    }
    setScanningId(id);
    setError("");
    try {
      const res = await fetch(`/api/competitors/${id}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_content: content, source: "website" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Scan failed");
      setScanContent((prev) => ({ ...prev, [id]: "" }));
      await load();
      await loadInsights();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanningId(null);
    }
  };

  const applyManualSector = async () => {
    if (!manualSector) return;
    await updateProfile({ ...(profile || EMPTY_BRAND_PROFILE), sector: manualSector, updatedAt: new Date().toISOString() });
    await loadInsights();
  };

  const needsSector = !profile?.sector || profile.sector === "Other";
  const sectorInsight = insights?.sectorInsight;
  const comparison = insights?.comparison;
  const suggestions = insights?.suggestions || [];

  return (
    <div className="space-y-6">
      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}

      {!isComplete && (
        <div className="surface border border-emerald-100 bg-emerald-50/60 p-6 text-center sm:text-left">
          <h3 className="font-bold">Complete onboarding to unlock competitor insights</h3>
          <p className="mt-2 text-sm text-muted">We personalize competitor analytics from your brand sector, channels, and compliance goals.</p>
          <Link href="/onboarding" className="primary mt-4 inline-flex">Personalize my dashboard <ArrowRight size={16} /></Link>
        </div>
      )}

      {needsSector && isComplete && (
        <div className="surface p-5">
          <h3 className="font-bold">Select your industry</h3>
          <p className="mt-1 text-sm text-muted">Choose a sector to generate sample competitor analytics and suggestions.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <select className="input max-w-xs" value={manualSector} onChange={(e) => setManualSector(e.target.value)}>
              <option value="">Select industry</option>
              {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" className="primary" disabled={!manualSector} onClick={() => void applyManualSector()}>Apply</button>
          </div>
        </div>
      )}

      {insightsLoading ? (
        <InsightsSkeleton />
      ) : sectorInsight && comparison && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Estimated sector insights{insights?.estimated ? " · generated from industry benchmarks" : ""}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="surface p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Your claim risk</p>
              <p className="mt-2 text-2xl font-extrabold capitalize">{comparison.yourRiskLevel}</p>
              <p className="mt-2 text-sm text-muted">{comparison.complianceGap}</p>
            </div>
            <div className="surface p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Competitor claim style</p>
              <p className="mt-2 text-sm leading-6">{comparison.competitorClaimStyle}</p>
            </div>
            <div className="surface p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Marketing aggressiveness</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-extrabold">{comparison.marketingAggressivenessScore}</span>
                <span className="pb-1 text-sm text-muted">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-muted">{sectorInsight.marketingAggressivenessNote}</p>
            </div>
            <div className="surface p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Recommended next step</p>
              <p className="mt-2 text-sm leading-6">{insights?.recommendedAction}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="surface p-5">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-lavender" />
                <h3 className="font-bold">Sector analytics — {sectorInsight.sector}</h3>
              </div>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-muted">Common claim mistakes</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
                    {sectorInsight.commonMistakes.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-muted">High-risk categories</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sectorInsight.highRiskCategories.map((c) => (
                      <span key={c} className="rounded-full bg-rose/10 px-3 py-1 text-xs font-bold text-high">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-muted">Channel risks</p>
                  <p className="mt-1 text-muted"><strong>Website:</strong> {sectorInsight.channelRisks.website}</p>
                  <p className="mt-1 text-muted"><strong>Ads:</strong> {sectorInsight.channelRisks.ads}</p>
                  <p className="mt-1 text-muted"><strong>Influencer:</strong> {sectorInsight.channelRisks.influencer}</p>
                </div>
              </div>
            </section>

            <section className="surface p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#14a995]" />
                <h3 className="font-bold">Personalized recommendations</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                {sectorInsight.recommendations.map((r) => (
                  <li key={r} className="flex gap-2">
                    <TrendingUp size={16} className="mt-0.5 shrink-0 text-[#14a995]" />
                    {r}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Risky words in this sector</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {comparison.commonRiskyWords.map((w) => (
                    <span key={w} className="rounded-full bg-stone px-2.5 py-1 text-xs font-semibold">{w}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Safer wording opportunities</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {comparison.saferOpportunities.map((w) => (
                    <span key={w} className="rounded-full bg-mint/30 px-2.5 py-1 text-xs font-semibold text-safe">{w}</span>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {suggestions.length > 0 && (
        <section className="surface p-5">
          <h3 className="font-bold">Suggested competitors for {profile?.sector || sectorInsight?.sector || "your sector"}</h3>
          <p className="mt-1 text-sm text-muted">Benchmark claim style against category leaders. Insights are estimated until you scan their copy.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {suggestions.map((s) => (
              <div key={s.brand_name} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{s.brand_name}</p>
                    <p className="mt-1 text-xs text-muted">{s.rationale}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-stone px-2 py-0.5 text-[10px] font-bold uppercase">{s.claim_style}</span>
                </div>
                <button
                  type="button"
                  className="secondary mt-3 !py-1.5 text-xs"
                  disabled={saving}
                  onClick={() => void addCompetitor({ brand_name: s.brand_name, website_url: s.website_url || "", amazon_asin: s.amazon_asin || "" })}
                >
                  <Plus size={14} /> Track competitor
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <p className="text-sm text-muted">
          {insights?.trackedCount ? `${insights.trackedCount} competitor(s) tracked` : "Track brands and scan their marketing copy"}
        </p>
        <button type="button" className="primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add competitor</button>
      </div>

      {showForm && (
        <div className="surface space-y-4 p-5">
          <h3 className="font-bold">New competitor</h3>
          <div>
            <label className="label">Brand name</label>
            <input className="input" value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Website URL</label>
            <input className="input" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
          </div>
          <div>
            <label className="label">Amazon ASIN (optional)</label>
            <input className="input" value={form.amazon_asin} onChange={(e) => setForm({ ...form, amazon_asin: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="primary" disabled={saving} onClick={() => void addCompetitor()}>
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : null} Save
            </button>
            <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="surface flex items-center gap-2 p-8 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" /> Loading tracked competitors...</div>
      ) : competitors.length === 0 ? (
        <div className="surface p-10 text-center">
          <Target size={32} className="mx-auto text-muted" />
          <h3 className="mt-4 font-bold">No competitors tracked yet</h3>
          <p className="mt-2 text-sm text-muted">Add a suggested competitor above or paste a brand URL to start benchmarking.</p>
          <button type="button" className="primary mt-5" onClick={() => setShowForm(true)}>Add your first competitor</button>
        </div>
      ) : (
        <div className="grid gap-5">
          {competitors.map((comp) => (
            <div key={comp.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{comp.brand_name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {comp.website_url || comp.amazon_asin || "No URL"}
                    {comp.latest_snapshot && (
                      <span className="ml-2">
                        · Last scan {new Date(comp.latest_snapshot.captured_at).toLocaleDateString()}
                        {comp.latest_snapshot.changed_from_previous ? " · Changed" : ""}
                      </span>
                    )}
                  </p>
                </div>
                {comp.latest_snapshot && (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${comp.latest_snapshot.high_risk_claims?.length ? "bg-rose text-high" : "bg-mint text-safe"}`}>
                    {comp.latest_snapshot.high_risk_claims?.length || 0} high-risk claims
                  </span>
                )}
              </div>
              {comp.latest_snapshot?.claims_found?.length ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {comp.latest_snapshot.claims_found.slice(0, 5).map((claim, i) => (
                    <li key={i} className="rounded-xl bg-stone p-3">
                      <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-bold capitalize ${riskBadge[claim.risk] || riskBadge.unknown}`}>{claim.risk}</span>
                      {claim.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">Paste competitor homepage or Amazon copy below to scan claims.</p>
              )}
              <div className="mt-4">
                <label className="label">Paste competitor copy to scan</label>
                <textarea
                  className="input min-h-24 resize-none"
                  value={scanContent[comp.id] || ""}
                  onChange={(e) => setScanContent((prev) => ({ ...prev, [comp.id]: e.target.value }))}
                  placeholder="Paste website hero copy, Amazon bullets, or ad text..."
                />
              </div>
              <button
                type="button"
                className="secondary mt-3"
                disabled={scanningId === comp.id}
                onClick={() => void scanCompetitor(comp.id)}
              >
                {scanningId === comp.id ? <LoaderCircle size={16} className="animate-spin" /> : <ScanText size={16} />}
                Scan copy
              </button>
            </div>
          ))}
        </div>
      )}

      {sectorInsight && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-sm text-muted">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-medium" />
          <p>Sector benchmarks and competitor suggestions are <strong>estimated insights</strong> based on your industry — not live scraped data. Scan pasted copy for claim-level analysis.</p>
        </div>
      )}
    </div>
  );
}