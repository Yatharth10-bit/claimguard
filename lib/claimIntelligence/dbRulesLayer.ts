import type { ClaimRule, RuleSeverity } from "@/lib/claimRules";

export type DbClaimRuleRow = {
  pattern: string;
  sector: string;
  region: string;
  risk_category: string;
  severity: string;
  explanation: string;
  safer_alternative_pattern: string;
};

export function matchDbClaimRules(
  claimText: string,
  dbRules: DbClaimRuleRow[],
  productCategory?: string,
  market?: string,
): ClaimRule[] {
  const lower = claimText.toLowerCase();
  const matches: ClaimRule[] = [];

  for (const row of dbRules) {
    if (row.sector && productCategory && !productCategory.toLowerCase().includes(row.sector.toLowerCase()) && !row.sector.toLowerCase().includes(productCategory.toLowerCase())) {
      continue;
    }
    if (row.region && market && !market.toLowerCase().includes(row.region.toLowerCase().split(" ")[0])) {
      continue;
    }
    const pattern = row.pattern.toLowerCase();
    if (!pattern || !lower.includes(pattern)) continue;

    matches.push({
      id: `db-${pattern.slice(0, 24)}`,
      phrase: row.pattern,
      severity: (row.severity === "high" ? "high" : "medium") as RuleSeverity,
      displayPhrase: row.pattern,
      explanation: row.explanation || "This approved learning rule flagged similar wording.",
      sourceIds: ["ftc-advertising"],
      categories: row.sector ? [row.sector] : undefined,
    });
  }

  return matches;
}