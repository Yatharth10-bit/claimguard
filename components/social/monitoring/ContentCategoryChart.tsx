import type { SocialScanPayload } from "@/lib/socialIntelligence";

export function ContentCategoryChart({ scan }: { scan: SocialScanPayload }) {
  const max = Math.max(...scan.content_categories.map((c) => c.count), 1);

  return (
    <section className="surface p-5">
      <h3 className="font-bold">Content category mix</h3>
      <p className="mt-1 text-xs text-muted">Classified from public captions</p>
      <div className="mt-4 space-y-3">
        {scan.content_categories.map((c) => (
          <div key={c.category}>
            <div className="flex justify-between text-sm">
              <span>{c.category}</span>
              <span className="font-bold">{c.count}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone">
              <div
                className="h-full rounded-full bg-lavender transition-all"
                style={{ width: `${(c.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {scan.missing_categories.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-muted">
          {scan.missing_categories.map((m) => (
            <li key={m}>→ {m}</li>
          ))}
        </ul>
      )}
    </section>
  );
}