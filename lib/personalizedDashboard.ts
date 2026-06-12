import { analyzeClaim } from "@/lib/analyzeClaim";
import type { BrandComplianceProfile } from "@/lib/brandProfile";

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

/** Placeholder feed — replace with real regulation API when available. */
export function getPersonalizedRegulationFeed(profile: BrandComplianceProfile): RegulationFeedItem[] {
  const items: RegulationFeedItem[] = [];
  const { salesRegions, salesChannels, sector } = profile;

  if (salesRegions.includes("India")) {
    items.push(
      { id: "fssai-label", organization: "FSSAI", title: "Labeling and disclaimer reminders for health supplements", summary: "Review structure/function wording and mandatory disclaimers on Indian labels.", tag: "India" },
      { id: "fssai-claims", organization: "FSSAI", title: "Permitted vs prohibited product claims", summary: "Avoid disease-treatment language on food and supplement marketing in India.", tag: "India" },
    );
  }
  if (salesRegions.includes("United States")) {
    items.push(
      { id: "fda-sf", organization: "FDA", title: "Structure/function claim guidance", summary: "Use qualified support language instead of disease treatment claims.", tag: "United States" },
      { id: "ftc-ads", organization: "FTC", title: "Advertising substantiation reminders", summary: "Ensure objective claims in ads and listings are truthful and substantiated.", tag: "United States" },
    );
  }
  if (salesRegions.includes("European Union")) {
    items.push(
      { id: "eu-health", organization: "EFSA / EU", title: "EU health claim authorization", summary: "Only use authorized health claims on food and supplement products in the EU.", tag: "European Union" },
      { id: "eu-cosmetics", organization: "EU Cosmetics", title: "Cosmetic claim restrictions", summary: "Avoid medicinal claims on skincare and beauty product copy.", tag: "European Union" },
    );
  }
  if (salesRegions.includes("United Kingdom")) {
    items.push({ id: "uk-claims", organization: "UK FSA / ASA", title: "UK food and supplement advertising rules", summary: "Review health claims against UK nutrition and health claims regulations.", tag: "United Kingdom" });
  }
  if (salesChannels.includes("Amazon")) {
    items.push({ id: "amazon-policy", organization: "Amazon", title: "Listing policy: prohibited supplement claims", summary: "Remove cure, treat, and prevent language from titles, bullets, and images.", tag: "Amazon" });
  }
  if (sector === "Skincare / Cosmetics") {
    items.push({ id: "beauty-ads", organization: "ASA / FTC", title: "Before/after and efficacy claims in beauty ads", summary: "Substantiate visible results claims and avoid implying medical outcomes.", tag: sector });
  }

  if (!items.length) {
    items.push(
      { id: "general-1", organization: "ClaimGuard", title: "Complete your brand profile for tailored updates", summary: "Add sales regions and channels to see relevant regulatory reminders.", tag: "Getting started" },
    );
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
    productCategory: profile.sector || "Dietary Supplement",
    ingredients: profile.ingredients.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean),
    market: profile.salesRegions[0] || "United States",
    contextType: profile.salesChannels.includes("Instagram / Meta Ads") ? "Ad copy" : "Website",
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