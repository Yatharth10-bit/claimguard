"use client";

import { useState } from "react";
import { Check, ClipboardList, Copy, LoaderCircle, MessageCircleQuestion, Sparkles, WandSparkles } from "lucide-react";
import type { ComplianceSop } from "@/lib/sopGenerator";
import type { ExplainResult, GuidedRewrite } from "@/lib/complianceCopilot";

type CopilotClaimPayload = {
  claimText: string;
  productCategory: string;
  ingredients: string[];
  market: string;
  contextType: string;
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  riskyPhrases: string[];
  explanation: string;
  saferRewrite: string;
  sources: { title: string; url: string; organization?: string; category?: string }[];
};

type ComplianceCopilotPanelProps = {
  payload: CopilotClaimPayload;
};

type CopilotMode = "explain" | "fix" | "channel_rewrites";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ComplianceCopilotPanel({ payload }: ComplianceCopilotPanelProps) {
  const [mode, setMode] = useState<CopilotMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [explainResult, setExplainResult] = useState<ExplainResult | null>(null);
  const [rewrites, setRewrites] = useState<GuidedRewrite[] | null>(null);
  const [copiedKey, setCopiedKey] = useState("");
  const [sop, setSop] = useState<ComplianceSop | null>(null);
  const [sopError, setSopError] = useState("");
  const [sopLoading, setSopLoading] = useState(false);

  const run = async (nextMode: CopilotMode) => {
    setMode(nextMode);
    setLoading(true);
    setError("");
    setExplainResult(null);
    setRewrites(null);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextMode, ...payload }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Copilot request failed.");

      if (nextMode === "channel_rewrites") {
        setRewrites(body.result);
      } else {
        setExplainResult(body.result);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Copilot request failed.");
    } finally {
      setLoading(false);
    }
  };

  const generateSop = async () => {
    setSopLoading(true);
    setSopError("");
    setSop(null);
    try {
      const response = await fetch("/api/sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to generate SOP.");
      setSop(body.sop);
    } catch (requestError) {
      setSopError(requestError instanceof Error ? requestError.message : "Unable to generate SOP.");
    } finally {
      setSopLoading(false);
    }
  };

  const copyRewrite = async (key: string, text: string) => {
    if (await copyText(text)) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 1800);
    }
  };

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-violet-600">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Compliance copilot</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Scoped to this claim, product, and sources — not open-ended legal chat.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => void run("explain")} disabled={loading} className="secondary !py-2">
          {loading && mode === "explain" ? <LoaderCircle size={15} className="animate-spin" /> : <MessageCircleQuestion size={15} />}
          Ask why
        </button>
        <button onClick={() => void run("fix")} disabled={loading} className="secondary !py-2">
          {loading && mode === "fix" ? <LoaderCircle size={15} className="animate-spin" /> : <WandSparkles size={15} />}
          Help me fix
        </button>
        <button onClick={() => void run("channel_rewrites")} disabled={loading} className="primary !py-2">
          {loading && mode === "channel_rewrites" ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Channel rewrites
        </button>
        <button onClick={() => void generateSop()} disabled={sopLoading} className="secondary !py-2">
          {sopLoading ? <LoaderCircle size={15} className="animate-spin" /> : <ClipboardList size={15} />}
          Generate SOP
        </button>
      </div>

      {sopError && <p className="mt-4 rounded-xl bg-rose px-4 py-3 text-sm text-high">{sopError}</p>}

      {sop && (
        <div className="mt-5 space-y-4 border-t border-violet-100 pt-5">
          <p className="text-sm font-bold">{sop.title}</p>
          <p className="text-sm leading-6 text-muted">{sop.purpose}</p>
          <div className="space-y-2">
            {sop.steps.map((step, index) => (
              <p key={step} className="flex gap-2 text-sm leading-6 text-muted">
                <span className="font-bold text-ink">{index + 1}.</span>
                {step}
              </p>
            ))}
          </div>
          <p className="text-sm leading-6 text-muted"><strong>Escalation:</strong> {sop.escalation}</p>
          <p className="text-xs leading-5 text-muted">{sop.disclaimer}</p>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-rose px-4 py-3 text-sm text-high">{error}</p>}

      {explainResult && (
        <div className="mt-5 space-y-4 border-t border-violet-100 pt-5">
          <p className="text-sm leading-6">{explainResult.summary}</p>
          <p className="text-sm leading-6 text-muted">{explainResult.contextInsight}</p>
          {explainResult.phraseBreakdown.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Flagged patterns</p>
              {explainResult.phraseBreakdown.map((item) => (
                <div key={item.phrase} className="rounded-xl bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${item.severity === "high" ? "bg-rose text-high" : "bg-apricot text-medium"}`}>
                      {item.severity}
                    </span>
                    <span className="text-sm font-semibold">{item.phrase}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.explanation}</p>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Next steps</p>
            {explainResult.nextSteps.map((step) => (
              <p key={step} className="flex gap-2 text-sm leading-6 text-muted">
                <Check size={15} className="mt-0.5 shrink-0 text-safe" />
                {step}
              </p>
            ))}
          </div>
          <p className="text-xs leading-5 text-muted">{explainResult.disclaimer}</p>
        </div>
      )}

      {rewrites && (
        <div className="mt-5 space-y-4 border-t border-violet-100 pt-5">
          {rewrites.map((item) => (
            <div key={item.channel} className="rounded-xl bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-700">{item.label}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.rewrite}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{item.notes}</p>
                </div>
                <button onClick={() => void copyRewrite(item.channel, item.rewrite)} className="secondary shrink-0 !p-2">
                  {copiedKey === item.channel ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}