"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";

type Entry = {
  id: string;
  claim_text: string;
  evidence_type: string;
  evidence_title: string;
  evidence_url: string | null;
  notes: string;
  approved_by: string | null;
  created_at: string;
};

const EVIDENCE_LABELS: Record<string, string> = {
  clinical_study: "Clinical study",
  meta_analysis: "Meta-analysis",
  in_house_test: "In-house test",
  regulatory_guidance: "Regulatory guidance",
  expert_opinion: "Expert opinion",
};

export function SubstantiationTab({ productId }: { productId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    claim_text: "",
    evidence_type: "clinical_study",
    evidence_title: "",
    evidence_url: "",
    notes: "",
    approved_by: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/substantiation`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load entries");
      setEntries(body.entries || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addEntry = async () => {
    if (!form.claim_text.trim()) {
      setError("Claim text is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/substantiation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          evidence_url: form.evidence_url || null,
          approved_by: form.approved_by || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to save");
      setForm({ claim_text: "", evidence_type: "clinical_study", evidence_title: "", evidence_url: "", notes: "", approved_by: "" });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!confirm("Remove this substantiation entry?")) return;
    try {
      const res = await fetch(`/api/substantiation/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to delete");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-5">
      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Link claims to clinical studies, tests, and regulatory guidance for audit readiness.</p>
        <button type="button" className="primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add evidence</button>
      </div>

      {showForm && (
        <div className="surface space-y-4 p-5">
          <h3 className="font-bold">New substantiation entry</h3>
          <div>
            <label className="label">Claim text</label>
            <textarea className="input min-h-24 resize-none" value={form.claim_text} onChange={(e) => setForm({ ...form, claim_text: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Evidence type</label>
              <select className="input" value={form.evidence_type} onChange={(e) => setForm({ ...form, evidence_type: e.target.value })}>
                {Object.entries(EVIDENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Evidence title</label>
              <input className="input" value={form.evidence_title} onChange={(e) => setForm({ ...form, evidence_title: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Evidence URL (optional)</label>
            <input className="input" value={form.evidence_url} onChange={(e) => setForm({ ...form, evidence_url: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-20 resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div>
            <label className="label">Approved by (optional)</label>
            <input className="input" value={form.approved_by} onChange={(e) => setForm({ ...form, approved_by: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="primary" disabled={saving} onClick={() => void addEntry()}>
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : null} Save entry
            </button>
            <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="surface flex items-center gap-2 p-8 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" /> Loading...</div>
      ) : entries.length === 0 ? (
        <div className="surface p-10 text-center">
          <h3 className="font-bold">No substantiation on file</h3>
          <p className="mt-2 text-sm text-muted">Document evidence behind each marketing claim before launch.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <div key={entry.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{entry.claim_text}</p>
                  <p className="mt-2 text-sm text-muted">
                    {EVIDENCE_LABELS[entry.evidence_type] || entry.evidence_type}
                    {entry.evidence_title ? ` · ${entry.evidence_title}` : ""}
                  </p>
                  {entry.evidence_url && (
                    <a href={entry.evidence_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-lavender">
                      View evidence
                    </a>
                  )}
                  {entry.notes && <p className="mt-2 text-sm text-muted">{entry.notes}</p>}
                  {entry.approved_by && <p className="mt-2 text-xs text-muted">Approved by {entry.approved_by}</p>}
                </div>
                <button type="button" className="secondary !px-2.5 !py-2 text-high" onClick={() => void removeEntry(entry.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}