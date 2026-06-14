"use client";

import { memo, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { FeedbackType } from "@/lib/claimIntelligence/types";

type Props = {
  claimCheckResultId?: string;
  claimId?: string;
};

const FEEDBACK_OPTIONS: { type: FeedbackType; label: string }[] = [
  { type: "accurate", label: "Accurate" },
  { type: "too_strict", label: "Too strict" },
  { type: "too_weak", label: "Too weak" },
  { type: "rewrite_bad", label: "Bad rewrite" },
  { type: "missed_risk", label: "Missed risk" },
  { type: "wrong_category", label: "Wrong category" },
];

function ClaimFeedbackPanelInner({ claimCheckResultId, claimId }: Props) {
  const [selected, setSelected] = useState<FeedbackType | null>(null);
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (type: FeedbackType) => {
    setSelected(type);
    setLoading(true);
    try {
      const res = await fetch("/api/claim-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback_type: type,
          claim_check_result_id: claimCheckResultId,
          claim_id: claimId,
          notes,
        }),
      });
      if (res.ok) setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className="mt-4 rounded-xl bg-mint/40 p-3 text-sm text-safe">
        Thanks — feedback saved for review. Live rules are not changed instantly.
      </p>
    );
  }

  return (
    <div className="mt-5 border-t border-black/[.06] pt-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Was this helpful?</p>
      <p className="mt-1 text-xs text-muted">Feedback improves the engine over time — it does not change your result immediately.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEEDBACK_OPTIONS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            disabled={loading}
            onClick={() => void submit(type)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selected === type ? "bg-ink text-white" : "border border-black/[.08] bg-white text-ink hover:bg-stone"
            }`}
          >
            {type === "accurate" ? <ThumbsUp size={12} className="mr-1 inline" /> : null}
            {type === "rewrite_bad" || type === "missed_risk" ? <ThumbsDown size={12} className="mr-1 inline" /> : null}
            {label}
          </button>
        ))}
      </div>
      <textarea
        className="input mt-3 min-h-16 resize-none text-sm"
        placeholder="Optional note (e.g. suggest a better rewrite)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={500}
      />
    </div>
  );
}

export const ClaimFeedbackPanel = memo(ClaimFeedbackPanelInner);