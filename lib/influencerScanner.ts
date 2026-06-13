import { analyzeClaim } from "@/lib/analyzeClaim";

export type InfluencerBriefContent = {
  do_say: string[];
  dont_say: string[];
  required_disclaimers: string[];
  generated_brief_text: string;
};

export type ScriptReviewIssue = {
  line: number;
  phrase: string;
  rule: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
};

const DEFAULT_DISCLAIMERS = [
  "These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.",
  "Individual results may vary.",
  "#ad — Paid partnership with [brand]",
];

export function generateInfluencerBrief(input: {
  productName: string;
  category: string;
  market: string;
  platform: string;
  campaignName?: string;
}): InfluencerBriefContent {
  const do_say = [
    `Talk about your experience with ${input.productName} using structure/function language (e.g. "supports," "helps maintain").`,
    "Mention how you use the product in your daily routine.",
    "Share the product name and where followers can learn more.",
  ];
  const dont_say = [
    "Do not claim the product cures, treats, prevents, or diagnoses any disease.",
    "Do not promise specific results or timelines (e.g. 'in 7 days').",
    "Do not compare to prescription drugs or make 'clinically proven' claims unless substantiated.",
    "Do not give medical advice or tell viewers to stop medication.",
  ];
  const generated_brief_text = [
    `Campaign: ${input.campaignName || input.productName} (${input.platform})`,
    `Market: ${input.market}`,
    "",
    "DO SAY:",
    ...do_say.map((line) => `• ${line}`),
    "",
    "DON'T SAY:",
    ...dont_say.map((line) => `• ${line}`),
    "",
    "REQUIRED DISCLAIMERS:",
    ...DEFAULT_DISCLAIMERS.map((line) => `• ${line}`),
  ].join("\n");

  return {
    do_say,
    dont_say,
    required_disclaimers: DEFAULT_DISCLAIMERS,
    generated_brief_text,
  };
}

export function reviewInfluencerScript(
  rawScript: string,
  product: { category: string; ingredients: string[]; market: string },
): { overall_risk: "low" | "medium" | "high"; issues: ScriptReviewIssue[]; clean_script: string } {
  const lines = rawScript.split(/\r?\n/).filter((line) => line.trim());
  const issues: ScriptReviewIssue[] = [];
  let maxRisk: "low" | "medium" | "high" = "low";
  const cleanLines: string[] = [];

  const rank = { low: 0, medium: 1, high: 2 };

  lines.forEach((line, index) => {
    const analysis = analyzeClaim({
      claimText: line,
      productCategory: product.category,
      ingredients: product.ingredients,
      market: product.market,
      contextType: "Influencer script",
    });
    cleanLines.push(analysis.saferRewrite || line);
    if (rank[analysis.riskLevel] > rank[maxRisk]) maxRisk = analysis.riskLevel;
    for (const phrase of analysis.riskyPhrases) {
      issues.push({
        line: index + 1,
        phrase,
        rule: "FDA/FTC influencer script",
        severity: analysis.riskLevel,
        suggestion: analysis.saferRewrite,
      });
    }
  });

  if (!/#ad|paid partnership|sponsored/i.test(rawScript) && rawScript.length > 40) {
    issues.push({
      line: 1,
      phrase: "(missing FTC disclosure)",
      rule: "FTC endorsement disclosure",
      severity: "medium",
      suggestion: "Add #ad or 'Paid partnership' at the start of the caption/script.",
    });
    if (maxRisk === "low") maxRisk = "medium";
  }

  return {
    overall_risk: maxRisk,
    issues,
    clean_script: cleanLines.join("\n"),
  };
}