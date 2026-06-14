import type { StrategicSummarySection } from "@/lib/instagramStrategicSummary";
import { Sparkles } from "lucide-react";

export function SocialAISummary({ sections }: { sections: StrategicSummarySection[] }) {
  return (
    <section className="surface p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-[#14a995]" />
        <h3 className="font-bold">Instagram strategic brief</h3>
      </div>
      <p className="mt-1 text-xs text-muted">Claim intelligence + content patterns · public data only</p>
      <div className="mt-5 space-y-5">
        {sections.map((s) => (
          <div key={s.id}>
            <h4 className="font-bold">{s.title}</h4>
            <p className="mt-2 whitespace-pre-line text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}