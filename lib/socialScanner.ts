import { analyzeClaim } from "@/lib/analyzeClaim";

export type SocialScanFlag = {
  phrase: string;
  rule_triggered: string;
  severity: "low" | "medium" | "high";
  rewrite_suggestion: string;
};

export function scanSocialCaption(
  caption: string,
  product: { category: string; ingredients: string[]; market: string },
  platform: string,
): { scan_status: "clean" | "flagged"; flags: SocialScanFlag[] } {
  const analysis = analyzeClaim({
    claimText: caption,
    productCategory: product.category,
    ingredients: product.ingredients,
    market: product.market,
    contextType: platform === "tiktok" ? "Social media" : "Social media",
  });

  const flags: SocialScanFlag[] = analysis.riskyPhrases.map((phrase) => ({
    phrase,
    rule_triggered: "FDA/FTC social caption risk",
    severity: analysis.riskLevel,
    rewrite_suggestion: analysis.saferRewrite,
  }));

  if (/#ad\b|paid partnership|sponsored/i.test(caption) === false && /(discount|buy now|shop link|use code)/i.test(caption)) {
    flags.push({
      phrase: "(missing disclosure)",
      rule_triggered: "FTC endorsement disclosure",
      severity: "medium",
      rewrite_suggestion: "Add #ad or 'Paid partnership with [brand]' when promoting products.",
    });
  }

  const scan_status = flags.some((f) => f.severity !== "low") ? "flagged" : "clean";
  return { scan_status, flags };
}