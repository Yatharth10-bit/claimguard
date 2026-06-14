"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";

type Example = {
  id: string;
  claim_text: string;
  sector: string;
  risk_level: string;
  risk_reason: string;
  safer_rewrite: string;
  confidence_score: number;
  source: string;
  trust_score: number;
};

function PendingReviewQueueInner() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/learning-center/examples?pending=true");
      const body = await res.json();
      if (res.ok) setExamples(body.examples || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      const res = await fetch("/api/admin/learning-center/examples", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) setExamples((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return <div className="surface h-48 animate-pulse p-5" />;
  }

  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink">Pending review queue</h2>
        <span className="rounded-full bg-apricot/30 px-3 py-1 text-xs font-bold text-medium">{examples.length} waiting</span>
      </div>
      <p className="mt-2 text-xs text-muted">Approve to add to production retrieval. Reject to discard. Nothing goes live without approval.</p>

      {!examples.length ? (
        <p className="mt-6 text-sm text-muted">No pending examples. Run the daily learning cron or seed script.</p>
      ) : (
        <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">
          {examples.map((ex) => (
            <li key={ex.id} className="rounded-xl border border-black/[.06] p-4">
              <p className="text-sm leading-6 text-ink">&ldquo;{ex.claim_text.slice(0, 180)}{ex.claim_text.length > 180 ? "…" : ""}&rdquo;</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-stone px-2 py-0.5 font-semibold">{ex.sector}</span>
                <span className="rounded-full bg-stone px-2 py-0.5 font-semibold">{ex.risk_level} risk</span>
                <span className="rounded-full bg-stone px-2 py-0.5 text-muted">{ex.source} · trust {ex.trust_score}</span>
              </div>
              <p className="mt-2 text-xs text-muted">{ex.risk_reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={acting === ex.id}
                  onClick={() => void act(ex.id, "approve")}
                  className="primary !py-1.5 !text-xs"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  type="button"
                  disabled={acting === ex.id}
                  onClick={() => void act(ex.id, "reject")}
                  className="secondary !py-1.5 !text-xs"
                >
                  <Trash2 size={14} /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export const PendingReviewQueue = memo(PendingReviewQueueInner);