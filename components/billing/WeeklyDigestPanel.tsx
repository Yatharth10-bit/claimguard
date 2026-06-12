"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, ExternalLink, LoaderCircle, Sparkles } from "lucide-react";
import type { DigestItem } from "@/lib/weeklyDigest";

export function WeeklyDigestPanel() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/digest");
        const body = await response.json();
        if (response.status === 402) {
          setUpgradeRequired(true);
          setError(body.error || "Upgrade to Shield for weekly digest.");
          return;
        }
        if (!response.ok) throw new Error(body.error || "Unable to load digest.");
        setItems(body.digest || []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load digest.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <div className="surface p-5 text-sm text-muted"><LoaderCircle size={16} className="mr-2 inline animate-spin" />Loading weekly digest...</div>;
  }

  if (upgradeRequired) {
    return (
      <div className="surface p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-lavender" />
          <h2 className="font-bold">Weekly compliance digest</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{error}</p>
        <Link href="/settings" className="primary mt-4 inline-flex">
          <Sparkles size={15} />
          Upgrade to Shield
        </Link>
      </div>
    );
  }

  if (error) return <div className="surface p-5 text-sm text-high">{error}</div>;

  return (
    <section className="surface p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays size={18} className="text-lavender" />
        <div>
          <h2 className="font-bold">Weekly compliance digest</h2>
          <p className="mt-1 text-xs text-muted">Regulation updates and product impacts for your workspace</p>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl bg-stone p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${item.priority === "high" ? "bg-rose text-high" : item.priority === "medium" ? "bg-apricot text-medium" : "bg-mint text-safe"}`}>
                {item.type}
              </span>
              {item.priority === "high" && <AlertTriangle size={14} className="text-high" />}
            </div>
            <p className="mt-3 text-sm font-bold">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.summary}</p>
            <div className="mt-3">
              {item.href?.startsWith("http") ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-lavender hover:underline">
                  View source <ExternalLink size={13} className="inline" />
                </a>
              ) : item.href ? (
                <Link href={item.href} className="text-sm font-semibold text-lavender hover:underline">Open in ClaimGuard</Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}