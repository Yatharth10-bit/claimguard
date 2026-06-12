import { analyzeClaim } from "@/lib/analyzeClaim";
import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { REGULATORY_SOURCES } from "@/lib/regulatorySources";
import { channelToContextType, regionToMarket, sectorToProductCategory } from "@/lib/sectorMapping";

export type RiskCard = {
  id: string;
  title: string;
  description: string;
  tone: "blue" | "mint" | "amber" | "rose" | "purple";
  prominent?: boolean;
};

export type RegulationFeedItem = {
  id: string;
  organization: string;
  title: string;
  summary: string;
  tag: string;
};

const toneClasses: Record<RiskCard["tone"], string> = {
  blue: "bg-blue-50 text-blue-600",
  mint: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
};

export function riskCardToneClass(tone: RiskCard["tone"]) {
  return toneClasses[tone];
}

export function getSectorRiskCards(profile: BrandComplianceProfile): RiskCard[] {
  const cards: RiskCard[] = [];
  const { sector, salesChannels, mainConcern } = profile;

  if (sector === "Supplements") {
    cards.push(
      { id: "supp-score", title: "Supplement claim risk score", description: "Tracks structure/function and disease-claim patterns across your products.", tone: "blue" },
      { id: "ingredient-watch", title: "Ingredient watchlist", description: "Monitors actives you listed for jurisdiction-specific restrictions.", tone: "mint" },
      { id: "disclaimer-check", title: "Disclaimer checklist", description: "Verifies required supplement disclaimers before you publish.", tone: "amber", prominent: mainConcern === "Label disclaimers" },
      { id: "fda-feed", title: "FDA/FTC/FSSAI update feed", description: "Official guidance matched to your regions and product type.", tone: "purple" },
    );
  } else if (sector === "Skincare / Cosmetics") {
    cards.push(
      { id: "cosmetic-score", title: "Cosmetic claim risk score", description: "Flags drug-like, before/after, and efficacy claims in beauty copy.", tone: "blue" },
      { id: "before-after", title: "Before/after claim warning", description: "Highlights visual and testimonial claims that need careful substantiation.", tone: "rose" },
      { id: "active-review", title: "Ingredient and active claim review", description: "Reviews niacinamide, retinol, and other active marketing language.", tone: "mint" },
      { id: "beauty-ads", title: "Beauty ad compliance checklist", description: "Checks social and paid ads for platform-specific restrictions.", tone: "amber" },
    );
  } else if (sector === "Functional Food") {
    cards.push(
      { id: "food-health", title: "Food health claim risk", description: "Reviews nutrition and benefit claims against food labeling rules.", tone: "blue" },
      { id: "nutrition-review", title: "Nutrition/benefit claim review", description: "Flags implied disease or therapeutic food claims.", tone: "mint" },
      { id: "ingredient-reg", title: "Ingredient-specific regulation watch", description: "Tracks additives and functional ingredients in your category.", tone: "purple" },
      { id: "label-checklist", title: "Label claim checklist", description: "Ensures on-pack statements align with approved wording.", tone: "amber", prominent: mainConcern === "Label disclaimers" },
    );
  } else {
    cards.push(
      { id: "general-score", title: "Product claim risk score", description: "Baseline monitoring for your sector and product type.", tone: "blue" },
      { id: "claim-review", title: "Marketing claim review", description: "Reviews website, ads, and listing copy for risky phrases.", tone: "mint" },
    );
  }

  if (salesChannels.includes("Amazon") || salesChannels.includes("Other Marketplaces")) {
    cards.push(
      { id: "amazon-compliance", title: "Amazon listing compliance", description: "Reviews titles, bullets, and A+ content for policy violations.", tone: "rose", prominent: mainConcern === "Amazon listing suspension" },
      { id: "suspension-risk", title: "Marketplace suspension risk", description: "Surfaces listing language that commonly triggers takedowns.", tone: "amber", prominent: mainConcern === "Amazon listing suspension" },
      { id: "title-bullets", title: "Product title/bullet claim checker", description: "Quick scan of high-visibility marketplace copy.", tone: "blue" },
    );
  }

  if (salesChannels.includes("Instagram / Meta Ads")) {
    cards.push(
      { id: "ad-risk", title: "Ad claim risk checker", description: "Flags health and before/after language in paid social.", tone: "rose", prominent: mainConcern === "Ad copy getting rejected" },
      { id: "caption-review", title: "Social caption review", description: "Reviews Instagram and Meta captions for policy issues.", tone: "mint" },
    );
  }

  if (mainConcern === "Risky product claims") {
    cards.forEach((card) => {
      if (card.id.includes("score") || card.id.includes("review")) card.prominent = true;
    });
  }

  if (mainConcern === "FDA / FTC / FSSAI / EU compliance") {
    cards.push({ id: "reg-watch", title: "Regulatory guidance watch", description: "Prioritized updates from agencies in your sales regions.", tone: "purple", prominent: true });
  }

  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

const REGION_COUNTRY: Record<string, string> = {
  "United States": "United States",
  India: "India",
  "European Union": "European Union",
  "United Kingdom": "United Kingdom",
  Canada: "Canada",
  Australia: "Australia",
};

export function getPersonalizedRegulationFeed(profile: BrandComplianceProfile): RegulationFeedItem[] {
  const regions = profile.salesRegions.length ? profile.salesRegions : ["United States"];
  const countries = new Set(regions.map((region) => REGION_COUNTRY[region] || region));

  const items = REGULATORY_SOURCES
    .filter((source) => countries.has(source.country))
    .sort((a, b) => Number(b.liveSync) - Number(a.liveSync))
    .slice(0, 5)
    .map((source) => ({
      id: source.id,
      organization: source.organization,
      title: source.title,
      summary: source.summary,
      tag: source.country,
    }));

  if (profile.salesChannels.includes("Amazon") || profile.salesChannels.includes("Other Marketplaces")) {
    items.unshift({
      id: "amazon-listing-review",
      organization: "ClaimGuard",
      title: "Review Amazon listing copy by pasting bullets into Copy Scanner",
      summary: "Marketplace listings are treated as labeling extensions. Scan titles, bullets, and A+ content for risky phrases.",
      tag: "Amazon",
    });
  }

  if (!items.length) {
    items.push({
      id: "general-1",
      organization: "ClaimGuard",
      title: "Complete your brand profile for tailored official-source guidance",
      summary: "Add sales regions and channels to prioritize relevant regulator references.",
      tag: "Getting started",
    });
  }

  return items.slice(0, 6);
}

export type FirstClaimPreview = {
  claim: string;
  riskLevel: "low" | "medium" | "high";
  riskLabel: string;
  reason: string;
  saferRewrite: string;
};

export function analyzeFirstClaimPreview(profile: BrandComplianceProfile): FirstClaimPreview | null {
  const claim = profile.firstClaim.trim();
  if (!claim) return null;

  // Uses deterministic rules engine — swap for AI endpoint when connected.
  const result = analyzeClaim({
    claimText: claim,
    productCategory: sectorToProductCategory(profile.sector),
    ingredients: profile.ingredients.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean),
    market: profile.salesRegions[0] ? regionToMarket(profile.salesRegions[0]) : "United States FDA + FTC",
    contextType: profile.salesChannels.find((c) => /instagram|meta|amazon|google/i.test(c))
      ? channelToContextType(profile.salesChannels.find((c) => /instagram|meta|amazon|google/i.test(c))!)
      : "Website",
  });

  const riskLabel = result.riskLevel === "high" ? "High Risk" : result.riskLevel === "medium" ? "Medium Risk" : "Lower Risk";
  const reason = result.riskyPhrases.length
    ? `This sounds like ${result.riskyPhrases.slice(0, 2).join(" or ")} language that may create compliance risk.`
    : result.explanation.split(".")[0] + ".";

  return {
    claim,
    riskLevel: result.riskLevel,
    riskLabel,
    reason,
    saferRewrite: result.saferRewrite,
  };
}