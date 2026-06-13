"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle, Plus, ScanText } from "lucide-react";
import type { AmazonScanIssue } from "@/lib/amazonScanner";

type ListingRow = {
  id: string;
  asin: string | null;
  marketplace: string;
  title: string;
  bullet_points: string[];
  description: string;
  last_scanned_at: string | null;
  latest_scan: {
    id: string;
    overall_risk: string;
    issues: AmazonScanIssue[];
    scanned_at: string;
  } | null;
};

const riskStyles: Record<string, string> = {
  high: "bg-rose text-high",
  medium: "bg-apricot text-medium",
  low: "bg-mint text-safe",
};

export function AmazonListingsTab({ productId }: { productId: string }) {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"asin" | "paste">("paste");
  const [saving, setSaving] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ListingRow | null>(null);
  const [form, setForm] = useState({
    asin: "",
    marketplace: "US",
    title: "",
    bullets: ["", "", "", "", ""],
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/amazon-listings`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load listings");
      setListings(body.listings || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addListing = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/amazon-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          asin: form.asin.trim() || null,
          marketplace: form.marketplace,
          title: form.title.trim(),
          bullet_points: form.bullets.map((b) => b.trim()).filter(Boolean),
          description: form.description.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add listing");
      setModalOpen(false);
      setForm({ asin: "", marketplace: "US", title: "", bullets: ["", "", "", "", ""], description: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add listing");
    } finally {
      setSaving(false);
    }
  };

  const scanListing = async (id: string) => {
    setScanningId(id);
    setError("");
    try {
      const res = await fetch(`/api/amazon-listings/${id}/scan`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Scan failed");
      await load();
      const updated = listings.find((l) => l.id === id);
      if (updated) setSelected({ ...updated, latest_scan: body.scan });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanningId(null);
    }
  };

  const downloadReport = () => {
    if (!selected?.latest_scan) return;
    window.print();
  };

  if (selected?.latest_scan) {
    const issues = (selected.latest_scan.issues || []) as AmazonScanIssue[];
    return (
      <div className="space-y-5">
        <button type="button" className="secondary" onClick={() => setSelected(null)}>← Back to listings</button>
        <div className="surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Scan results</p>
              <h3 className="mt-1 text-lg font-bold">{selected.title || selected.asin || "Amazon listing"}</h3>
              <p className="mt-1 text-sm text-muted">Scanned {new Date(selected.latest_scan.scanned_at).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${riskStyles[selected.latest_scan.overall_risk] || riskStyles.low}`}>
              {selected.latest_scan.overall_risk} risk
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3">Field</th>
                  <th className="py-2 pr-3">Phrase</th>
                  <th className="py-2 pr-3">Rule</th>
                  <th className="py-2 pr-3">Severity</th>
                  <th className="py-2">Rewrite</th>
                </tr>
              </thead>
              <tbody>
                {issues.length ? issues.map((issue, i) => (
                  <tr key={`${issue.field}-${issue.phrase}-${i}`} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-3 font-medium">{issue.field}</td>
                    <td className="py-3 pr-3">{issue.phrase}</td>
                    <td className="py-3 pr-3 text-muted">{issue.rule}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${riskStyles[issue.severity]}`}>{issue.severity}</span>
                    </td>
                    <td className="py-3 text-muted">{issue.rewrite}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-6 text-muted">No issues found — listing looks clean.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button type="button" className="primary mt-6" onClick={downloadReport}>Download Report</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Scan Amazon titles, bullets, and descriptions against FDA/FTC and Amazon supplement policies.</p>
        <button type="button" className="primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Listing</button>
      </div>

      {loading ? (
        <div className="surface flex items-center gap-2 p-8 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" /> Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="surface p-10 text-center">
          <ScanText size={32} className="mx-auto text-muted" />
          <h3 className="mt-4 font-bold">No Amazon listings yet</h3>
          <p className="mt-2 text-sm text-muted">Add your ASIN or paste listing copy to scan before you go live.</p>
          <button type="button" className="primary mt-5" onClick={() => setModalOpen(true)}>Add your first listing</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{listing.title || "Untitled listing"}</h3>
                  <p className="mt-1 text-sm text-muted">{listing.marketplace}{listing.asin ? ` · ASIN ${listing.asin}` : ""}</p>
                  <p className="mt-1 text-xs text-muted">
                    Last scan: {listing.last_scanned_at ? new Date(listing.last_scanned_at).toLocaleString() : "Never"}
                  </p>
                </div>
                {listing.latest_scan && (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${riskStyles[listing.latest_scan.overall_risk] || riskStyles.low}`}>
                    {listing.latest_scan.overall_risk}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="secondary"
                  disabled={scanningId === listing.id}
                  onClick={() => void scanListing(listing.id)}
                >
                  {scanningId === listing.id ? <LoaderCircle size={16} className="animate-spin" /> : <ScanText size={16} />}
                  Scan Now
                </button>
                {listing.latest_scan && (
                  <button type="button" className="secondary" onClick={() => setSelected(listing)}>View results</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h3 className="text-lg font-bold">Add Amazon listing</h3>
            <div className="mt-4 flex gap-2">
              <button type="button" className={modalTab === "asin" ? "primary" : "secondary"} onClick={() => setModalTab("asin")}>Paste ASIN</button>
              <button type="button" className={modalTab === "paste" ? "primary" : "secondary"} onClick={() => setModalTab("paste")}>Paste Copy</button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Marketplace</label>
                <select className="input" value={form.marketplace} onChange={(e) => setForm({ ...form, marketplace: e.target.value })}>
                  {["US", "IN", "UK", "CA", "DE"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {modalTab === "asin" && (
                <div>
                  <label className="label">ASIN</label>
                  <input className="input" value={form.asin} onChange={(e) => setForm({ ...form, asin: e.target.value })} placeholder="B0XXXXXXXX" />
                </div>
              )}
              <div>
                <label className="label">Title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              {form.bullets.map((bullet, i) => (
                <div key={i}>
                  <label className="label">Bullet {i + 1}</label>
                  <input
                    className="input"
                    value={bullet}
                    onChange={(e) => {
                      const bullets = [...form.bullets];
                      bullets[i] = e.target.value;
                      setForm({ ...form, bullets });
                    }}
                  />
                </div>
              ))}
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[100px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" className="primary" disabled={saving} onClick={() => void addListing()}>
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : null} Save listing
              </button>
              <button type="button" className="secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}