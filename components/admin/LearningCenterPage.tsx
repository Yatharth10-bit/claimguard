"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle, Database, RefreshCw, Shield } from "lucide-react";
import { PendingReviewQueue } from "@/components/admin/PendingReviewQueue";

type LearningStats = {
  tablesMissing?: boolean;
  migration?: string;
  stats: {
    seedDatasetSize: number;
    dbExamples: number;
    approvedExamples: number;
    pendingReview: number;
    feedbackCount: number;
    sourcesScanned: number;
    failedSources: number;
  };
  versions: { ruleVersion: string; promptVersion: string; datasetVersion: string };
  liveEvaluation: {
    accuracyEstimate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    rewriteQualityScore: number;
    totalExamples: number;
  };
  sources: { id: string; source_url: string; trust_level: string; status: string; sector: string }[];
  recentRuns: { id: string; run_type: string; status: string; claims_extracted: number; started_at: string }[];
};

export function LearningCenterPage() {
  const [data, setData] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/learning-center");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load learning center.");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="surface h-28 animate-pulse p-5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface p-6 text-sm text-high">
        <AlertTriangle size={18} className="mb-2 inline" /> {error}
        <p className="mt-2 text-muted">Set ADMIN_EMAILS in Vercel env to your email for admin access.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {data.tablesMissing && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Migration required:</strong> Run <code className="rounded bg-white px-1">{data.migration}</code> in Supabase SQL Editor.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Claim Intelligence Engine — admin review only. Unreviewed internet data never overwrites production.</p>
        <button type="button" onClick={() => void load()} className="secondary !py-2">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Seed dataset (in-memory)", value: data.stats.seedDatasetSize.toLocaleString(), icon: Database },
          { label: "DB examples", value: data.stats.dbExamples.toLocaleString(), icon: BookOpen },
          { label: "Pending review", value: data.stats.pendingReview, icon: AlertTriangle },
          { label: "Approved for retrieval", value: data.stats.approvedExamples, icon: CheckCircle },
          { label: "User feedback", value: data.stats.feedbackCount, icon: Shield },
          { label: "Active sources", value: data.stats.sourcesScanned, icon: RefreshCw },
          { label: "Failed sources", value: data.stats.failedSources, icon: AlertTriangle },
          { label: "Accuracy (live eval)", value: `${data.liveEvaluation.accuracyEstimate}%`, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface p-5">
            <Icon size={18} className="text-lavender" />
            <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface p-5">
          <h2 className="text-sm font-bold text-ink">Version tracking</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Rules</dt><dd className="font-semibold">{data.versions.ruleVersion}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Prompt</dt><dd className="font-semibold">{data.versions.promptVersion}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Dataset</dt><dd className="font-semibold">{data.versions.datasetVersion}</dd></div>
          </dl>
          <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-muted">Latest evaluation</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">False positives</dt><dd>{data.liveEvaluation.falsePositiveRate}%</dd></div>
            <div className="flex justify-between"><dt className="text-muted">False negatives</dt><dd>{data.liveEvaluation.falseNegativeRate}%</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Rewrite quality</dt><dd>{data.liveEvaluation.rewriteQualityScore}%</dd></div>
          </dl>
        </section>

        <section className="surface p-5">
          <h2 className="text-sm font-bold text-ink">Learning sources</h2>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
            {data.sources.length ? data.sources.map((s) => (
              <li key={s.id} className="rounded-xl bg-stone p-3">
                <p className="font-medium text-ink truncate">{s.sector}</p>
                <p className="text-xs text-muted truncate">{s.source_url}</p>
                <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase">{s.trust_level} · {s.status}</span>
              </li>
            )) : <li className="text-muted">No sources in DB yet — run migration + cron.</li>}
          </ul>
        </section>
      </div>

      <PendingReviewQueue />

      <section className="surface p-5">
        <h2 className="text-sm font-bold text-ink">Recent learning runs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted">
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Claims</th>
                <th className="pb-2">Started</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRuns.length ? data.recentRuns.map((r) => (
                <tr key={r.id} className="border-t border-black/[.04]">
                  <td className="py-2 pr-4">{r.run_type}</td>
                  <td className="py-2 pr-4">{r.status}</td>
                  <td className="py-2 pr-4">{r.claims_extracted}</td>
                  <td className="py-2 text-muted">{new Date(r.started_at).toLocaleString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-4 text-muted">No runs yet. POST /api/cron/claim-learning with CRON_SECRET.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}