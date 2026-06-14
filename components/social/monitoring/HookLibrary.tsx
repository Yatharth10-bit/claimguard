import type { PostAnalysis, SocialScanPayload } from "@/lib/socialIntelligence";

export function HookLibrary({ scan }: { scan: SocialScanPayload }) {
  const topHooks = [...scan.posts]
    .sort((a, b) => (b.visible_likes || 0) - (a.visible_likes || 0))
    .slice(0, 6);

  return (
    <section className="surface p-5">
      <h3 className="font-bold">Hook & CTA patterns</h3>
      <p className="mt-1 text-xs text-muted">From visible captions · public data only</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase text-muted">Hook breakdown</p>
          <ul className="mt-2 space-y-1 text-sm">
            {(scan.hook_breakdown ?? []).map((h) => (
              <li key={h.hook_type} className="flex justify-between">
                <span>{h.hook_type}</span>
                <span className="font-bold">{h.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-muted">CTA breakdown</p>
          <ul className="mt-2 space-y-1 text-sm">
            {(scan.cta_breakdown ?? []).map((c) => (
              <li key={c.cta_type} className="flex justify-between">
                <span>{c.cta_type}</span>
                <span className="font-bold">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {topHooks.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase text-muted">Top opening hooks</p>
          <div className="mt-2 space-y-2">
            {topHooks.map((p: PostAnalysis, i) => (
              <div key={i} className="rounded-xl bg-stone p-3 text-sm">
                <p className="font-semibold">{p.hook_text || p.caption_preview.slice(0, 80)}</p>
                <p className="mt-1 text-xs text-muted">
                  {p.hook_type} · {p.cta_type} · {p.risk_level}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}