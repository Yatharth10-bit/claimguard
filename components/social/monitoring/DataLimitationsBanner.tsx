import { Info } from "lucide-react";

export function DataLimitationsBanner({ limitations }: { limitations?: string[] }) {
  const items = limitations?.length
    ? limitations
    : [
        "Public data only — no private Instagram analytics.",
        "Estimated values use visible likes, comments, and follower counts.",
        "Reach, impressions, saves, and story views are unavailable from public data.",
      ];

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm">
      <div className="flex items-start gap-2">
        <Info size={18} className="mt-0.5 shrink-0 text-sky-600" />
        <div>
          <p className="font-bold text-ink">Public data only · estimated analytics</p>
          <ul className="mt-2 space-y-1 text-muted">
            {items.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}