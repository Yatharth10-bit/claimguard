export type RuleSeverity = "high" | "medium";

export type ClaimRule = {
  id: string;
  phrase: string;
  severity: RuleSeverity;
  displayPhrase?: string;
  replacement?: string;
  explanation: string;
};

const highExplanation = "Disease, treatment, prevention, or regulatory-approval wording creates a high claim-risk signal.";
const mediumExplanation = "Broad benefit, performance, or substantiation wording needs careful qualification and supporting evidence.";

const highPhrases = [
  "cure", "cures", "cured", "treat", "treats", "treatment", "prevent", "prevents", "eradicate", "eradicates",
  "disease", "cancer", "diabetes", "anxiety", "depression", "arthritis", "inflammation",
  "inflammatory", "pain relief", "blood pressure", "cholesterol", "insomnia", "infection",
  "virus", "viral", "covid", "FDA approved", "blood sugar", "lowers blood sugar", "acne", "100% effective",
];

const mediumPhrases = [
  "boosts immunity", "immunity boost", "detox", "cleanse", "fat burn", "weight loss",
  "hormones", "gut health", "stress", "clinically proven", "miracle", "guaranteed",
  "rapid results", "anti-aging", "performance", "doctor recommended",
];

export const CLAIM_RULES: ClaimRule[] = [
  ...highPhrases.map((phrase) => ({
    id: `high-${phrase.replace(/\s+/g, "-").toLowerCase()}`,
    phrase,
    severity: "high" as const,
    displayPhrase: phrase.toLowerCase() === "fda approved" ? "regulatory approval wording" : phrase,
    explanation: highExplanation,
  })),
  ...mediumPhrases.map((phrase) => ({
    id: `medium-${phrase.replace(/\s+/g, "-").toLowerCase()}`,
    phrase,
    severity: "medium" as const,
    explanation: mediumExplanation,
  })),
];

export const REWRITE_RULES = [
  { phrase: "100% effective for perfect sleep every night", replacement: "designed to support a restful sleep routine" },
  { phrase: "cures cancer and prevents disease recurrence", replacement: "supports general wellness and a healthy lifestyle" },
  { phrase: "treats anxiety and supports deep sleep", replacement: "supports relaxation, calm, and restful sleep" },
  { phrase: "reduces inflammation and supports mobility", replacement: "supports everyday comfort and mobility" },
  { phrase: "guaranteed weight loss in 14 days", replacement: "supports healthy weight management over time" },
  { phrase: "a daily detox cleanse for total wellness", replacement: "daily support for the body's natural wellness processes" },
  { phrase: "eradicates acne in seven days", replacement: "supports clear-looking skin" },
  { phrase: "cures joint pain fast", replacement: "supports joint comfort and mobility" },
  { phrase: "treatment for viral infection", replacement: "supports immune system health and general wellness" },
  { phrase: "guaranteed weight loss", replacement: "supports healthy weight management" },
  { phrase: "detox cleanse", replacement: "supports the body's natural wellness processes" },
  { phrase: "lowers blood sugar", replacement: "supports healthy glucose metabolism" },
  { phrase: "prevents diabetes", replacement: "supports healthy glucose metabolism" },
  { phrase: "eradicates acne", replacement: "supports clear-looking skin" },
  { phrase: "cures joint pain", replacement: "supports joint comfort and mobility" },
  { phrase: "cures inflammation", replacement: "supports everyday comfort and mobility" },
  { phrase: "reduces inflammation", replacement: "supports everyday comfort and mobility" },
  { phrase: "treats anxiety", replacement: "supports relaxation and calm" },
  { phrase: "healthy cholesterol levels", replacement: "heart health" },
  { phrase: "boosts immunity", replacement: "supports immune system health" },
  { phrase: "immunity boost", replacement: "immune system support" },
  { phrase: "100% effective", replacement: "designed to support" },
  { phrase: "doctor recommended", replacement: "thoughtfully formulated" },
  { phrase: "FDA approved", replacement: "carefully formulated" },
  { phrase: "pain relief", replacement: "comfort support" },
  { phrase: "fat burn", replacement: "healthy weight management support" },
  { phrase: "weight loss", replacement: "healthy weight management" },
  { phrase: "anti-aging", replacement: "healthy aging" },
  { phrase: "clinically proven", replacement: "carefully formulated" },
  { phrase: "rapid results", replacement: "consistent support" },
  { phrase: "miracle", replacement: "thoughtfully formulated" },
  { phrase: "guaranteed", replacement: "designed to support" },
  { phrase: "performance", replacement: "everyday performance" },
  { phrase: "detox", replacement: "wellness support" },
  { phrase: "cleanse", replacement: "wellness support" },
  { phrase: "cures", replacement: "supports" },
  { phrase: "cured", replacement: "supported" },
  { phrase: "cure", replacement: "support" },
  { phrase: "treats", replacement: "supports" },
  { phrase: "treatment", replacement: "support" },
  { phrase: "treat", replacement: "support" },
  { phrase: "prevents", replacement: "supports" },
  { phrase: "prevent", replacement: "support" },
  { phrase: "blood sugar", replacement: "healthy glucose metabolism" },
  { phrase: "diabetes", replacement: "healthy glucose metabolism" },
  { phrase: "cancer", replacement: "general wellness" },
  { phrase: "disease", replacement: "general wellness" },
  { phrase: "viral infection", replacement: "immune system health" },
  { phrase: "infection", replacement: "immune system health" },
  { phrase: "inflammation", replacement: "everyday comfort" },
  { phrase: "inflammatory", replacement: "comfort" },
  { phrase: "cholesterol", replacement: "heart health" },
  { phrase: "blood pressure", replacement: "heart health" },
  { phrase: "acne", replacement: "clear-looking skin" },
].sort((a, b) => b.phrase.length - a.phrase.length);

export function matchClaimRules(claimText: string) {
  return CLAIM_RULES.filter((rule) => {
    const escaped = rule.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(claimText);
  });
}
