"use client";

import { useState } from "react";
import { Check, LoaderCircle, MessageSquare } from "lucide-react";

export function FeedbackForm() {
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to send feedback.");
      setSuccess(body.message || "Feedback sent.");
      setMessage("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="surface p-6">
      <div className="flex items-center gap-2">
        <MessageSquare size={18} className="text-lavender" />
        <h2 className="font-bold">Beta feedback</h2>
      </div>
      <p className="mt-2 text-sm text-muted">Tell us what broke, what confused you, or what would make ClaimGuard indispensable.</p>
      <div className="mt-5 grid gap-4">
        <label className="block text-sm font-semibold">
          Category
          <select className="input mt-2" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="bug">Bug</option>
            <option value="feature">Feature request</option>
            <option value="billing">Billing</option>
            <option value="compliance">Compliance accuracy</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Message
          <textarea className="input mt-2 min-h-32 resize-none" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What should we improve before launch?" />
        </label>
      </div>
      {error && <p className="mt-4 text-sm text-high">{error}</p>}
      {success && <p className="mt-4 flex items-center gap-2 text-sm text-safe"><Check size={15} />{success}</p>}
      <button onClick={() => void submit()} disabled={loading || message.trim().length < 10} className="primary mt-5">
        {loading ? <LoaderCircle size={16} className="animate-spin" /> : <MessageSquare size={16} />}
        Send feedback
      </button>
      <p className="mt-3 text-xs text-muted">Support: hello@claimguard.io</p>
    </section>
  );
}