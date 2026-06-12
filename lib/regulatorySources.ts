import { CATEGORY_TOPICS, marketKey } from "@/lib/complianceData";

export type RegulatorySource = {
  id: string;
  title: string;
  organization: string;
  country: string;
  category: string;
  url: string;
  summary: string;
  sourceType: "updates" | "guidance";
  topics: string[];
  liveSync?: boolean;
};

const source = (
  id: string, title: string, organization: string, country: string, category: string,
  url: string, summary: string, topics: string[], sourceType: RegulatorySource["sourceType"] = "guidance", liveSync = false,
): RegulatorySource => ({ id, title, organization, country, category, url, summary, topics, sourceType, liveSync });

export const REGULATORY_SOURCES: RegulatorySource[] = [
  source("ftc-advertising", "FTC Advertising and Marketing Guidance", "FTC", "United States", "Advertising", "https://www.ftc.gov/business-guidance/advertising-marketing", "Truth-in-advertising guidance covering deceptive, unfair, and unsupported claims.", ["advertising", "substantiation", "consumer protection"], "guidance", true),
  source("ftc-health-products", "FTC Health Products Compliance Guidance", "FTC", "United States", "Health Advertising", "https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance", "Scientific substantiation guidance for health-related product advertising.", ["health claim", "supplement", "therapeutic", "medical device", "substantiation"]),
  source("ftc-endorsements", "FTC Endorsements, Influencers, and Reviews", "FTC", "United States", "Influencers", "https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews", "Disclosure and truthfulness requirements for endorsements, reviews, and influencer marketing.", ["advertising", "influencer", "testimonial", "review"]),
  source("ftc-green-guides", "FTC Environmental Claims: Green Guides Summary", "FTC", "United States", "Environmental Claims", "https://www.ftc.gov/business-guidance/resources/environmental-claims-summary-green-guides", "Guidance for specific, qualified, and substantiated environmental marketing claims.", ["environmental", "recyclable", "biodegradable", "carbon", "sustainable"]),
  source("fda-supplement-updates", "FDA What's New in Dietary Supplements", "FDA", "United States", "Dietary Supplements", "https://www.fda.gov/food/dietary-supplements/whats-new-dietary-supplements", "Official FDA dietary supplement notices and updates.", ["supplement", "ingredient", "label"], "updates", true),
  source("fda-structure-function", "FDA Structure/Function Claims", "FDA", "United States", "Food and Supplement Claims", "https://www.fda.gov/food/food-labeling-nutrition/structurefunction-claims", "Requirements and boundaries for structure/function claims.", ["supplement", "food", "health claim", "structure/function"]),
  source("fda-supplement-label", "FDA Dietary Supplement Labeling Guide", "FDA", "United States", "Supplement Labeling", "https://www.fda.gov/food/dietary-supplements-guidance-documents-regulatory-information/dietary-supplement-labeling-guide", "Official dietary supplement labeling guidance.", ["supplement", "label", "ingredient"]),
  source("fda-cosmetic-boundary", "FDA: Is It a Cosmetic, a Drug, or Both?", "FDA", "United States", "Cosmetics", "https://www.fda.gov/cosmetics/cosmetics-laws-regulations/it-cosmetic-drug-or-both-or-it-soap", "Explains how intended use and claims can turn a cosmetic into a drug.", ["cosmetic", "drug claim", "intended use", "skin"]),
  source("fda-cosmetic-label", "FDA Cosmetics Labeling Guide", "FDA", "United States", "Cosmetics", "https://www.fda.gov/cosmetics/cosmetics-labeling-regulations/cosmetics-labeling-guide", "Step-by-step cosmetic labeling guidance.", ["cosmetic", "label", "ingredient"]),
  source("fda-device-label", "FDA Device Labeling", "FDA", "United States", "Medical Devices", "https://www.fda.gov/medical-devices/overview-device-regulation/device-labeling", "Overview of labeling requirements for medical devices.", ["medical device", "diagnostic", "label", "intended use"]),
  source("fda-drug-promotion", "FDA Office of Prescription Drug Promotion", "FDA", "United States", "Drug Promotion", "https://www.fda.gov/about-fda/cder-offices-and-divisions/office-prescription-drug-promotion-opdp", "Prescription drug promotion should be truthful, balanced, and accurately communicated.", ["prescription", "drug", "promotion", "fair balance"]),
  source("fda-tobacco", "FDA Tobacco Labeling and Warning Statements", "FDA", "United States", "Tobacco", "https://www.fda.gov/tobacco-products/products-guidance-regulations/labeling-and-warning-statements-tobacco-products", "Warning and labeling requirements for tobacco products.", ["tobacco", "warning", "modified risk", "label"]),
  source("fda-pet-food", "FDA Animal Food Labeling and Pet Food Claims", "FDA", "United States", "Animal Food", "https://www.fda.gov/animal-veterinary/animal-foods-feeds/animal-food-labeling-and-pet-food-claims", "Labeling and claim guidance for animal food and pet food.", ["animal food", "pet food", "veterinary", "disease claim"]),
  source("epa-pesticide-label", "EPA Pesticide Labeling Questions and Answers", "EPA", "United States", "Pesticides", "https://www.epa.gov/pesticide-labels/pesticide-labeling-questions-answers", "Official guidance covering pesticide, antimicrobial, and advertising claims.", ["pesticide", "antimicrobial", "disinfect", "label", "efficacy"]),
  source("epa-cleaner-claims", "EPA: Determining If a Cleaning Product Is a Pesticide", "EPA", "United States", "Household Cleaners", "https://www.epa.gov/pesticide-registration/determining-if-cleaning-product-pesticide-under-fifra", "Explains when cleaning-product claims become pesticidal claims.", ["cleaner", "antimicrobial", "disinfect", "kills germs"]),
  source("usda-organic", "USDA Labeling Organic Products", "USDA", "United States", "Organic Claims", "https://www.ams.usda.gov/rules-regulations/organic/labeling", "Requirements for organic claims and use of the USDA organic seal.", ["food", "organic", "label", "certification"]),
  source("cpsc-children", "CPSC Children's Products", "CPSC", "United States", "Children's Products", "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Childrens-Products", "Classification, testing, certification, and safety requirements for children's products.", ["children", "toy", "safety", "testing"]),
  source("cpsc-labeling", "CPSC Labeling Requirements Overview", "CPSC", "United States", "Consumer Products", "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/CPSC-Labeling-Requirements-Overview", "Common U.S. consumer-product labeling requirements.", ["consumer product", "children", "label", "safety"]),
  source("ttb-advertising", "TTB Alcohol Beverage Advertising", "TTB", "United States", "Alcohol", "https://www.ttb.gov/about-ttb/what-we-do/program-areas/advertising", "Federal alcohol beverage advertising requirements.", ["alcohol", "beverage", "advertising", "health claim"]),
  source("cfpb-advertising", "CFPB Regulation Z Advertising", "CFPB", "United States", "Financial Services", "https://www.consumerfinance.gov/rules-policy/regulations/1026/24", "Advertising requirements and prohibited misleading claims for consumer credit.", ["financial", "credit", "mortgage", "debt", "advertising"]),
  source("eu-food-claims", "EU Nutrition and Health Claims", "European Commission", "European Union", "Food Claims", "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims_en", "EU rules require food claims to be clear, accurate, authorized where required, and scientifically supported.", ["food", "nutrition", "health claim", "supplement"]),
  source("eu-cosmetics", "European Commission Cosmetics", "European Commission", "European Union", "Cosmetics", "https://single-market-economy.ec.europa.eu/sectors/cosmetics_en", "EU cosmetics safety, market, and claims information.", ["cosmetic", "beauty", "skin", "label"]),
  source("uk-food-claims", "UK Nutrition and Health Claims Guidance", "GOV.UK", "United Kingdom", "Food Claims", "https://www.gov.uk/government/publications/nutrition-and-health-claims-guidance-to-compliance-with-regulation-ec-1924-2006-on-nutrition-and-health-claims-made-on-foods/nutrition-and-health-claims-guidance-to-compliance-with-regulation-ec-19242006", "UK guidance for compliant nutrition and health claims on foods.", ["food", "nutrition", "health claim", "supplement"]),
  source("uk-supplements", "UK Food Supplements Guidance", "Food Standards Agency", "United Kingdom", "Food Supplements", "https://www.food.gov.uk/business-guidance/food-supplements", "UK food supplement labeling and business guidance.", ["supplement", "food", "label"]),
  source("uk-mhra", "MHRA Medicines and Medical Devices", "MHRA", "United Kingdom", "Medicines and Devices", "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency", "Official UK regulator information for medicines and medical devices.", ["medicine", "medical device", "therapeutic", "advertising"]),
  source("fssai-regulations", "FSSAI Food Safety and Standards Regulations", "FSSAI", "India", "Food Regulations", "https://fssai.gov.in/cms/food-safety-and-standards-regulations.php", "Official Indian food, nutraceutical, advertising, claims, labeling, organic, and packaging regulations.", ["food", "supplement", "health claim", "label", "organic"], "updates", true),
  source("fssai-updates", "FSSAI Recent Updates", "FSSAI", "India", "Food Updates", "https://fssai.gov.in/recent-whatnew.php", "Official FSSAI notices and amendments.", ["food", "supplement", "label", "safety"], "updates", true),
  source("canada-food-claims", "CFIA Health Claims on Food Labels", "CFIA", "Canada", "Food Claims", "https://inspection.canada.ca/en/food-labels/labelling/industry/health-claims", "Canadian requirements for food health claims and overall label impressions.", ["food", "nutrition", "health claim", "label"]),
  source("canada-cosmetics", "Health Canada Cosmetic Advertising, Labelling and Ingredients", "Health Canada", "Canada", "Cosmetics", "https://www.canada.ca/en/health-canada/services/cosmetics/cosmetic-advertising-labelling-ingredients.html", "Canadian guidance for accurate cosmetic claims, advertising, labels, and ingredients.", ["cosmetic", "advertising", "label", "ingredient"]),
  source("canada-nhp", "Health Canada Natural Health Product Labelling", "Health Canada", "Canada", "Natural Health Products", "https://www.canada.ca/en/health-canada/services/drugs-health-products/natural-non-prescription/legislation-guidelines/guidance-documents/labelling.html", "Natural health product labeling guidance.", ["supplement", "therapeutic", "health claim", "label"]),
  source("tga-code", "TGA Applying the Advertising Code", "TGA", "Australia", "Therapeutic Goods", "https://www.tga.gov.au/products/regulations-all-products/advertising/applying-advertising-code", "Australian therapeutic goods advertising must be accurate, balanced, safe, and not misleading.", ["therapeutic", "medicine", "medical device", "advertising"]),
  source("tga-social", "TGA Advertising Therapeutic Goods on Social Media", "TGA", "Australia", "Social Media", "https://www.tga.gov.au/resources/guidance/advertising-therapeutic-goods-social-media", "Guidance for therapeutic-good advertising on social media and through influencers.", ["therapeutic", "social media", "influencer", "advertising"]),
  source("accc-green", "ACCC Environmental and Sustainability Claims", "ACCC", "Australia", "Environmental Claims", "https://www.accc.gov.au/business/advertising-and-promotions/environmental-and-sustainability-claims", "Australian guidance to avoid misleading environmental and sustainability claims.", ["environmental", "sustainable", "carbon", "recyclable"]),
];

export function getSourceReferences(input: { market: string; productCategory: string; contextType: string; matchedSourceIds?: string[] }) {
  const country = marketKey(input.market);
  const topics = CATEGORY_TOPICS[input.productCategory] || CATEGORY_TOPICS.Other;
  const contextTopics = /social|influencer/i.test(input.contextType) ? ["influencer", "social media", "testimonial"] : ["advertising"];
  const sourceIds = new Set(input.matchedSourceIds || []);
  return REGULATORY_SOURCES
    .map((item) => {
      const topicMatches = item.topics.filter((topic) => topics.includes(topic)).length;
      const contextMatches = item.topics.filter((topic) => contextTopics.includes(topic)).length;
      return {
        item,
        topicMatches,
        score: (sourceIds.has(item.id) ? 12 : 0) + topicMatches * 3 + contextMatches * 2
          + (item.organization === "FTC" && country === "United States" ? 1 : 0),
      };
    })
    .filter(({ item, score, topicMatches }) => item.country === country && score > 0 && (sourceIds.has(item.id) || topicMatches >= 2 || item.id === "ftc-advertising"))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ item }) => ({ title: item.title, url: item.url, organization: item.organization, category: item.category }));
}
