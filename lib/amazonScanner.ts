import { analyzeClaim, type AnalyzeClaimInput } from "@/lib/analyzeClaim";

export const AMAZON_POLICY_VERSION = "2026-03";

export type AmazonScanIssue = {
  field: string;
  phrase: string;
  rule: string;
  severity: "low" | "medium" | "high";
  rewrite: string;
};

const AMAZON_SPECIFIC_PATTERNS: Array<{
  pattern: RegExp;
  rule: string;
  severity: "medium" | "high";
  rewrite: string;
}> = [
  {
    pattern: /\braw material equivalent\b/i,
    rule: "Amazon: ingredient weight inflation phrasing",
    severity: "high",
    rewrite: "State actual ingredient amounts per serving as listed on Supplement Facts.",
  },
  {
    pattern: /\b\d+\s*%\s*(more|greater|higher)\s*(bioavailable|absorption|effective)/i,
    rule: "Amazon: percentage efficacy without Supplement Facts support",
    severity: "high",
    rewrite: "Remove comparative percentage claims unless substantiated on the label.",
  },
  {
    pattern: /\b(guaranteed|guarantee|100%|eliminates?|miracle)\b/i,
    rule: "Amazon: absolute efficacy language",
    severity: "high",
    rewrite: "Use structure/function language such as 'supports' instead of guarantees.",
  },
  {
    pattern: /\bclinically proven to (cure|treat|eliminate|prevent)\b/i,
    rule: "Amazon: clinically proven disease/overpromise language",
    severity: "high",
    rewrite: "Remove disease outcomes; use 'supports [structure/function benefit]'.",
  },
  {
    pattern: /\b(cures?|treats?|prevents?|diagnos(e|es|ing)|heals?)\s+(the\s+)?[a-z]+/i,
    rule: "Amazon/FDA: disease claim in listing copy",
    severity: "high",
    rewrite: "Reframe as structure/function support without naming disease treatment.",
  },
];

function baseInput(
  claimText: string,
  product: { category: string; ingredients: string[]; market: string },
): AnalyzeClaimInput {
  return {
    claimText,
    productCategory: product.category,
    ingredients: product.ingredients,
    market: product.market,
    contextType: "Amazon listing",
  };
}

function extractMatches(text: string, field: string, product: { category: string; ingredients: string[]; market: string }): AmazonScanIssue[] {
  const issues: AmazonScanIssue[] = [];
  if (!text.trim()) return issues;

  const analysis = analyzeClaim(baseInput(text, product));
  for (const phrase of analysis.riskyPhrases) {
    issues.push({
      field,
      phrase,
      rule: "FDA/FTC claim risk",
      severity: analysis.riskLevel,
      rewrite: analysis.saferRewrite,
    });
  }

  for (const rule of AMAZON_SPECIFIC_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match) {
      issues.push({
        field,
        phrase: match[0],
        rule: rule.rule,
        severity: rule.severity,
        rewrite: rule.rewrite,
      });
    }
  }

  return issues;
}

function dedupeIssues(issues: AmazonScanIssue[]): AmazonScanIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.field}|${issue.phrase.toLowerCase()}|${issue.rule}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function overallRisk(issues: AmazonScanIssue[]): "low" | "medium" | "high" {
  if (issues.some((i) => i.severity === "high")) return "high";
  if (issues.some((i) => i.severity === "medium")) return "medium";
  return "low";
}

export function scanAmazonListing(input: {
  title: string;
  bullet_points: string[];
  description: string;
  backend_keywords?: string | null;
  product: { category: string; ingredients: string[]; market: string };
  labelClaims?: string[];
}): { overall_risk: "low" | "medium" | "high"; issues: AmazonScanIssue[] } {
  let issues: AmazonScanIssue[] = [];

  issues.push(...extractMatches(input.title, "title", input.product));
  input.bullet_points.forEach((bullet, index) => {
    issues.push(...extractMatches(bullet, `bullet_${index + 1}`, input.product));
  });
  issues.push(...extractMatches(input.description, "description", input.product));
  if (input.backend_keywords?.trim()) {
    issues.push(...extractMatches(input.backend_keywords, "backend_keywords", input.product));
  }

  if (input.labelClaims?.length) {
    const listingText = [input.title, ...input.bullet_points, input.description].join(" ").toLowerCase();
    for (const claim of input.labelClaims) {
      const normalized = claim.toLowerCase().trim();
      if (!normalized) continue;
      const onLabel = input.labelClaims.some((c) => c.toLowerCase().includes(normalized));
      const inListing = listingText.includes(normalized);
      if (inListing && !onLabel) {
        issues.push({
          field: "cross_check",
          phrase: claim,
          rule: "Label vs listing mismatch — claim in listing not found on approved label scan",
          severity: "medium",
          rewrite: "Align listing copy with approved label claims or update the label.",
        });
      }
    }
  }

  issues = dedupeIssues(issues);
  return { overall_risk: overallRisk(issues), issues };
}