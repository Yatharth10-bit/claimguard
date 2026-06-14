"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, Instagram, LoaderCircle, Plus, ScanText,
  Sparkles, Upload, X,
} from "lucide-react";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import type { SocialScanPayload } from "@/lib/socialIntelligence";

type Account = {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  is_competitor: boolean;
  latest_scan: {
    id: string;
    overall_score: number;
    high_risk_posts_count: number;
    payload?: SocialScanPayload;
  } | null;
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "reddit", label: "Reddit" },
  { id: "x", label: "X.com" },
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
] as const;

const riskStyles: Record<string, string> = {
  "High Risk": "bg-rose text-high",
  "Medium Risk": "bg-apricot text-medium",
  "Low Risk": "bg-mint text-safe",
  Safe: "bg-emerald-50 text-safe",
};

function HealthCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="surface p-4 transition hover:-translate-y-0.5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

function ScanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="surface animate-pulse p-5">
          <div className="h-4 w-1/2 rounded bg-stone" />
          <div className="mt-3 h-8 w-1/3 rounded bg-stone" />
        </div>
      ))}
    </div>
  );
}

export function SocialIntelligenceLitePage() {
  const { profile, isComplete } = useBrandProfile();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeScan, setActiveScan] = useState<SocialScanPayload | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [tab, setTab] = useState<"url" | "manual">("url");

  const [form, setForm] = useState({
    input: "",
    platform: "instagram" as string,
    is_competitor: false,
    bio: "",
    follower_count: "",
    captions: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/social-intelligence");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load");
      setAccounts(body.accounts || []);
      setMigrationRequired(Boolean(body.migration_required));
      const withScan = (body.accounts || []).find((a: Account) => a.latest_scan?.payload);
      if (withScan?.latest_scan?.payload) {
        setActiveScan(withScan.latest_scan.payload as SocialScanPayload);
        setActiveAccount(withScan);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addAccount = async () => {
    if (!form.input.trim()) {
      setError("Enter a profile URL or handle.");
      return;
    }
    setScanning(true);
    setError("");
    try {
      const accRes = await fetch("/api/social-intelligence/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: form.input,
          platform: form.input.startsWith("http") ? undefined : form.platform,
          is_competitor: form.is_competitor,
        }),
      });
      const accBody = await accRes.json();
      if (!accRes.ok) throw new Error(accBody.error || "Failed to add account");

      const manualPosts = form.captions
        .split(/\n---\n|\n\n(?=[A-Z])/)
        .map((c) => c.trim())
        .filter((c) => c.length > 5)
        .map((caption) => ({ caption, post_url: "", visible_likes: null, visible_comments: null }));

      const scanRes = await fetch("/api/social-intelligence/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accBody.account.id,
          bio: form.bio,
          follower_count_public: form.follower_count ? Number(form.follower_count) : null,
          manual_posts: manualPosts,
          try_public_fetch: tab === "url" && manualPosts.length === 0,
        }),
      });
      const scanBody = await scanRes.json();
      if (!scanRes.ok) {
        if (scanRes.status === 422) {
          setError(scanBody.error || "Paste bio and captions manually.");
          setTab("manual");
          return;
        }
        throw new Error(scanBody.error || "Scan failed");
      }

      setActiveScan(scanBody.payload);
      setActiveAccount({ ...accBody.account, latest_scan: scanBody.scan });
      setModalOpen(false);
      setForm({ input: "", platform: "instagram", is_competitor: false, bio: "", follower_count: "", captions: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const selectAccount = (account: Account) => {
    setActiveAccount(account);
    setActiveScan((account.latest_scan?.payload as SocialScanPayload) || null);
  };

  const scan = activeScan;
  const health = scan?.health_overview;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
        <p className="font-bold text-ink">Free public scan · Social Intelligence Lite</p>
        <p className="mt-1 text-muted">
          Estimated from visible public data only. No paid APIs. Connect APIs later for deeper analytics.
          {isComplete && profile?.sector ? ` Personalized for ${profile.sector} brands.` : ""}
        </p>
      </div>

      {migrationRequired && (
        <div className="surface border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-bold">Database migration needed</p>
          <p className="mt-1 text-muted">Run <code className="text-xs">supabase/social-intelligence-lite.sql</code> in Supabase SQL Editor. Manual paste still works after migration.</p>
        </div>
      )}

      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">AI-powered social claim audit and content improvement — public data only.</p>
        <button type="button" className="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add social account
        </button>
      </div>

      {loading ? (
        <ScanSkeleton />
      ) : (
        <>
          {accounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => selectAccount(a)}
                  className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${activeAccount?.id === a.id ? "bg-ink text-white" : "bg-stone text-muted hover:text-ink"}`}
                >
                  {a.platform} @{a.handle}{a.is_competitor ? " · competitor" : ""}
                </button>
              ))}
            </div>
          )}

          {!scan && accounts.length === 0 && (
            <div className="surface p-10 text-center">
              <Instagram size={36} className="mx-auto text-muted" />
              <h3 className="mt-4 text-lg font-bold">Start your free social claim scan</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Paste a public Instagram, YouTube, or Reddit profile link for automatic fetch.
                TikTok, X, Facebook, and LinkedIn still need manual paste if auto-fetch fails.
              </p>
              <button type="button" className="primary mt-6" onClick={() => setModalOpen(true)}>
                <ScanText size={16} /> Run free public scan
              </button>
              {!isComplete && (
                <p className="mt-4 text-xs text-muted">
                  <Link href="/onboarding" className="font-semibold text-lavender">Complete onboarding</Link> for sector-specific claim detection.
                </p>
              )}
            </div>
          )}

          {scan && health && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{scan.estimated_label}</p>

              <section>
                <h3 className="mb-3 font-bold">Social health overview</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <HealthCard label="Overall social health" value={`${health.overall_social_health}/100`} />
                  <HealthCard label="Compliance risk" value={health.compliance_risk} />
                  <HealthCard label="Est. engagement" value={health.estimated_engagement} note="Public data only" />
                  <HealthCard label="Content consistency" value={`${health.content_consistency_score}/100`} />
                  <HealthCard label="Bio claim risk" value={health.bio_claim_risk} />
                  <HealthCard label="High-risk posts" value={health.high_risk_posts_count} />
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="surface p-5">
                  <h3 className="font-bold">Bio scanner</h3>
                  <p className="mt-1 text-xs text-muted">{scan.estimated_label}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted">Bio risk score:</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${riskStyles[scan.bio.risk_level] || ""}`}>
                      {scan.bio.risk_level} ({scan.bio.bio_risk_score})
                    </span>
                    <span className="text-sm text-muted">Clarity: {scan.bio.brand_clarity_score}/100</span>
                  </div>
                  {scan.bio.original_bio && (
                    <blockquote className="mt-4 rounded-xl bg-stone p-3 text-sm">{scan.bio.original_bio}</blockquote>
                  )}
                  {scan.bio.risky_words.length > 0 && (
                    <p className="mt-3 text-sm"><strong>Risky words:</strong> {scan.bio.risky_words.join(", ")}</p>
                  )}
                  <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-sm">
                    <p className="text-xs font-bold uppercase text-muted">Safer bio rewrite</p>
                    <p className="mt-1">{scan.bio.safer_bio_rewrite}</p>
                  </div>
                  <p className="mt-3 text-xs text-muted">{scan.bio.cta_improvement}</p>
                </section>

                <section className="surface p-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-lavender" />
                    <h3 className="font-bold">Estimated engagement</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted">{scan.engagement.engagement_note}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted">Avg likes</span><p className="font-bold">{scan.engagement.avg_likes ?? "—"}</p></div>
                    <div><span className="text-muted">Avg comments</span><p className="font-bold">{scan.engagement.avg_comments ?? "—"}</p></div>
                    <div className="col-span-2">
                      <span className="text-muted">Engagement rate estimate</span>
                      <p className="font-bold">{scan.engagement.engagement_rate_estimate != null ? `${scan.engagement.engagement_rate_estimate}%` : "Unavailable"}</p>
                    </div>
                  </div>
                  {scan.engagement.best_posts.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-muted">Top visible posts</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted">{scan.engagement.best_posts.map((p, i) => <li key={i}>· {p}</li>)}</ul>
                    </div>
                  )}
                </section>
              </div>

              <section className="surface p-5">
                <h3 className="font-bold">Content category analysis</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {scan.content_categories.map((c) => (
                    <span key={c.category} className="rounded-full bg-stone px-3 py-1 text-xs font-bold">
                      {c.category}: {c.count}
                    </span>
                  ))}
                </div>
                {scan.missing_categories.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    {scan.missing_categories.map((m) => <li key={m}>→ {m}</li>)}
                  </ul>
                )}
              </section>

              <section className="surface overflow-hidden p-5">
                <h3 className="font-bold">Public post analysis</h3>
                <p className="mt-1 text-xs text-muted">{scan.estimated_label}</p>
                {scan.posts.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">No posts analyzed. Paste captions in a new scan.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wider text-muted">
                          <th className="py-2 pr-3">Platform</th>
                          <th className="py-2 pr-3">Caption</th>
                          <th className="py-2 pr-3">Likes</th>
                          <th className="py-2 pr-3">Comments</th>
                          <th className="py-2 pr-3">Risk</th>
                          <th className="py-2">Safer rewrite</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scan.posts.map((post, i) => (
                          <tr key={i} className="border-b border-slate-100 align-top">
                            <td className="py-3 pr-3 capitalize">{post.platform}</td>
                            <td className="max-w-xs py-3 pr-3">{post.caption_preview}</td>
                            <td className="py-3 pr-3">{post.visible_likes ?? "—"}</td>
                            <td className="py-3 pr-3">{post.visible_comments ?? "—"}</td>
                            <td className="py-3 pr-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${riskStyles[post.risk_level]}`}>{post.risk_level}</span>
                            </td>
                            <td className="py-3 text-xs text-muted">{post.safer_rewrite.slice(0, 120)}…</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {scan.posts.some((p) => p.risky_phrases.length > 0) && (
                <section className="surface p-5">
                  <h3 className="font-bold">Claim risk detection</h3>
                  <div className="mt-4 space-y-3">
                    {scan.posts.flatMap((p) => p.risky_phrases).slice(0, 12).map((r, i) => (
                      <div key={i} className="rounded-xl bg-stone p-4 text-sm">
                        <p className="font-bold">{r.phrase}</p>
                        <p className="mt-1 text-muted">{r.why}</p>
                        <p className="mt-2 text-safe"><strong>Safer:</strong> {r.safer}</p>
                        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${riskStyles[r.severity === "high" ? "High Risk" : r.severity === "medium" ? "Medium Risk" : "Low Risk"]}`}>{r.severity}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="surface p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#14a995]" />
                    <h3 className="font-bold">AI improvement suggestions</h3>
                  </div>
                  <ul className="mt-4 space-y-4">
                    {scan.insights.map((ins, i) => (
                      <li key={i} className="text-sm">
                        <p className="font-bold">{ins.title}</p>
                        <p className="mt-1 text-muted">{ins.description}</p>
                        <p className="mt-2 text-xs font-semibold text-lavender">{ins.action}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="surface p-5">
                  <h3 className="font-bold">Weekly content ideas</h3>
                  <p className="mt-1 text-xs text-muted">Based on your sector and scan results · compliance-safe angles</p>
                  <div className="mt-4 space-y-4">
                    {scan.weekly_ideas.slice(0, 5).map((idea, i) => (
                      <div key={i} className="rounded-xl border border-slate-100 p-4 text-sm">
                        <p className="font-bold">{idea.title}</p>
                        <p className="mt-1 text-xs text-muted">{idea.format} · {idea.compliance_angle}</p>
                        <p className="mt-2"><strong>Hook:</strong> {idea.hook}</p>
                        <p className="mt-1 text-muted">{idea.caption_direction}</p>
                        <p className="mt-2 text-xs font-semibold">CTA: {idea.cta}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {scan.competitor_note && (
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-stone p-4 text-sm text-muted">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  {scan.competitor_note}
                </div>
              )}

              <Link href="/claim-checker" className="secondary inline-flex">
                Deep-check a caption in Claim Checker <ArrowRight size={16} />
              </Link>
            </>
          )}
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center" onClick={() => setModalOpen(false)}>
          <div className="surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Free public scan</h3>
                <p className="mt-1 text-xs text-muted">Public data only · estimated analytics</p>
              </div>
              <button type="button" className="secondary !px-2.5 !py-2" onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className={tab === "url" ? "primary" : "secondary"} onClick={() => setTab("url")}>Profile link</button>
              <button type="button" className={tab === "manual" ? "primary" : "secondary"} onClick={() => setTab("manual")}>Manual paste</button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">{tab === "url" ? "Profile URL or @handle" : "Handle (for labeling)"}</label>
                <input className="input" value={form.input} onChange={(e) => setForm({ ...form, input: e.target.value })} placeholder="https://instagram.com/brand or @brand" />
              </div>
              {tab === "url" && !form.input.startsWith("http") && (
                <div>
                  <label className="label">Platform</label>
                  <select className="input" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                    {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_competitor} onChange={(e) => setForm({ ...form, is_competitor: e.target.checked })} />
                Competitor account
              </label>
              {(tab === "manual" || form.bio || form.captions) && (
                <>
                  <div>
                    <label className="label">Bio / profile description</label>
                    <textarea className="input min-h-20 resize-none" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Paste profile bio..." />
                  </div>
                  <div>
                    <label className="label">Public follower count (optional)</label>
                    <input className="input" type="number" value={form.follower_count} onChange={(e) => setForm({ ...form, follower_count: e.target.value })} placeholder="Only if publicly visible" />
                  </div>
                  <div>
                    <label className="label">Captions (one per block, separate with blank line)</label>
                    <textarea className="input min-h-40 resize-none font-mono text-sm" value={form.captions} onChange={(e) => setForm({ ...form, captions: e.target.value })} placeholder={"Post 1 caption...\n\nPost 2 caption..."} />
                  </div>
                </>
              )}
              {tab === "manual" && (
                <p className="text-xs text-muted">
                  <Upload size={12} className="inline" /> Paste bio + captions when auto-fetch is unavailable.
                </p>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" className="primary" disabled={scanning} onClick={() => void addAccount()}>
                {scanning ? <LoaderCircle size={16} className="animate-spin" /> : <ScanText size={16} />}
                {scanning ? "Scanning..." : "Run scan"}
              </button>
              <button type="button" className="secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}