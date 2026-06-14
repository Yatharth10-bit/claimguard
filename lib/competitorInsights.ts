import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { sectorToProductCategory } from "@/lib/sectorMapping";

export type SectorInsight = {
  sector: string;
  productCategory: string;
  commonMistakes: string[];
  highRiskCategories: string[];
  riskyWords: string[];
  saferAlternatives: string[];
  recommendations: string[];
  competitorClaimStyle: string;
  marketingAggressivenessNote: string;
  fdaFtcIndicators: string[];
  channelRisks: {
    website: string;
    ads: string;
    influencer: string;
  };
  estimated: boolean;
};

const SECTOR_INSIGHTS: Record<string, Omit<SectorInsight, "sector" | "productCategory" | "estimated">> = {
  Supplements: {
    commonMistakes: [
      "Disease-treatment language (cure, treat, prevent)",
      "Missing DSHEA structure/function disclaimer",
      "Implied FDA approval on labels or ads",
      "Guaranteed results or rapid timelines",
    ],
    highRiskCategories: ["Immune claims", "Weight loss", "Pain/inflammation", "Hormonal balance", "Disease prevention"],
    riskyWords: ["cure", "treat", "prevent", "guaranteed", "clinically proven", "FDA approved", "boost immunity", "detox"],
    saferAlternatives: ["supports", "helps maintain", "promotes", "may help", "designed to support"],
    recommendations: [
      "Your sector usually faces issues with disease-treatment claims.",
      "Avoid absolute words like cure, guaranteed, eliminate, reverse.",
      "Use structure/function style wording instead.",
      "Your competitors often use benefit-led but softer language.",
    ],
    competitorClaimStyle: "Mix of aggressive benefit claims and conservative structure/function wording",
    marketingAggressivenessNote: "Supplement DTC brands range from conservative (ingredient-led) to aggressive (results-focused). Benchmark against category leaders.",
    fdaFtcIndicators: ["DSHEA disclaimer required", "FTC substantiation for objective claims", "No disease claims without drug approval"],
    channelRisks: {
      website: "Homepage hero copy often overstates benefits",
      ads: "Meta/Google reject health transformation claims",
      influencer: "Missing #ad and disease-treatment scripts",
    },
  },
  "Skincare / Cosmetics": {
    commonMistakes: [
      "Drug-like claims (treats acne, reverses aging)",
      "Before/after exaggeration without substantiation",
      "Dermatologist endorsement without context",
      "Anti-aging cure language",
    ],
    highRiskCategories: ["Acne treatment", "Anti-aging repair", "SPF/drug crossover", "Hair regrowth"],
    riskyWords: ["cures acne", "anti-aging miracle", "reverses wrinkles", "FDA approved", "clinically proven", "permanent results"],
    saferAlternatives: ["helps reduce the appearance of", "supports skin's natural barrier", "for smoother-looking skin"],
    recommendations: [
      "Skincare brands often trip on drug-like efficacy claims.",
      "Before/after visuals need careful substantiation and disclaimers.",
      "Competitors in beauty tend to use appearance-based, not treatment-based, language.",
    ],
    competitorClaimStyle: "Appearance-based benefits with ingredient science backing",
    marketingAggressivenessNote: "Premium skincare uses science-forward but qualified claims; mass market can be more aggressive.",
    fdaFtcIndicators: ["Cosmetic vs drug boundary", "FTC before/after rules", "Ingredient claim substantiation"],
    channelRisks: {
      website: "Product pages imply treatment outcomes",
      ads: "Before/after and transformation ads flagged",
      influencer: "Medical-adjacent skin advice in scripts",
    },
  },
  "Functional Food": {
    commonMistakes: [
      "Implied disease prevention via nutrition",
      "Unauthorized health claims on packaging",
      "Misleading 'natural' or 'clean' positioning",
      "Weight loss promises in food copy",
    ],
    highRiskCategories: ["Heart health", "Blood sugar", "Weight management", "Gut healing"],
    riskyWords: ["prevents disease", "lowers cholesterol", "cures", "guaranteed weight loss", "clinically proven"],
    saferAlternatives: ["part of a balanced diet", "supports healthy eating goals", "contains nutrients that contribute to"],
    recommendations: [
      "Food brands should avoid therapeutic claims unless authorized.",
      "Nutrition claims must align with labeling regulations in your market.",
      "Competitors often lead with taste and convenience, not medical outcomes.",
    ],
    competitorClaimStyle: "Nutrition-forward with cautious health halo language",
    marketingAggressivenessNote: "Functional food sits between food and supplement — watch for crossover claims.",
    fdaFtcIndicators: ["FDA nutrition labeling", "FTC health food advertising", "FSSAI health claims (India)"],
    channelRisks: {
      website: "Health benefit stacking on product pages",
      ads: "Weight loss and disease prevention in ad copy",
      influencer: "Diet advice crossing into medical claims",
    },
  },
  "Wellness Products": {
    commonMistakes: ["Stress/anxiety treatment claims", "Sleep cure language", "Unproven wearable health metrics"],
    highRiskCategories: ["Mental health", "Sleep disorders", "Stress relief", "Biohacking performance"],
    riskyWords: ["cures insomnia", "treats anxiety", "diagnoses", "guaranteed calm", "FDA cleared"],
    saferAlternatives: ["supports relaxation", "designed for your wellness routine", "may help you unwind"],
    recommendations: ["Wellness products blur into medical claims quickly — qualify outcomes.", "Competitors emphasize lifestyle, not treatment."],
    competitorClaimStyle: "Lifestyle and routine-focused benefit language",
    marketingAggressivenessNote: "Moderate — science-washing is common in wearables and apps.",
    fdaFtcIndicators: ["FTC health product claims", "FDA device boundary for wearables"],
    channelRisks: { website: "Outcome guarantees", ads: "Mental health transformation", influencer: "Medical advice tone" },
  },
  "Herbal / Ayurvedic Products": {
    commonMistakes: ["Traditional medicine presented as disease cure", "Missing regional disclaimers", "Ancient remedy = proven claims"],
    highRiskCategories: ["Disease treatment", "Detox/cleanse", "Hormonal balance", "Immunity cure"],
    riskyWords: ["cures", "ancient cure", "guaranteed healing", "reverses disease", "100% natural safe"],
    saferAlternatives: ["traditionally used to support", "part of Ayurvedic wellness practices", "helps maintain balance"],
    recommendations: ["Herbal brands face scrutiny when traditional claims imply disease treatment.", "Competitors often balance tradition with modern structure/function language."],
    competitorClaimStyle: "Tradition-led with varying levels of claim qualification",
    marketingAggressivenessNote: "Ranges from conservative Ayurvedic positioning to aggressive detox marketing.",
    fdaFtcIndicators: ["DSHEA/FSSAI herbal rules", "FTC substantiation for traditional claims"],
    channelRisks: { website: "Cure and detox language", ads: "Transformation and cleanse claims", influencer: "Medical advice in wellness scripts" },
  },
  "Amazon / Marketplace Brand": {
    commonMistakes: ["Amazon policy violations in bullets", "Superlatives and guarantee language", "Health claims in titles"],
    highRiskCategories: ["Supplement crossover", "Pesticide claims", "Medical device language"],
    riskyWords: ["#1 best", "cure", "FDA approved", "guaranteed results", "miracle"],
    saferAlternatives: ["supports", "designed for", "helps maintain", "for everyday use"],
    recommendations: ["Marketplace listings are treated as labeling — scan titles and bullets before publish.", "Competitors optimize for conversion but risk suspension with aggressive health claims."],
    competitorClaimStyle: "Conversion-optimized with higher suspension risk",
    marketingAggressivenessNote: "Often more aggressive than own-website copy due to SEO competition.",
    fdaFtcIndicators: ["Amazon restricted products policy", "FTC endorsement rules", "FDA labeling if supplement"],
    channelRisks: { website: "Often cleaner than Amazon listing", ads: "Off-Amazon ads may be stricter", influencer: "Affiliate scripts with missing disclosures" },
  },
  "DTC Consumer Brand": {
    commonMistakes: ["Overstated sustainability claims", "Unsubstantiated performance guarantees", "Health crossover in non-health products"],
    highRiskCategories: ["Greenwashing", "Comparative superiority", "Health-adjacent benefits"],
    riskyWords: ["100% eco-friendly", "guaranteed", "world's best", "cures", "clinically proven"],
    saferAlternatives: ["designed with", "helps reduce", "compared to our previous formula"],
    recommendations: ["DTC brands compete on bold claims — benchmark aggressiveness in your niche.", "Use competitor insights to find safer differentiation angles."],
    competitorClaimStyle: "Brand-led storytelling with moderate claim risk",
    marketingAggressivenessNote: "Varies widely by category — align with your product type.",
    fdaFtcIndicators: ["FTC environmental claims", "FTC comparative advertising", "Category-specific FDA rules"],
    channelRisks: { website: "Hero claims and social proof", ads: "UGC with unverified claims", influencer: "Sponsored posts without #ad" },
  },
  Other: {
    commonMistakes: ["Absolute guarantees", "Unsubstantiated superiority", "Regulatory misrepresentation"],
    highRiskCategories: ["Health claims", "Performance guarantees", "Safety absolutes"],
    riskyWords: ["guaranteed", "cure", "FDA approved", "100% safe", "clinically proven"],
    saferAlternatives: ["supports", "designed to", "may help", "intended for"],
    recommendations: ["Select your industry in settings for sharper competitor insights.", "Avoid absolute claims without substantiation."],
    competitorClaimStyle: "Varies by product category",
    marketingAggressivenessNote: "Set your sector for a tailored benchmark.",
    fdaFtcIndicators: ["FTC truth in advertising", "FDA product-specific rules"],
    channelRisks: { website: "Homepage claims", ads: "Paid social copy", influencer: "Script and disclosure gaps" },
  },
};

export function getSectorInsights(sector: string): SectorInsight {
  const base = SECTOR_INSIGHTS[sector] || SECTOR_INSIGHTS.Other;
  return {
    sector: sector || "Other",
    productCategory: sectorToProductCategory(sector),
    estimated: true,
    ...base,
  };
}

export function buildClaimRiskComparison(input: {
  profile: BrandComplianceProfile | null;
  userHighRisk: number;
  userMediumRisk: number;
  userTotalClaims: number;
  competitorHighRisk: number;
  sectorInsight: SectorInsight;
}) {
  const brandRiskLevel =
    input.userHighRisk > 2 ? "high"
    : input.userHighRisk > 0 || input.userMediumRisk > 3 ? "medium"
    : input.userTotalClaims > 0 ? "low"
    : "unknown";

  const complianceGap =
    input.userHighRisk > input.competitorHighRisk
      ? "Your brand has more high-risk claims than scanned competitors — prioritize rewrites."
      : input.userHighRisk === 0 && input.userTotalClaims > 0
      ? "Your checked claims look cleaner than typical aggressive competitor copy."
      : "Run claim checks to compare your risk posture against sector benchmarks.";

  const aggressivenessScore = Math.min(
    100,
    40 + input.competitorHighRisk * 15 + (input.sectorInsight.riskyWords.length > 6 ? 10 : 0),
  );

  return {
    yourRiskLevel: brandRiskLevel,
    competitorClaimStyle: input.sectorInsight.competitorClaimStyle,
    complianceGap,
    marketingAggressivenessScore: aggressivenessScore,
    saferOpportunities: input.sectorInsight.saferAlternatives.slice(0, 4),
    commonRiskyWords: input.sectorInsight.riskyWords.slice(0, 8),
    estimated: true,
  };
}

export function getRecommendedNextAction(profile: BrandComplianceProfile | null, hasCompetitors: boolean): string {
  if (!profile?.sector || profile.sector === "Other") {
    return "Set your industry in onboarding or settings to unlock sector-specific competitor insights.";
  }
  if (!hasCompetitors) {
    return `Add a suggested ${profile.sector} competitor or paste their homepage copy to benchmark claim risk.`;
  }
  if (profile.mainConcern === "Amazon listing suspension") {
    return "Scan a competitor's Amazon bullets and compare against your listing copy.";
  }
  if (profile.mainConcern === "Ad copy getting rejected") {
    return "Review competitor ad language and run your scripts through Claim Checker.";
  }
  return "Paste competitor website copy and compare high-risk phrases against your saved claims.";
}