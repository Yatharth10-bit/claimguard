import type { CopilotClaimContext } from "@/lib/complianceCopilot";

export type ComplianceSop = {
  title: string;
  purpose: string;
  steps: string[];
  escalation: string;
  documentation: string[];
  disclaimer: string;
};

export function generateComplianceSop(context: CopilotClaimContext): ComplianceSop {
  const productLabel = context.productCategory.toLowerCase();
  const channel = context.contextType.toLowerCase();

  const steps = [
    `Pause publication of the flagged ${channel} copy for ${productLabel} products.`,
    context.riskyPhrases.length
      ? `Remove or replace risky phrases: ${context.riskyPhrases.join(", ")}.`
      : "Review broad benefit language and add appropriate qualifiers.",
    `Apply the safer rewrite baseline: "${context.saferRewrite}"`,
    "Confirm the final wording matches formulation, intended audience, and available substantiation files.",
    /supplement/i.test(context.productCategory)
      ? "Verify the full DSHEA disclaimer appears on labels and nearby marketing when structure/function claims are used."
      : "Verify channel-specific advertising and labeling rules for this product category.",
    "Re-run ClaimGuard analysis and save the approved wording to the claim library.",
    context.riskLevel === "high"
      ? "Route the final version to a qualified compliance professional before publishing."
      : "Document reviewer, date, and evidence references in the audit trail.",
  ];

  return {
    title: `Compliance SOP — ${context.contextType} claim review`,
    purpose: `Standardize remediation for a ${context.riskLevel}-risk claim before it is published on ${context.contextType.toLowerCase()}.`,
    steps,
    escalation: context.riskLevel === "high"
      ? "Escalate to qualified compliance counsel before any customer-facing publication."
      : "Escalate if substantiation is missing or the claim implies treatment, prevention, or cure.",
    documentation: [
      "Original claim text and safer rewrite",
      "Risk score and flagged phrases",
      "Linked official regulatory sources",
      "Reviewer approval status and date",
    ],
    disclaimer: "This SOP is an operational workflow template. It is not legal advice.",
  };
}