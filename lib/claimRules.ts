export type RuleSeverity = "high" | "medium";

export type ClaimRule = {
  id: string;
  phrase: string;
  severity: RuleSeverity;
  displayPhrase?: string;
  replacement?: string;
  explanation: string;
  categories?: string[];
  markets?: string[];
  sourceIds?: string[];
};

const highExplanation = "Disease, treatment, prevention, or regulatory-approval wording creates a high claim-risk signal.";
const mediumExplanation = "Broad benefit, performance, or substantiation wording needs careful qualification and supporting evidence.";
const substantiationExplanation = "Absolute, comparative, certification, or scientific-sounding wording needs clear scope and reliable substantiation.";

const highPhrases = [
  "cure", "cures", "cured", "treat", "treats", "treatment", "prevent", "prevents", "eradicate", "eradicates",
  "diagnose", "diagnoses", "diagnosing", "heal", "heals", "healing", "reverse", "reverses", "eliminate", "eliminates",
  "kill", "kills", "sterilize", "sterilizes", "replaces therapy", "replaces medication",
  "disease", "cancer", "diabetes", "anxiety", "depression", "arthritis", "inflammation",
  "inflammatory", "pain relief", "blood pressure", "cholesterol", "insomnia", "infection",
  "virus", "viruses", "viral", "covid", "FDA approved", "FDA certified", "approved by the FDA",
  "blood sugar", "lowers blood sugar", "acne", "hair loss", "chronic pain", "no side effects",
  "safe for diabetics", "100% effective",
];

const mediumPhrases = [
  "boosts immunity", "immunity boost", "detox", "cleanse", "fat burn", "weight loss",
  "hormones", "gut health", "stress", "clinically proven", "miracle", "guaranteed",
  "rapid results", "anti-aging", "performance", "doctor recommended", "scientifically proven",
  "dermatologist tested", "dentist recommended", "hypoallergenic", "non-toxic", "eco-friendly",
  "biodegradable", "world's best", "100% safe", "completely safe", "safe for everyone",
  "two times faster", "faster than the leading", "reduce plaque", "eliminates hiring bias", "every cyberattack",
];

export const CLAIM_RULES: ClaimRule[] = [
  ...highPhrases.map((phrase) => ({
    id: `high-${phrase.replace(/\s+/g, "-").toLowerCase()}`,
    phrase,
    severity: "high" as const,
    displayPhrase: phrase.toLowerCase() === "fda approved" ? "regulatory approval wording" : phrase,
    explanation: highExplanation,
    sourceIds: ["ftc-advertising"],
  })),
  ...mediumPhrases.map((phrase) => ({
    id: `medium-${phrase.replace(/\s+/g, "-").toLowerCase()}`,
    phrase,
    severity: "medium" as const,
    explanation: mediumExplanation,
    sourceIds: ["ftc-advertising", "ftc-health-products"],
  })),
  ...[
    ["fda cleared", "high", ["Medical Device"], ["fda-device-label"], "Regulatory clearance wording must match the exact device and cleared intended use."],
    ["fda registered", "high", ["Cosmetic", "Medical Device", "Dietary Supplement"], ["fda-cosmetic-boundary", "fda-device-label"], "Registration does not generally mean FDA approval or endorsement."],
    ["tga approved", "high", ["Therapeutic Good", "Medical Device", "OTC Drug"], ["tga-code"], "TGA inclusion or registration must not be presented as government endorsement."],
    ["diagnoses", "high", ["Medical Device", "Software / AI"], ["fda-device-label"], "Diagnostic claims can create medical-device intended use and require appropriate authorization."],
    ["detects cancer", "high", ["Medical Device", "Software / AI"], ["fda-device-label"], "Disease detection claims can create high-risk diagnostic-device intended use."],
    ["off-label", "high", ["Prescription Drug", "Medical Device"], ["fda-drug-promotion"], "Off-label promotional claims require specialist regulatory review."],
    ["repairs skin", "high", ["Cosmetic"], ["fda-cosmetic-boundary"], "Claims that alter body structure or function can cause a cosmetic to be regulated as a drug."],
    ["regenerates cells", "high", ["Cosmetic"], ["fda-cosmetic-boundary"], "Cell regeneration claims can imply drug-like effects beyond cosmetic appearance."],
    ["kills germs", "high", ["Household Cleaner", "Consumer Product"], ["epa-cleaner-claims"], "Public-health antimicrobial claims can cause a cleaner or treated article to be regulated as a pesticide."],
    ["kills viruses", "high", ["Household Cleaner", "Pesticide"], ["epa-cleaner-claims", "epa-pesticide-label"], "Virus efficacy claims require appropriate pesticide registration and label support."],
    ["disinfects", "high", ["Household Cleaner", "Consumer Product"], ["epa-cleaner-claims"], "Disinfection claims can create pesticide-regulation obligations."],
    ["antibacterial", "high", ["Household Cleaner", "Consumer Product"], ["epa-cleaner-claims"], "Antibacterial claims can be regulated antimicrobial pesticide claims."],
    ["treats arthritis", "high", ["Pet Food", "Animal Health"], ["fda-pet-food"], "Disease treatment claims can cause animal food to be regulated as an animal drug."],
    ["prevents urinary tract disease", "high", ["Pet Food"], ["fda-pet-food"], "Pet-food disease prevention claims require specialist veterinary regulatory review."],
    ["hangover-free", "high", ["Alcohol Beverage"], ["ttb-advertising"], "Alcohol advertising must not make false or misleading health-effect claims."],
    ["improves memory", "high", ["Alcohol Beverage"], ["ttb-advertising"], "Alcohol advertisements should not attribute misleading health benefits."],
    ["healthy alcohol", "high", ["Alcohol Beverage"], ["ttb-advertising"], "Broad health-benefit claims for alcohol require specialist review and can mislead consumers."],
    ["light", "high", ["Tobacco Product"], ["fda-tobacco"], "Modified-risk descriptors such as light, mild, or low are restricted for tobacco products."],
    ["mild", "high", ["Tobacco Product"], ["fda-tobacco"], "Modified-risk descriptors such as light, mild, or low are restricted for tobacco products."],
    ["safer cigarette", "high", ["Tobacco Product"], ["fda-tobacco"], "Modified-risk tobacco claims require an applicable FDA order."],
    ["guaranteed returns", "high", ["Financial Service"], ["cfpb-advertising"], "Guaranteed financial-return claims can be deceptive and require specialist review."],
    ["risk-free investment", "high", ["Financial Service"], ["cfpb-advertising"], "Risk-free investment claims can materially mislead consumers."],
    ["eliminates debt", "high", ["Financial Service"], ["cfpb-advertising"], "Misleading debt-elimination claims are specifically restricted in financial advertising."],
    ["fdic insured", "high", ["Financial Service"], ["cfpb-advertising"], "Deposit-insurance claims must precisely match the covered product and institution."],
    ["100% safe", "high", undefined, ["ftc-advertising"], "Absolute safety claims are difficult to substantiate and can hide material limitations."],
    ["no side effects", "high", ["OTC Drug", "Prescription Drug", "Therapeutic Good", "Dietary Supplement"], ["ftc-health-products", "fda-drug-promotion"], "Absolute safety claims for health products can be misleading."],
    ["clinically validated", "medium", undefined, ["ftc-health-products"], substantiationExplanation],
    ["scientifically proven", "medium", undefined, ["ftc-health-products"], substantiationExplanation],
    ["best", "medium", undefined, ["ftc-advertising"], substantiationExplanation],
    ["number one", "medium", undefined, ["ftc-advertising"], substantiationExplanation],
    ["eco-friendly", "medium", undefined, ["ftc-green-guides", "accc-green"], "Broad environmental benefit claims should be qualified with specific, substantiated benefits."],
    ["green", "medium", undefined, ["ftc-green-guides", "accc-green"], "Broad environmental benefit claims should be qualified with specific, substantiated benefits."],
    ["sustainable", "medium", undefined, ["ftc-green-guides", "accc-green"], "Sustainability claims need clear scope, boundaries, and supporting evidence."],
    ["carbon neutral", "medium", undefined, ["ftc-green-guides", "accc-green"], "Carbon claims need a clear methodology, scope, and substantiation."],
    ["carbon negative", "medium", undefined, ["ftc-green-guides", "accc-green"], "Carbon claims need a clear methodology, scope, and substantiation."],
    ["biodegradable", "medium", undefined, ["ftc-green-guides", "accc-green"], "Biodegradability claims need evidence reflecting likely disposal conditions and timing."],
    ["recyclable", "medium", undefined, ["ftc-green-guides", "accc-green"], "Recyclability claims should reflect actual consumer access to recycling facilities."],
    ["chemical-free", "medium", undefined, ["ftc-green-guides", "accc-green"], "Absolute absence claims can mislead and require careful qualification."],
    ["non-toxic", "medium", undefined, ["ftc-green-guides", "accc-green"], "Non-toxic claims require a clear scope and reliable safety evidence."],
    ["organic", "medium", ["Food", "Functional Food", "Beverage", "Cosmetic"], ["usda-organic"], "Organic claims may require certification and category-specific labeling compliance."],
    ["hypoallergenic", "medium", ["Cosmetic", "Children's Product"], ["fda-cosmetic-label"], "Hypoallergenic claims need appropriate evidence and careful qualification."],
    ["dermatologist approved", "medium", ["Cosmetic"], ["ftc-advertising"], "Professional endorsement claims need substantiation and clear disclosure of material connections."],
    ["choking safe", "high", ["Children's Product"], ["cpsc-children", "cpsc-labeling"], "Absolute child-safety claims can conflict with required testing, warnings, and age grading."],
    ["child safe", "medium", ["Children's Product", "Consumer Product"], ["cpsc-children"], "Child-safety claims require product-specific testing and should not replace required warnings."],
    ["unbiased ai", "medium", ["Software / AI"], ["ftc-advertising"], "AI performance and fairness claims need representative testing and clear limitations."],
    ["100% accurate", "high", ["Software / AI", "Medical Device"], ["ftc-advertising", "fda-device-label"], "Absolute accuracy claims are difficult to substantiate and can conceal material failure modes."],
    ["replaces your doctor", "high", ["Software / AI", "Medical Device"], ["fda-device-label", "ftc-health-products"], "Claims that software replaces clinical judgment create significant safety and regulatory risk."],
  ].map(([phrase, severity, categories, sourceIds, explanation]) => ({
    id: `sector-${String(phrase).replace(/\s+/g, "-")}`,
    phrase: String(phrase),
    severity: severity as RuleSeverity,
    categories: categories as string[] | undefined,
    sourceIds: sourceIds as string[],
    explanation: String(explanation),
  })),
];

export const REWRITE_RULES = [
  { phrase: "replaces your doctor", replacement: "supports informed conversations with qualified professionals" },
  { phrase: "prevents urinary tract disease", replacement: "supports urinary tract health" },
  { phrase: "risk-free investment", replacement: "investment option with risks that should be carefully reviewed" },
  { phrase: "guaranteed returns", replacement: "potential returns subject to market risk" },
  { phrase: "eliminates debt", replacement: "may help customers manage debt" },
  { phrase: "detects cancer", replacement: "supports review of relevant health information" },
  { phrase: "safer cigarette", replacement: "tobacco product" },
  { phrase: "healthy alcohol", replacement: "alcohol beverage" },
  { phrase: "hangover-free", replacement: "crafted for a balanced drinking experience" },
  { phrase: "kills viruses", replacement: "designed for cleaning when used as directed" },
  { phrase: "kills germs", replacement: "designed for routine cleaning" },
  { phrase: "disinfects", replacement: "cleans" },
  { phrase: "antibacterial", replacement: "cleaning" },
  { phrase: "regenerates cells", replacement: "supports smoother-looking skin" },
  { phrase: "repairs skin", replacement: "supports healthy-looking skin" },
  { phrase: "no side effects", replacement: "use as directed and review relevant safety information" },
  { phrase: "100% safe", replacement: "designed with safety in mind when used as directed" },
  { phrase: "100% accurate", replacement: "designed to provide useful results with stated limitations" },
  { phrase: "choking safe", replacement: "designed for the stated age range when used as directed" },
  { phrase: "treats arthritis", replacement: "supports mobility and joint comfort" },
  { phrase: "FDA cleared", replacement: "designed for its stated intended use" },
  { phrase: "FDA registered", replacement: "manufactured with regulatory requirements in mind" },
  { phrase: "TGA approved", replacement: "listed for its stated intended use" },
  { phrase: "100% effective for perfect sleep every night", replacement: "designed to support a restful sleep routine" },
  { phrase: "cures cancer and prevents disease recurrence", replacement: "supports general wellness and a healthy lifestyle" },
  { phrase: "treats anxiety and supports deep sleep", replacement: "supports relaxation, calm, and restful sleep" },
  { phrase: "reduces inflammation and supports mobility", replacement: "supports everyday comfort and mobility" },
  { phrase: "guaranteed weight loss in 14 days", replacement: "supports healthy weight management over time" },
  { phrase: "a daily detox cleanse for total wellness", replacement: "daily support for the body's natural wellness processes" },
  { phrase: "eradicates acne in seven days", replacement: "supports clear-looking skin" },
  { phrase: "cures joint pain fast", replacement: "supports joint comfort and mobility" },
  { phrase: "treatment for viral infection", replacement: "supports immune system health and general wellness" },
  { phrase: "treats anxiety and depression", replacement: "supports relaxation and emotional wellbeing" },
  { phrase: "heals arthritis and eliminates joint pain", replacement: "supports joint comfort and mobility" },
  { phrase: "replaces therapy and cures depression", replacement: "supports general emotional wellbeing" },
  { phrase: "kills 99.9% of bacteria and viruses", replacement: "helps clean frequently touched surfaces" },
  { phrase: "approved by the FDA", replacement: "carefully formulated" },
  { phrase: "FDA certified", replacement: "carefully formulated" },
  { phrase: "safe for diabetics", replacement: "designed with dietary considerations in mind" },
  { phrase: "no side effects", replacement: "when used as directed" },
  { phrase: "chronic pain", replacement: "everyday comfort" },
  { phrase: "hair loss", replacement: "hair appearance" },
  { phrase: "regrows hair", replacement: "supports fuller-looking hair" },
  { phrase: "airborne viruses", replacement: "airborne particles" },
  { phrase: "sterilizes", replacement: "helps clean" },
  { phrase: "guaranteed weight loss", replacement: "supports healthy weight management" },
  { phrase: "detox cleanse", replacement: "supports the body's natural wellness processes" },
  { phrase: "lowers blood sugar", replacement: "supports healthy glucose metabolism" },
  { phrase: "prevents diabetes", replacement: "supports healthy glucose metabolism" },
  { phrase: "eradicates acne", replacement: "supports clear-looking skin" },
  { phrase: "cures joint pain", replacement: "supports joint comfort and mobility" },
  { phrase: "cures inflammation", replacement: "supports everyday comfort and mobility" },
  { phrase: "reduces inflammation", replacement: "supports everyday comfort and mobility" },
  { phrase: "treats anxiety", replacement: "supports relaxation and calm" },
  { phrase: "depression", replacement: "emotional wellbeing" },
  { phrase: "arthritis", replacement: "joint comfort" },
  { phrase: "insomnia", replacement: "restful sleep" },
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
  { phrase: "diagnoses", replacement: "helps monitor" },
  { phrase: "diagnose", replacement: "help monitor" },
  { phrase: "reverses", replacement: "supports" },
  { phrase: "reverse", replacement: "support" },
  { phrase: "heals", replacement: "supports" },
  { phrase: "heal", replacement: "support" },
  { phrase: "eliminates", replacement: "helps address" },
  { phrase: "eliminate", replacement: "help address" },
  { phrase: "kills", replacement: "helps reduce" },
  { phrase: "kill", replacement: "help reduce" },
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

const genericHighActions = new Set([
  "cure", "cures", "cured", "treat", "treats", "treatment", "prevent", "prevents",
  "eradicate", "eradicates", "diagnose", "diagnoses", "diagnosing", "heal", "heals", "healing",
  "reverse", "reverses", "eliminate", "eliminates", "kill", "kills",
]);
const broadContextPhrases = new Set(["performance", "stress"]);
const therapeuticCategory = /supplement|medical device|health technology|drug|pet care|animal health/i;
const healthTarget = /\b(disease|cancer|diabet(?:es|ic|ics)|anxiety|depression|arthritis|inflammation|pain|infection|virus|viruses|covid|blood sugar|blood pressure|cholesterol|insomnia|acne|hair loss|injury|injuries|sids|cold|colds|flu|psoriasis|eczema|fungal|plaque|fleas|infestation)\b/i;
const regulatedBroadClaimCategory = /supplement|food|beverage|cosmetic|personal care|medical|health|drug|pet|animal|baby|children|financial|fitness service|household cleaner/i;

function removeStandardDisclaimer(claimText: string) {
  return claimText.replace(/this product is not intended to diagnose,\s*treat,\s*cure,\s*or prevent any disease\.?/gi, "");
}

const COMPILED_RULES = CLAIM_RULES.map((rule) => ({
  rule,
  pattern: new RegExp(`\\b${rule.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
}));

export function matchClaimRules(claimText: string, productCategory?: string, market?: string) {
  const reviewText = removeStandardDisclaimer(claimText);
  return COMPILED_RULES.filter(({ rule, pattern }) => {
    if (rule.categories?.length && (!productCategory || !rule.categories.some((category) => category.toLowerCase() === productCategory.toLowerCase()))) return false;
    if (rule.markets?.length && (!market || !rule.markets.some((item) => market.toLowerCase().includes(item.toLowerCase())))) return false;
    if (genericHighActions.has(rule.phrase) && !therapeuticCategory.test(productCategory || "") && !healthTarget.test(reviewText)) return false;
    if (broadContextPhrases.has(rule.phrase) && !regulatedBroadClaimCategory.test(productCategory || "")) return false;
    return pattern.test(reviewText);
  }).map(({ rule }) => rule);
}
