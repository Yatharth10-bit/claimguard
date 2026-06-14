/** Sector-specific claim risk priorities from onboarding / product type. */
export type SectorRiskProfile = {
  sector: string;
  priorityPatterns: RegExp[];
  boostScore: number;
  focusNote: string;
};

const PROFILES: SectorRiskProfile[] = [
  {
    sector: "Supplements",
    priorityPatterns: [/immunity|inflammation|cure|detox|gut|hormone|weight/i],
    boostScore: 6,
    focusNote: "Supplement claims often trigger structure/function and disease-implication rules.",
  },
  {
    sector: "Skincare",
    priorityPatterns: [/acne|anti[- ]?aging|wrinkle|repair|heal|dermatologist|medical[- ]grade|whiten|fair(ness)?|melanin|make\s+you\s+white/i],
    boostScore: 8,
    focusNote: "Skincare copy can cross the cosmetic-drug boundary with treatment or skin-tone change language.",
  },
  {
    sector: "Skincare / Cosmetics",
    priorityPatterns: [/acne|anti[- ]?aging|wrinkle|repair|heal|dermatologist|whiten|fair(ness)?|melanin|make\s+you\s+white/i],
    boostScore: 8,
    focusNote: "Cosmetic claims should avoid drug-like effects and skin whitening/fairness implications.",
  },
  {
    sector: "Food",
    priorityPatterns: [/prevent|cure|diabetes|cholesterol|doctor|clinical/i],
    boostScore: 5,
    focusNote: "Food health claims may need substantiation and careful disease-language avoidance.",
  },
  {
    sector: "Functional Food",
    priorityPatterns: [/prevent|cure|immunity|clinical|guaranteed/i],
    boostScore: 5,
    focusNote: "Functional food claims sit between food labeling and supplement-style scrutiny.",
  },
  {
    sector: "Weight loss",
    priorityPatterns: [/burn|fat|guaranteed|rapid|miracle|clinical/i],
    boostScore: 7,
    focusNote: "Weight-loss marketing attracts FTC substantiation and typicality scrutiny.",
  },
  {
    sector: "Wellness",
    priorityPatterns: [/anxiety|depression|pain|hormone|detox|cure/i],
    boostScore: 5,
    focusNote: "Wellness brands often blur general wellness with mental-health or treatment claims.",
  },
  {
    sector: "Herbal / Ayurvedic Products",
    priorityPatterns: [/cure|treat|detox|inflammation|immunity|traditional medicine/i],
    boostScore: 6,
    focusNote: "Herbal claims may need careful disease-language and evidence framing.",
  },
  {
    sector: "Baby products",
    priorityPatterns: [/safe for every|choking|hypoallergenic|doctor|prevents/i],
    boostScore: 6,
    focusNote: "Children's product claims need age-appropriate warnings and testing support.",
  },
  {
    sector: "Pet products",
    priorityPatterns: [/treats|prevents|disease|vet|clinical/i],
    boostScore: 6,
    focusNote: "Pet health claims can trigger animal drug or feed regulatory review.",
  },
];

export function getSectorRiskProfile(sector?: string): SectorRiskProfile | null {
  if (!sector) return null;
  const lower = sector.toLowerCase();
  return PROFILES.find((p) => p.sector.toLowerCase() === lower || lower.includes(p.sector.toLowerCase())) || null;
}

export function applySectorBoost(claimText: string, sector: string | undefined, baseScore: number): { score: number; note?: string } {
  const profile = getSectorRiskProfile(sector);
  if (!profile) return { score: baseScore };
  const hit = profile.priorityPatterns.some((p) => p.test(claimText));
  return hit ? { score: Math.min(99, baseScore + profile.boostScore), note: profile.focusNote } : { score: baseScore };
}