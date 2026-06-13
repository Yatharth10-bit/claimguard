export type ComplianceScoreInput = {
  products: number;
  highRiskClaims: number;
  mediumRiskClaims: number;
  openTasks: number;
  amazonHighRisk: number;
  socialFlagged: number;
  labelHighRisk: number;
  substantiationEntries: number;
  claimsCount: number;
};

export function calculateComplianceScore(input: ComplianceScoreInput): {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  checklist: { id: string; label: string; done: boolean }[];
} {
  let score = 100;
  score -= input.highRiskClaims * 8;
  score -= input.mediumRiskClaims * 3;
  score -= input.openTasks * 2;
  score -= input.amazonHighRisk * 6;
  score -= input.socialFlagged * 4;
  score -= input.labelHighRisk * 5;
  if (input.products === 0) score -= 15;
  if (input.claimsCount > 0 && input.substantiationEntries === 0) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  const summary =
    grade === "A" ? "Strong compliance posture — keep documenting substantiation."
    : grade === "B" ? "Good foundation — resolve remaining medium-risk items."
    : grade === "C" ? "Needs attention — prioritize high-risk claims and Amazon copy."
    : grade === "D" ? "Elevated risk — several open compliance gaps."
    : "Critical gaps — review high-risk claims before publishing.";

  const checklist = [
    { id: "products", label: "Add at least one product", done: input.products > 0 },
    { id: "claims", label: "Run a claim check", done: input.claimsCount > 0 },
    { id: "high-risk", label: "Resolve all high-risk claims", done: input.highRiskClaims === 0 },
    { id: "amazon", label: "Scan Amazon listings", done: input.amazonHighRisk === 0 },
    { id: "social", label: "Clear flagged social posts", done: input.socialFlagged === 0 },
    { id: "substantiation", label: "Link substantiation to claims", done: input.substantiationEntries > 0 || input.claimsCount === 0 },
    { id: "tasks", label: "Close open compliance tasks", done: input.openTasks === 0 },
  ];

  return { score, grade, summary, checklist };
}