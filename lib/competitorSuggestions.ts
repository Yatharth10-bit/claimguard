export type CompetitorSuggestion = {
  brand_name: string;
  website_url?: string;
  amazon_asin?: string;
  rationale: string;
  claim_style: "aggressive" | "moderate" | "conservative";
};

export const COMPETITOR_SUGGESTIONS_BY_SECTOR: Record<string, CompetitorSuggestion[]> = {
  Supplements: [
    { brand_name: "AG1", website_url: "https://drinkag1.com", rationale: "High-visibility greens — structure/function language benchmark", claim_style: "moderate" },
    { brand_name: "Ritual", website_url: "https://ritual.com", rationale: "Transparent supplement positioning", claim_style: "conservative" },
    { brand_name: "Athletic Greens", website_url: "https://drinkag1.com", rationale: "Category leader for wellness copy patterns", claim_style: "moderate" },
    { brand_name: "Olly", website_url: "https://www.olly.com", rationale: "Mass-market gummy supplement claims", claim_style: "moderate" },
  ],
  "Functional Food": [
    { brand_name: "Magic Spoon", website_url: "https://magicspoon.com", rationale: "Functional cereal benefit claims", claim_style: "moderate" },
    { brand_name: "Huel", website_url: "https://huel.com", rationale: "Meal replacement nutrition claims", claim_style: "conservative" },
    { brand_name: "Koia", website_url: "https://drinkkoia.com", rationale: "Protein + functional beverage copy", claim_style: "moderate" },
  ],
  "Skincare / Cosmetics": [
    { brand_name: "The Ordinary", website_url: "https://theordinary.com", rationale: "Ingredient-led, conservative efficacy language", claim_style: "conservative" },
    { brand_name: "Drunk Elephant", website_url: "https://www.drunkelephant.com", rationale: "Premium skincare benefit claims", claim_style: "moderate" },
    { brand_name: "CeraVe", website_url: "https://www.cerave.com", rationale: "Dermatologist-recommended positioning", claim_style: "moderate" },
  ],
  "Wellness Products": [
    { brand_name: "Calm", website_url: "https://www.calm.com", rationale: "Mental wellness app/product claims", claim_style: "moderate" },
    { brand_name: "Whoop", website_url: "https://www.whoop.com", rationale: "Performance and recovery messaging", claim_style: "moderate" },
  ],
  "Herbal / Ayurvedic Products": [
    { brand_name: "Himalaya", website_url: "https://himalayawellness.com", rationale: "Herbal tradition + modern claims", claim_style: "moderate" },
    { brand_name: "Organic India", website_url: "https://organicindia.com", rationale: "Ayurvedic supplement positioning", claim_style: "conservative" },
  ],
  "Amazon / Marketplace Brand": [
    { brand_name: "Anker", website_url: "https://www.anker.com", rationale: "Amazon-native DTC claim patterns", claim_style: "moderate" },
    { brand_name: "Native", website_url: "https://www.nativecos.com", rationale: "Marketplace personal care claims", claim_style: "moderate" },
  ],
  "DTC Consumer Brand": [
    { brand_name: "Glossier", website_url: "https://www.glossier.com", rationale: "DTC beauty claim style", claim_style: "moderate" },
    { brand_name: "Allbirds", website_url: "https://www.allbirds.com", rationale: "Sustainability + performance claims", claim_style: "conservative" },
  ],
  Other: [
    { brand_name: "Dove", website_url: "https://www.dove.com", rationale: "Mass-market benefit claim benchmark", claim_style: "moderate" },
    { brand_name: "Colgate", website_url: "https://www.colgate.com", rationale: "Oral care efficacy language", claim_style: "conservative" },
  ],
};

export function getSuggestedCompetitors(sector: string, limit = 4): CompetitorSuggestion[] {
  const list = COMPETITOR_SUGGESTIONS_BY_SECTOR[sector]
    || COMPETITOR_SUGGESTIONS_BY_SECTOR.Other
    || [];
  return list.slice(0, limit);
}