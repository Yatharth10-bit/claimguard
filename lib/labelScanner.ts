import { analyzeClaim } from "@/lib/analyzeClaim";

export type LabelScanIssue = {
  field: string;
  phrase: string;
  rule: string;
  severity: "low" | "medium" | "high";
  rewrite: string;
};

export function scanLabelText(
  extractedText: string,
  product: { category: string; ingredients: string[]; market: string },
): {
  issues: LabelScanIssue[];
  claims_found: string[];
  overall_risk: "low" | "medium" | "high";
  supplement_facts_raw: Record<string, unknown>;
} {
  const lines = extractedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const claims_found: string[] = [];
  const issues: LabelScanIssue[] = [];
  let maxRisk: "low" | "medium" | "high" = "low";
  const rank = { low: 0, medium: 1, high: 2 };

  const supplementSection = lines.filter((l) =>
    /supplement facts|nutrition facts|serving size|amount per serving/i.test(l),
  );
  const supplement_facts_raw: Record<string, unknown> = {
    detected: supplementSection.length > 0,
    line_count: supplementSection.length,
    preview: supplementSection.slice(0, 8),
  };

  const claimCandidates = lines.filter((line) =>
    line.length > 12
    && !/^(ingredients|other ingredients|distributed by|manufactured|serving|daily value)/i.test(line)
    && /[a-z]/i.test(line),
  );

  for (const line of claimCandidates) {
    if (/supports?|helps?|promotes?|maintains?|aids?|boosts?|improves?|enhances?/i.test(line)) {
      claims_found.push(line);
    }
    const analysis = analyzeClaim({
      claimText: line,
      productCategory: product.category,
      ingredients: product.ingredients,
      market: product.market,
      contextType: "Label",
    });
    if (rank[analysis.riskLevel] > rank[maxRisk]) maxRisk = analysis.riskLevel;
    for (const phrase of analysis.riskyPhrases) {
      issues.push({
        field: "label copy",
        phrase,
        rule: "FDA label claim risk",
        severity: analysis.riskLevel,
        rewrite: analysis.saferRewrite,
      });
    }
  }

  if (!/not intended to diagnose|not been evaluated by the food and drug administration/i.test(extractedText)) {
    issues.push({
      field: "disclaimer",
      phrase: "(missing FDA disclaimer)",
      rule: "DSHEA structure/function disclaimer",
      severity: "medium",
      rewrite: "Add: These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.",
    });
    if (maxRisk === "low") maxRisk = "medium";
  }

  return { issues, claims_found, overall_risk: maxRisk, supplement_facts_raw };
}