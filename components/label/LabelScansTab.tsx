"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, ScanText, Upload } from "lucide-react";

type LabelScan = {
  id: string;
  file_name: string;
  overall_risk: string;
  issues: { field: string; phrase: string; rule: string; severity: string; rewrite: string }[];
  claims_found: string[];
  scanned_at: string | null;
  created_at: string;
};

const riskStyles: Record<string, string> = {
  high: "bg-rose text-high",
  medium: "bg-apricot text-medium",
  low: "bg-mint text-safe",
};

export function LabelScansTab({ productId }: { productId: string }) {
  const [scans, setScans] = useState<LabelScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<LabelScan | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/label-scans`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load scans");
      setScans(body.scans || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runScan = async () => {
    if (text.trim().length < 20) {
      setError("Paste at least 20 characters of label copy.");
      return;
    }
    setScanning(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/label-scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracted_text: text, file_name: "pasted-label.txt" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Scan failed");
      setText("");
      await load();
      setSelected(body.scan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  if (selected) {
    const issues = selected.issues || [];
    return (
      <div className="space-y-5">
        <button type="button" className="secondary" onClick={() => setSelected(null)}>← Back to scans</button>
        <div className="surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Label scan</p>
              <h3 className="mt-1 text-lg font-bold">{selected.file_name}</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${riskStyles[selected.overall_risk] || riskStyles.low}`}>
              {selected.overall_risk} risk
            </span>
          </div>
          {selected.claims_found?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Claims detected</p>
              <ul className="mt-2 list-inside list-disc text-sm text-muted">
                {selected.claims_found.map((claim, i) => <li key={i}>{claim}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3">Field</th>
                  <th className="py-2 pr-3">Issue</th>
                  <th className="py-2 pr-3">Severity</th>
                  <th className="py-2">Fix</th>
                </tr>
              </thead>
              <tbody>
                {issues.length ? issues.map((issue, i) => (
                  <tr key={i} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-3 font-medium">{issue.field}</td>
                    <td className="py-3 pr-3">{issue.phrase}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${riskStyles[issue.severity]}`}>{issue.severity}</span>
                    </td>
                    <td className="py-3 text-muted">{issue.rewrite}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-6 text-muted">No issues — label looks compliant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}
      <p className="text-sm text-muted">Paste Supplement Facts panel and label copy to check structure/function claims and FDA disclaimers.</p>

      <div className="surface p-5">
        <label className="label">Label text</label>
        <textarea
          className="input min-h-48 resize-none font-mono text-sm leading-6"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste Supplement Facts, ingredients, and marketing claims from your label..."
        />
        <button type="button" className="primary mt-4" disabled={scanning} onClick={() => void runScan()}>
          {scanning ? <LoaderCircle size={16} className="animate-spin" /> : <ScanText size={16} />}
          Scan label
        </button>
      </div>

      {loading ? (
        <div className="surface flex items-center gap-2 p-8 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" /> Loading scans...</div>
      ) : scans.length === 0 ? (
        <div className="surface p-10 text-center">
          <Upload size={32} className="mx-auto text-muted" />
          <h3 className="mt-4 font-bold">No label scans yet</h3>
          <p className="mt-2 text-sm text-muted">Paste your label copy above to validate claims and disclaimers.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {scans.map((scan) => (
            <button key={scan.id} type="button" className="surface p-5 text-left transition hover:-translate-y-0.5" onClick={() => setSelected(scan)}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">{scan.file_name}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {scan.scanned_at ? new Date(scan.scanned_at).toLocaleString() : new Date(scan.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${riskStyles[scan.overall_risk]}`}>{scan.overall_risk}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}