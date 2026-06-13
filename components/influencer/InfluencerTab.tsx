"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, LoaderCircle, Plus, ScanText, WandSparkles } from "lucide-react";

type Brief = {
  id: string;
  platform: string;
  campaign_name: string;
  generated_brief_text: string;
  created_at: string;
};

type Review = {
  id: string;
  influencer_handle: string | null;
  overall_risk: string;
  issues: { line: number; phrase: string; severity: string; suggestion: string }[];
  clean_script: string;
  created_at: string;
};

const riskStyles: Record<string, string> = {
  high: "bg-rose text-high",
  medium: "bg-apricot text-medium",
  low: "bg-mint text-safe",
};

export function InfluencerTab({ productId }: { productId: string }) {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [campaign, setCampaign] = useState("");
  const [script, setScript] = useState("");
  const [handle, setHandle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [briefRes, reviewRes] = await Promise.all([
        fetch(`/api/products/${productId}/influencer-briefs`),
        fetch(`/api/influencer-script-reviews?product_id=${productId}`),
      ]);
      const briefBody = await briefRes.json();
      const reviewBody = await reviewRes.json();
      if (!briefRes.ok) throw new Error(briefBody.error || "Failed to load briefs");
      if (!reviewRes.ok) throw new Error(reviewBody.error || "Failed to load reviews");
      setBriefs(briefBody.briefs || []);
      setReviews(reviewBody.reviews || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const generateBrief = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/influencer-briefs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, campaign_name: campaign }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to generate brief");
      setCampaign("");
      await load();
      setSelectedBrief(body.brief);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate brief");
    } finally {
      setGenerating(false);
    }
  };

  const reviewScript = async () => {
    if (script.trim().length < 10) {
      setError("Paste at least a few lines of script to review.");
      return;
    }
    setReviewing(true);
    setError("");
    try {
      const res = await fetch("/api/influencer-script-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          raw_script: script,
          influencer_handle: handle || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Review failed");
      setScript("");
      await load();
      setSelectedReview(body.review);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setReviewing(false);
    }
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  if (selectedBrief) {
    return (
      <div className="space-y-5">
        <button type="button" className="secondary" onClick={() => setSelectedBrief(null)}>← Back</button>
        <div className="surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Influencer brief</p>
              <h3 className="mt-1 text-lg font-bold">{selectedBrief.campaign_name || selectedBrief.platform}</h3>
            </div>
            <button type="button" className="secondary" onClick={() => void copyText(selectedBrief.generated_brief_text)}>
              <Copy size={16} /> Copy brief
            </button>
          </div>
          <pre className="mt-6 whitespace-pre-wrap rounded-xl bg-stone p-4 text-sm leading-6">{selectedBrief.generated_brief_text}</pre>
        </div>
      </div>
    );
  }

  if (selectedReview) {
    const issues = selectedReview.issues || [];
    return (
      <div className="space-y-5">
        <button type="button" className="secondary" onClick={() => setSelectedReview(null)}>← Back</button>
        <div className="surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Script review</p>
              <h3 className="mt-1 text-lg font-bold">{selectedReview.influencer_handle || "Influencer script"}</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${riskStyles[selectedReview.overall_risk] || riskStyles.low}`}>
              {selectedReview.overall_risk} risk
            </span>
          </div>
          {issues.length > 0 && (
            <div className="mt-6 space-y-3">
              {issues.map((issue, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4 text-sm">
                  <p className="font-medium">Line {issue.line}: {issue.phrase}</p>
                  <p className="mt-1 text-muted">{issue.suggestion}</p>
                  <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${riskStyles[issue.severity]}`}>{issue.severity}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Safer rewrite</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-stone p-4 text-sm leading-6">{selectedReview.clean_script}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}

      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Generate influencer brief</h3>
            <p className="mt-1 text-sm text-muted">FTC-safe do/don&apos;t say lists and required disclaimers.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Platform</label>
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div>
            <label className="label">Campaign name (optional)</label>
            <input className="input" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </div>
        </div>
        <button type="button" className="primary mt-4" disabled={generating} onClick={() => void generateBrief()}>
          {generating ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
          Generate brief
        </button>
      </section>

      <section className="surface p-5">
        <h3 className="font-bold">Review influencer script</h3>
        <p className="mt-1 text-sm text-muted">Paste a draft caption or video script before it goes live.</p>
        <div className="mt-4">
          <label className="label">Influencer handle (optional)</label>
          <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@creator" />
        </div>
        <div className="mt-4">
          <label className="label">Script / caption</label>
          <textarea className="input min-h-40 resize-none" value={script} onChange={(e) => setScript(e.target.value)} />
        </div>
        <button type="button" className="primary mt-4" disabled={reviewing} onClick={() => void reviewScript()}>
          {reviewing ? <LoaderCircle size={16} className="animate-spin" /> : <ScanText size={16} />}
          Review script
        </button>
      </section>

      {loading ? (
        <div className="surface flex items-center gap-2 p-8 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" /> Loading...</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-3 font-bold">Saved briefs ({briefs.length})</h3>
            {briefs.length === 0 ? (
              <p className="text-sm text-muted">No briefs yet — generate one above.</p>
            ) : (
              <div className="space-y-3">
                {briefs.map((brief) => (
                  <button key={brief.id} type="button" className="surface block w-full p-4 text-left transition hover:-translate-y-0.5" onClick={() => setSelectedBrief(brief)}>
                    <p className="font-semibold">{brief.campaign_name || brief.platform}</p>
                    <p className="mt-1 text-xs text-muted">{new Date(brief.created_at).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="mb-3 font-bold">Script reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <button key={review.id} type="button" className="surface block w-full p-4 text-left transition hover:-translate-y-0.5" onClick={() => setSelectedReview(review)}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{review.influencer_handle || "Script review"}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${riskStyles[review.overall_risk]}`}>{review.overall_risk}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{new Date(review.created_at).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}