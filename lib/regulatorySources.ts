export type RegulatorySource = {
  id: string;
  title: string;
  organization: "FDA" | "FTC" | "FSSAI";
  country: "United States" | "India";
  category: string;
  url: string;
  summary: string;
  sourceType: "updates" | "guidance";
};

export const REGULATORY_SOURCES: RegulatorySource[] = [
  {
    id: "fda-dietary-supplement-updates",
    title: "FDA What's New in Dietary Supplements",
    organization: "FDA",
    country: "United States",
    category: "Dietary Supplements",
    url: "https://www.fda.gov/food/dietary-supplements/whats-new-dietary-supplements",
    summary: "Official FDA notices and updates concerning dietary supplements.",
    sourceType: "updates",
  },
  {
    id: "fda-structure-function-claims",
    title: "FDA Structure/Function Claims Guidance",
    organization: "FDA",
    country: "United States",
    category: "Claims",
    url: "https://www.fda.gov/food/food-labeling-nutrition/structurefunction-claims",
    summary: "Official FDA guidance describing structure/function claims and related requirements.",
    sourceType: "guidance",
  },
  {
    id: "fda-dietary-supplement-labeling",
    title: "FDA Dietary Supplement Labeling Guide",
    organization: "FDA",
    country: "United States",
    category: "Labeling",
    url: "https://www.fda.gov/food/dietary-supplements-guidance-documents-regulatory-information/dietary-supplement-labeling-guide",
    summary: "Official FDA guidance for dietary supplement labeling.",
    sourceType: "guidance",
  },
  {
    id: "ftc-health-products-compliance",
    title: "FTC Health Products Compliance Guidance",
    organization: "FTC",
    country: "United States",
    category: "Advertising",
    url: "https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance",
    summary: "Official FTC guidance for substantiating health-related advertising claims.",
    sourceType: "guidance",
  },
  {
    id: "fssai-food-regulation-updates",
    title: "FSSAI Food Regulation Updates",
    organization: "FSSAI",
    country: "India",
    category: "Food Regulations",
    url: "https://fssai.gov.in/recent-whatnew.php",
    summary: "Official FSSAI notices, amendments, and food regulation updates.",
    sourceType: "updates",
  },
];

export function getSourceReferences(input: { market: string; productCategory: string; contextType: string }) {
  const isIndia = /india|fssai/i.test(input.market);
  const references = REGULATORY_SOURCES.filter((source) => {
    if (isIndia) return source.organization === "FSSAI";
    if (source.organization === "FSSAI") return false;
    if (/dietary supplement/i.test(input.productCategory)) return true;
    return source.organization === "FTC" || source.id === "fda-structure-function-claims";
  });
  return references.map(({ title, url, organization, category }) => ({ title, url, organization, category }));
}
