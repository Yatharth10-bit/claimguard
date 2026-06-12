import { analyzeClaim, CLAIM_DISCLAIMER, type AnalyzeClaimInput } from "@/lib/analyzeClaim";
import { matchClaimRules } from "@/lib/claimRules";
import { getSourceReferences } from "@/lib/regulatorySources";
import { matchRegulationImpacts, type WorkflowClaim, type WorkflowProduct, type WorkflowRegulation } from "@/lib/workflow";

export type CopilotClaimContext = AnalyzeClaimInput & {
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  riskyPhrases: string[];
  explanation: string;
  saferRewrite: string;
  sources: { title: string; url: string; organization?: string; category?: string }[];
};

export type PhraseBreakdown = {
  phrase: string;
  severity: "high" | "medium";
  explanation: string;
  sourceTitles: string[];
};

export type ExplainResult = {
  summary: string;
  phraseBreakdown: PhraseBreakdown[];
  contextInsight: string;
  nextSteps: string[];
  disclaimer: string;
};

export type GuidedRewrite = {
  channel: string;
  label: string;
  rewrite: string;
  notes: string;
};

export type RegulationImpactResult = {
  summary: string;
  affectedProducts: {
    name: string;
    reason: string;
    riskLevel: "low" | "medium" | "high";
    matchedClaims: string[];
    recommendedAction: string;
  }[];
  disclaimer: string;
};

const CHANNEL_GUIDANCE: Record<string, { label: string; transform: (text: string) => string; notes: string }> = {
  "Instagram caption": {
    label: "Instagram caption",
    transform: (text) => shortenForSocial(text, 220),
    notes: "Keep benefit language soft, avoid disease terms, and pair with #ad when sponsored.",
  },
  "Amazon bullets": {
    label: "Amazon bullets",
    transform: (text) => toAmazonBullets(text),
    notes: "Use factual structure/function wording. Avoid superlatives and unapproved drug claims.",
  },
  "Meta ad": {
    label: "Meta ad",
    transform: (text) => qualifyForAds(text),
    notes: "Health ads face stricter review. Qualify outcomes and avoid before/after disease framing.",
  },
  "Influencer script": {
    label: "Influencer script",
    transform: (text) => influencerScript(text),
    notes: "Require clear #ad disclosure and ban personal cure stories.",
  },
  "Email subject": {
    label: "Email subject line",
    transform: (text) => shortenForSocial(text, 60),
    notes: "Subject lines are advertising. Avoid urgency plus unqualified health promises.",
  },
};

function shortenForSocial(text: string, max: number) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1).replace(/\s+\S*$/, "");
  return `${cut}…`;
}

function toAmazonBullets(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 3).map((sentence, index) => `• ${sentence.replace(/[!]+/g, ".")}`).join("\n");
}

function qualifyForAds(text: string) {
  const base = text.replace(/[!]+/g, ".");
  return /\*|when used as directed/i.test(base) ? base : `${base}*`;
}

function influencerScript(text: string) {
  return `I use this as part of my routine — ${shortenForSocial(text, 160)} #ad`;
}

export function buildCopilotContext(input: AnalyzeClaimInput & Partial<Pick<CopilotClaimContext, "riskLevel" | "riskScore" | "riskyPhrases" | "explanation" | "saferRewrite" | "sources">>): CopilotClaimContext {
  const analysis = analyzeClaim(input);
  return {
    ...input,
    riskLevel: input.riskLevel ?? analysis.riskLevel,
    riskScore: input.riskScore ?? analysis.riskScore,
    riskyPhrases: input.riskyPhrases ?? analysis.riskyPhrases,
    explanation: input.explanation ?? analysis.explanation,
    saferRewrite: input.saferRewrite ?? analysis.saferRewrite,
    sources: input.sources ?? analysis.sourceReferences,
  };
}

export function explainClaimResult(context: CopilotClaimContext): ExplainResult {
  const matches = matchClaimRules(context.claimText, context.productCategory, context.market);
  const sourceIds = [...new Set(matches.flatMap((rule) => rule.sourceIds || []))];
  const references = getSourceReferences({
    market: context.market,
    productCategory: context.productCategory,
    contextType: context.contextType,
    matchedSourceIds: sourceIds,
  });

  const phraseBreakdown: PhraseBreakdown[] = matches.map((rule) => ({
    phrase: rule.displayPhrase || rule.phrase,
    severity: rule.severity,
    explanation: rule.explanation,
    sourceTitles: references
      .filter((ref) => (rule.sourceIds || []).some((id) => ref.title.toLowerCase().includes(id.split("-")[0])))
      .map((ref) => ref.title)
      .slice(0, 2),
  }));

  const uniquePhrases = [...new Map(phraseBreakdown.map((item) => [item.phrase, item])).values()];
  const severityLabel = context.riskLevel === "high" ? "high-risk" : context.riskLevel === "medium" ? "medium-risk" : "lower-risk";

  const summary = uniquePhrases.length
    ? `This ${severityLabel} result (${context.riskScore}/100) was triggered by ${uniquePhrases.length} phrase pattern${uniquePhrases.length === 1 ? "" : "s"} in your ${context.contextType.toLowerCase()} copy for a ${context.productCategory.toLowerCase()} in ${context.market}.`
    : `No configured phrase patterns were triggered, but this ${severityLabel} score (${context.riskScore}/100) still reflects category, market, and channel context for your ${context.productCategory.toLowerCase()}.`;

  const contextInsight = /social media|influencer|ad copy/i.test(context.contextType)
    ? "Social and paid channels often face stricter platform review and endorsement rules than static labels."
    : /amazon/i.test(context.contextType)
      ? "Marketplace listings are treated as labeling extensions — bullets and A+ content must stay consistent with substantiation."
      : "Review the full surrounding copy, imagery, and testimonials — not just this isolated sentence.";

  const nextSteps = [
    context.riskLevel === "high" ? "Pause publishing until a qualified compliance professional reviews this claim." : "Apply the safer rewrite and document supporting substantiation.",
    "Compare the rewrite against your product formulation and intended audience.",
    context.riskLevel !== "low" ? "Create a remediation task so the fix is tracked before launch." : "Save the approved wording to your claim library for reuse.",
  ];

  return {
    summary,
    phraseBreakdown: uniquePhrases,
    contextInsight,
    nextSteps,
    disclaimer: CLAIM_DISCLAIMER,
  };
}

export function helpFixClaim(context: CopilotClaimContext): ExplainResult {
  const base = explainClaimResult(context);
  const fixSteps = [
    `Start from the safer rewrite: "${context.saferRewrite}"`,
    context.riskyPhrases.length
      ? `Remove or replace flagged phrases: ${context.riskyPhrases.join(", ")}.`
      : "Tighten broad promises and add qualifiers where outcomes vary.",
    /supplement/i.test(context.productCategory) && !/not intended to diagnose/i.test(context.claimText)
      ? "Add the full DSHEA disclaimer on labels and nearby marketing when using structure/function claims."
      : "Confirm the final wording matches your evidence file and channel rules.",
    "Re-run the claim checker after edits to confirm the risk score dropped.",
  ];

  return {
    ...base,
    summary: `Here is a focused fix plan for your ${context.riskLevel}-risk claim.`,
    nextSteps: fixSteps,
  };
}

export function guidedChannelRewrites(context: CopilotClaimContext): GuidedRewrite[] {
  const base = context.saferRewrite || analyzeClaim(context).saferRewrite;
  const channels = Object.entries(CHANNEL_GUIDANCE).map(([channel, config]) => ({
    channel,
    label: config.label,
    rewrite: config.transform(base),
    notes: config.notes,
  }));

  const currentChannel = context.contextType.toLowerCase();
  const prioritized = channels.sort((a, b) => {
    const aMatch = currentChannel.includes(a.channel.split(" ")[0].toLowerCase()) ? 1 : 0;
    const bMatch = currentChannel.includes(b.channel.split(" ")[0].toLowerCase()) ? 1 : 0;
    return bMatch - aMatch;
  });

  return prioritized;
}

export function explainRegulationImpact(
  regulation: WorkflowRegulation,
  products: WorkflowProduct[],
  claims: WorkflowClaim[],
): RegulationImpactResult {
  const matches = matchRegulationImpacts(products, claims, [regulation]);
  const affectedProducts = matches.map((match) => ({
    name: match.product,
    reason: match.reason,
    riskLevel: match.riskLevel,
    matchedClaims: match.matchedClaims,
    recommendedAction: match.recommendedAction,
  }));

  const summary = affectedProducts.length
    ? `${regulation.organization} update "${regulation.title}" may affect ${affectedProducts.length} of your product${affectedProducts.length === 1 ? "" : "s"} based on category, claim language, and saved review history.`
    : `No direct product matches were found for "${regulation.title}", but ${products.length ? "review whether your categories overlap with this guidance." : "add products to enable product-specific impact matching."}`;

  return {
    summary,
    affectedProducts,
    disclaimer: CLAIM_DISCLAIMER,
  };
}

export type CopilotFeatureTestResult = {
  name: string;
  passed: boolean;
  detail?: string;
};

export function runCopilotFeatureTests(): CopilotFeatureTestResult[] {
  const sample: CopilotClaimContext = buildCopilotContext({
    claimText: "Cures joint pain and boosts immunity fast.",
    productCategory: "Dietary Supplement",
    ingredients: ["turmeric"],
    market: "United States FDA + FTC",
    contextType: "Amazon listing",
  });

  const tests: CopilotFeatureTestResult[] = [];

  const explain = explainClaimResult(sample);
  tests.push({
    name: "explain produces phrase breakdown",
    passed: explain.phraseBreakdown.length > 0 && explain.summary.includes("high-risk"),
    detail: explain.phraseBreakdown.map((item) => item.phrase).join(", "),
  });

  const fix = helpFixClaim(sample);
  tests.push({
    name: "fix plan references safer rewrite",
    passed: fix.nextSteps.some((step) => step.toLowerCase().includes("safer rewrite")),
  });

  const rewrites = guidedChannelRewrites(sample);
  tests.push({
    name: "guided rewrites cover channels",
    passed: rewrites.length >= 4 && rewrites.every((item) => item.rewrite.length > 0),
    detail: rewrites.map((item) => item.channel).join(", "),
  });

  const regulation = explainRegulationImpact(
    {
      id: "test-reg",
      organization: "FDA",
      category: "Dietary Supplements",
      title: "Structure/function claim guidance update",
      summary: "Updated supplement labeling and structure/function claim boundaries.",
      officialUrl: "https://www.fda.gov/food/dietary-supplements/whats-new-dietary-supplements",
    },
    [{ id: "p1", name: "Joint Formula", category: "Dietary Supplement", claims: "Supports joint comfort." }],
    [{ id: "c1", product: "Joint Formula", originalClaim: "Cures joint pain.", riskLevel: "high", riskyPhrases: ["cures"], status: "Needs Review", date: new Date().toISOString() }],
  );
  tests.push({
    name: "regulation impact finds products",
    passed: regulation.affectedProducts.length > 0,
    detail: regulation.summary,
  });

  return tests;
}