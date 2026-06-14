import type { ClaimIntelligenceInput } from "@/lib/claimIntelligence/types";

type LearnedPattern = {
  pattern: string;
  sectors: string[];
  riskNote: string;
  frequency: string;
};

const INTERNET_LEARNED_PATTERNS: LearnedPattern[] = [
  { pattern: "cure + inflammation", sectors: ["Supplements", "Gut health", "Ayurvedic products"], riskNote: "Often flagged as disease-treatment language in structure/function marketing.", frequency: "Very common" },
  { pattern: "boosts immunity", sectors: ["Supplements", "Immune health", "Functional drinks"], riskNote: "Frequently needs substantiation and careful qualification.", frequency: "Very common" },
  { pattern: "clinically proven", sectors: ["Skincare", "Supplements", "Weight loss"], riskNote: "Common in ads; requires evidence scope and disclosure.", frequency: "Common" },
  { pattern: "doctor recommended", sectors: ["Supplements", "Dental care", "Baby products"], riskNote: "Endorsement claims need substantiation and material connection disclosure.", frequency: "Common" },
  { pattern: "burns fat fast", sectors: ["Weight loss", "Fitness", "Supplements"], riskNote: "Performance and weight claims attract FTC scrutiny.", frequency: "Common" },
  { pattern: "reverses aging", sectors: ["Skincare", "Beauty products", "Cosmetics"], riskNote: "Can cross cosmetic-drug boundary if structure/function implied.", frequency: "Common" },
  { pattern: "detox / cleanse", sectors: ["Wellness", "Herbal products", "Gut health"], riskNote: "Often vague; may imply disease treatment without support.", frequency: "Very common" },
  { pattern: "pain relief guarantee", sectors: ["Medical-adjacent products", "Supplements"], riskNote: "Pain and relief claims can imply drug-like intended use.", frequency: "Moderate" },
  { pattern: "FDA approved (unsupported)", sectors: ["Supplements", "Cosmetics", "DTC consumer goods"], riskNote: "Misleading regulatory approval is a top enforcement trigger.", frequency: "Moderate" },
  { pattern: "before/after transformation", sectors: ["Skincare", "Weight loss", "Fitness"], riskNote: "Testimonial and results imagery need typicality and substantiation.", frequency: "Very common" },
  { pattern: "supports healthy inflammatory response", sectors: ["Supplements", "Gut health"], riskNote: "Safer structure/function pattern seen in compliant marketing.", frequency: "Common (safe pattern)" },
  { pattern: "supports digestive comfort", sectors: ["Gut health", "Food", "Ayurvedic products"], riskNote: "Common compliant rewrite for bloating/inflammation claims.", frequency: "Common (safe pattern)" },
];

export function matchInternetPatterns(input: ClaimIntelligenceInput): { pattern: string; frequency: string; note: string }[] {
  const lower = input.claimText.toLowerCase();
  const sector = (input.sector || input.productCategory || "").toLowerCase();
  const matches: { pattern: string; frequency: string; note: string; score: number }[] = [];

  for (const p of INTERNET_LEARNED_PATTERNS) {
    const patternTokens = p.pattern.toLowerCase().split(/[\s+/]+/).filter(Boolean);
    const hitCount = patternTokens.filter((t) => lower.includes(t.replace("+", ""))).length;
    const sectorMatch = !sector || p.sectors.some((s) => sector.includes(s.toLowerCase()) || s.toLowerCase().includes(sector));
    if (hitCount >= Math.max(1, Math.ceil(patternTokens.length * 0.5)) && sectorMatch) {
      matches.push({ pattern: p.pattern, frequency: p.frequency, note: p.riskNote, score: hitCount + (sectorMatch ? 1 : 0) });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 4).map(({ pattern, frequency, note }) => ({ pattern, frequency, note }));
}