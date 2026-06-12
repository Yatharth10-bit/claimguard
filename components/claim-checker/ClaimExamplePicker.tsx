"use client";

import { getClaimExamplesForSector, riskTone, type ClaimExample } from "@/lib/claimLearnings";

type ClaimExamplePickerProps = {
  sector: string;
  onSelect: (example: ClaimExample) => void;
};

export function ClaimExamplePicker({ sector, onSelect }: ClaimExamplePickerProps) {
  const examples = getClaimExamplesForSector(sector);

  return (
    <div className="mt-4 rounded-xl border border-black/[.06] bg-stone p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Try a validated example</p>
      <p className="mt-1 text-xs leading-5 text-muted">Pulled from ClaimGuard&apos;s 100-product regression suite for your sector.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => onSelect(example)}
            className={`rounded-full border border-black/[.08] px-3 py-1.5 text-left text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${riskTone(example.expected)}`}
            title={example.claim}
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}