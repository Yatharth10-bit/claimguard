/** Maps onboarding sector labels to rules-engine product categories used in regression tests. */
export function sectorToProductCategory(sector: string): string {
  const map: Record<string, string> = {
    Supplements: "Dietary Supplement",
    "Functional Food": "Functional Food",
    "Skincare / Cosmetics": "Cosmetic",
    "Wellness Products": "Dietary Supplement",
    "Herbal / Ayurvedic Products": "Dietary Supplement",
    "Amazon / Marketplace Brand": "Consumer Product",
    "DTC Consumer Brand": "Consumer Product",
    Other: "Other",
  };
  return map[sector] || sector || "Other";
}

export function regionToMarket(region: string): string {
  const map: Record<string, string> = {
    India: "India FSSAI",
    "United States": "United States FDA + FTC",
    "United Kingdom": "United Kingdom",
    "European Union": "European Union",
    Canada: "Canada",
    Australia: "Australia",
    "Global / Multiple Regions": "United States FDA + FTC",
    "Not sure yet": "United States FDA + FTC",
  };
  return map[region] || region || "United States FDA + FTC";
}

export function channelToContextType(channel: string): string {
  if (/amazon/i.test(channel)) return "Amazon listing";
  if (/instagram|meta|google ads/i.test(channel)) return "Ad copy";
  if (/retail|distributor/i.test(channel)) return "Label";
  return "Website";
}