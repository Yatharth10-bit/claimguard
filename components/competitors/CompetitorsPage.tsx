"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Plus, ScanText, Target } from "lucide-react";

type Competitor = {
  id: string;
  brand_name: string;
  website_url: string | null;
  amazon_asin: string | null;
  is_active: boolean;
  latest_snapshot: {
    id: string;
    claims_found: { text: string; risk: string }[];
    high_risk_claims: { text: string }[];
    changed_from_previous: boolean;
    captured_at: string;
  } | null;
};

export function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [scanContent, setScanContent] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ brand_name: "", website_url: "", amazon_asin: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/competitors");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load");
      setCompetitors(body.competitors || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addCompetitor = async () => {
    if (!form.brand_name.trim()) {
      setError("Brand name is required.");
      return;
    }
    if (!form.website_url.trim() && !form.amazon_asin.trim()) {
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
          brand_name: form.brand_name,
          website_url: form.website_url || null,
          amazon_asin: form.amazon_asin || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add");
      setForm({ brand_name: "", website_url: "", amazon_asin: "" });
      setShowForm(false);
      await load();
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanningId(null);
    }
  };

  return (
    <div className="space-y-5">
      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Track competitor claims and spot high-risk copy in your category.</p>
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
        <div className="surface flex items-center gap-2 p-8 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" /> Loading...</div>
      ) : competitors.length === 0 ? (
        <div className="surface p-10 text-center">
          <Target size={32} className="mx-auto text-muted" />
          <h3 className="mt-4 font-bold">No competitors tracked</h3>
          <p className="mt-2 text-sm text-muted">Add brands you want to monitor for risky claims.</p>
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
                  <span className="rounded-full bg-stone px-3 py-1 text-xs font-bold">
                    {comp.latest_snapshot.high_risk_claims?.length || 0} high-risk claims
                  </span>
                )}
              </div>
              {comp.latest_snapshot?.claims_found?.length ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {comp.latest_snapshot.claims_found.slice(0, 5).map((claim, i) => (
                    <li key={i} className="rounded-xl bg-stone p-3">
                      <span className="font-medium capitalize">{claim.risk}:</span> {claim.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4">
                <label className="label">Paste competitor copy to scan</label>
                <textarea
                  className="input min-h-24 resize-none"
                  value={scanContent[comp.id] || ""}
                  onChange={(e) => setScanContent((prev) => ({ ...prev, [comp.id]: e.target.value }))}
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
    </div>
  );
}