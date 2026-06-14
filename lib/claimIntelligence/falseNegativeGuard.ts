import type { AnalyzeClaimInput, ClaimAnalysisResult } from "@/lib/analyzeClaim";
import type { ClaimIntelligenceInput, RiskCategory } from "@/lib/claimIntelligence/types";
import { jaccardSimilarity } from "@/lib/claimIntelligence/similarity";

export type GuardRiskLevel = ClaimAnalysisResult["riskLevel"] | "needs_review";

export type FalseNegativeGuardResult = {
  triggered: boolean;
  overrideLevel?: GuardRiskLevel;
  overrideScore?: number;
  riskCategories: RiskCategory[];
  riskyPhrases: string[];
  mainIssue: string;
  whyRisky: string;
  saferRewrite: string;
  similarPattern: string;
  confidence: number;
  suggestedAction: string;
  guardSignals: string[];
  layersUsed: string[];
};

type RiskFamily = {
  id: RiskCategory;
  label: string;
  patterns: RegExp[];
  categoryGate?: RegExp;
  categoryExclude?: RegExp;
  baseScore: number;
  severity: GuardRiskLevel;
  riskyPhrases: string[];
  saferRewrite: string;
  mainIssue: string;
  whyRisky: string;
  similarPattern: string;
  suggestedAction: string;
  semanticAnchors?: string[];
};

const COSMETIC_GATE = /cosmetic|skincare|skin\s*care|beauty|facewash|face\s*wash|personal\s*care|moisturizer|serum|lotion|cream|cleanser|toner|sunscreen|makeup|anti[- ]?aging/i;
const SUPPLEMENT_GATE = /supplement|nutraceutical|vitamin|herbal|ayurvedic|wellness|probiotic|capsule|tablet|powder/i;
const FOOD_GATE = /food|beverage|drink|juice|snack|nutrition|functional|tea|coffee|smoothie|meal/i;
const WEIGHT_GATE = /weight|fitness|slim|diet|fat\s*burn|workout|gym|meal\s*replacement/i;
const BABY_GATE = /baby|infant|child|children|kids|toddler|newborn/i;
const PET_GATE = /pet|dog|cat|animal|veterinary|vet\b/i;
const HOUSEHOLD_SAFE = /paint|wall|laundry|detergent|household\s*cleaner|fabric|bleach\s*for|primer|coating|varnish/i;
const DENTAL_BORDERLINE = /toothpaste|dental|oral\s*care|mouthwash/i;

const ESCALATION_PATTERNS: { pattern: RegExp; boost: number; phrase: string }[] = [
  { pattern: /\b(cure[sd]?|treats?|treatment|heal[s]?|healing)\b/i, boost: 12, phrase: "treatment/cure language" },
  { pattern: /\b(prevent[s]?|prevention|protects?\s+against)\b/i, boost: 10, phrase: "prevention language" },
  { pattern: /\b(reverse[sd]?|eliminate[sd]?|eradicate[sd]?|destroy[s]?)\b/i, boost: 10, phrase: "elimination/reversal language" },
  { pattern: /\b(guaranteed?|100%\s*(effective|safe)|permanent(ly)?)\b/i, boost: 12, phrase: "guarantee/permanence" },
  { pattern: /\b(instant(ly)?|overnight|in\s+\d+\s*(day|days|week|weeks|hour|hours))\b/i, boost: 8, phrase: "rapid timeframe" },
  { pattern: /\b(clinically\s+proven|scientifically\s+proven|doctor\s+recommended|fda\s+approved|medical[- ]grade)\b/i, boost: 8, phrase: "unsupported proof claim" },
  { pattern: /\b(melanin|hormone|inflammation|immunity|immun(e|ity)|detox|cleanse)\b/i, boost: 6, phrase: "biological mechanism claim" },
  { pattern: /\b(before\s+and\s+after|transform(ation|s)?)\b/i, boost: 6, phrase: "before/after exaggeration" },
];

const SAFER_STRUCTURE_PATTERNS = [
  /\bhelps?\s+(support|maintain|promote)\b/i,
  /\bsupports?\s+(a\s+)?(healthy|normal|everyday|general)\b/i,
  /\bhealthy\s+inflammatory\s+response\b/i,
  /\bimmune\s+system\s+health\b/i,
  /\bjoint\s+comfort\b/i,
  /\bdigestive\s+wellness\b/i,
  /\bappearance\s+of\b/i,
  /\blooking\s+(fresh|radiant|clean|healthy|refreshed)\b/i,
  /\beveryday\s+wellness\b/i,
  /\bpart\s+of\s+a\s+balanced\b/i,
  /\bdesigned\s+for\s+everyday\b/i,
  /\bgentle(ly)?\s+(cleanses?|for)\b/i,
];

const KNOWN_SAFE_PHRASES = [
  /\bsupports?\s+a\s+healthy\s+inflammatory\s+response\b/i,
  /\bsupports?\s+immune\s+system\s+health\b/i,
  /\bsupports?\s+joint\s+comfort\b/i,
  /\bsupports?\s+digestive\s+wellness\b/i,
  /\bhelps?\s+maintain\s+normal\s+energy\s+levels\b/i,
  /\bhelps?\s+brighten\s+the\s+appearance\s+of\s+dull\s+skin\b/i,
  /\bleaves?\s+skin\s+looking\s+fresh\s+and\s+radiant\b/i,
];

const RISK_FAMILIES: RiskFamily[] = [
  {
    id: "skin_whitening_claim",
    label: "Cosmetic Skin Tone / Whitening Claim Risk",
    patterns: [
      /\bmake[s]?\s+(you|your\s+(skin|face))\s+white\b/i,
      /\bturn[s]?\s+(your\s+)?(skin|face)\s+white\b/i,
      /\b(white|whiten|whitening|whitens)\s+(skin|face|complexion)\b/i,
      /\b(skin|face)\s+whitening\b/i,
      /\b(fair|fairness|fairer)\s+(skin|face|complexion)\b/i,
      /\bget\s+fair\b/i,
      /\b(lighten|lightens|lightening)\s+(skin|face|complexion)\b/i,
      /\b(bleach|bleaches|bleaching)\s+(skin|face)\b/i,
      /\b(removes?|remove)\s+(dark(ness)?|blackness)\b/i,
      /\b(reduces?|reduce|stops?|stop)\s+melanin\b/i,
      /\b(milky|bright)\s+white\s+(skin|complexion)\b/i,
      /\bwhite\s+glow\b/i,
      /\bpermanent(ly)?\s+(lighten|whiten|fair)\b/i,
      /\bnatural(ly)?\s+fair\b/i,
    ],
    categoryGate: COSMETIC_GATE,
    categoryExclude: HOUSEHOLD_SAFE,
    baseScore: 88,
    severity: "high",
    riskyPhrases: ["skin whitening", "fairness claim", "skin tone change"],
    saferRewrite: "Gently cleanses away impurities and helps skin look fresh, clean, and radiant.",
    mainIssue: "Skin whitening / natural skin color change implication.",
    whyRisky: "This wording may imply that the product can whiten or change natural skin color. For skincare and cosmetics, this is a strong result claim that may need substantiation and can create brand and advertising risk.",
    similarPattern: "Skin whitening / fairness claim",
    suggestedAction: "Replace whitening/fairness language with brightening, radiance, freshness, or dullness-related wording.",
    semanticAnchors: [
      "make you white",
      "turn your skin white",
      "white glow facewash",
      "get fair fast",
      "remove darkness",
      "bright white skin",
      "milky white complexion",
      "skin whitening facewash",
      "become fair naturally",
    ],
  },
  {
    id: "cosmetic_drug_boundary",
    label: "Cosmetic Treatment / Drug Boundary Risk",
    patterns: [
      /\b(cures?|treats?|heals?)\s+(acne|eczema|psoriasis|rosacea|dermatitis)\b/i,
      /\b(removes?|erase[sd]?)\s+(scars?|wrinkles?|pigmentation)\s+(permanently|completely|forever)\b/i,
      /\b(reverses?|reverse)\s+wrinkles?\b/i,
      /\b(repairs?|repair)\s+(damaged\s+)?skin\s+permanently\b/i,
      /\bdermatologist[- ]level\s+treatment\b/i,
      /\bmedical[- ]grade\s+(acne|skin)\s+cure\b/i,
      /\b(erases?|erase)\s+pigmentation\s+completely\b/i,
    ],
    categoryGate: COSMETIC_GATE,
    baseScore: 82,
    severity: "high",
    riskyPhrases: ["acne treatment", "scar removal", "wrinkle reversal"],
    saferRewrite: "Helps improve the look of uneven tone and supports skin that appears fresh and healthy.",
    mainIssue: "Cosmetic copy may imply dermatological treatment or permanent biological change.",
    whyRisky: "Treatment, cure, or permanent repair language can push a cosmetic into drug-like claims and increase FDA/FTC scrutiny.",
    similarPattern: "Cosmetic-drug boundary / treatment claim",
    suggestedAction: "Use appearance-based wording (look, appearance, healthy-looking) and avoid cure/treat/heal language.",
    semanticAnchors: ["cures acne", "treats eczema", "removes scars permanently", "reverses wrinkles"],
  },
  {
    id: "disease_treatment",
    label: "Disease Treatment Claim Risk",
    patterns: [
      /\b(cures?|treats?|heals?)\s+(inflammation|joint\s+pain|arthritis|ibs|pcos|thyroid|gut\s+disease|bloating|acidity)\b/i,
      /\b(cures?|treats?)\s+(anxiety|depression|adhd|insomnia|panic\s+attacks?)\b/i,
      /\b(reverses?|reverse)\s+(fatty\s+liver|diabetes|obesity)\b/i,
      /\bfixes?\s+(thyroid|hormones?|insomnia|digestion)\b/i,
      /\b(kills?|kill)\s+viruses?\b/i,
      /\bworks?\s+like\s+antidepressants?\b/i,
      /\breplaces?\s+therapy\b/i,
    ],
    categoryGate: /supplement|nutraceutical|wellness|herbal|ayurvedic|food|beverage|functional|juice|mental|mood|sleep/i,
    baseScore: 85,
    severity: "high",
    riskyPhrases: ["disease treatment", "cure claim", "therapy replacement"],
    saferRewrite: "Supports everyday wellness and a balanced lifestyle when used as directed.",
    mainIssue: "Disease treatment or drug-like benefit implication.",
    whyRisky: "Claims that treat, cure, or replace medical care for named conditions can trigger FDA/FTC disease-claim rules.",
    similarPattern: "Disease treatment / supplement drug claim",
    suggestedAction: "Reframe as structure/function support language and confirm substantiation before publishing.",
    semanticAnchors: ["cures inflammation", "treats joint pain", "treats anxiety", "cures IBS", "reverses fatty liver"],
  },
  {
    id: "disease_prevention",
    label: "Disease Prevention Claim Risk",
    patterns: [
      /\bprevents?\s+(diabetes|cancer|heart\s+disease|infection|illness|disease)\b/i,
      /\b(controls?|control)\s+(blood\s+sugar|cholesterol|blood\s+pressure)\b/i,
      /\b(lowers?|lower|reduces?|reduce)\s+(blood\s+pressure|cholesterol)\b/i,
      /\bboosts?\s+immunity\s+to\s+(fight|prevent|stop)\b/i,
      /\bprevents?\s+obesity\b/i,
    ],
    categoryGate: /supplement|nutraceutical|food|beverage|functional|juice|wellness|baby|pet/i,
    baseScore: 78,
    severity: "high",
    riskyPhrases: ["disease prevention", "blood sugar control", "immunity boost to prevent"],
    saferRewrite: "Supports general wellness and everyday nutrition as part of a balanced lifestyle.",
    mainIssue: "Disease prevention or clinical outcome implication.",
    whyRisky: "Prevention and disease-control wording often requires clinical substantiation and may be treated as drug claims.",
    similarPattern: "Disease prevention claim",
    suggestedAction: "Use general wellness or structure/function support wording without naming disease outcomes.",
    semanticAnchors: ["prevents diabetes", "controls blood sugar", "prevents heart disease", "lowers blood pressure"],
  },
  {
    id: "weight_loss_claim",
    label: "Weight Loss / Fat Burning Claim Risk",
    patterns: [
      /\blose\s+\d+\s*(kg|lb|pounds?)\s+in\s+\d+\s*(day|days|week|weeks)\b/i,
      /\b(burns?|burn|melts?|melt|destroys?|destroy|targets?|target)\s+(belly\s+)?fat\b/i,
      /\bburns?\s+fat\b/i,
      /\bweight\s+loss\s+guaranteed\b/i,
      /\bno\s+(diet|exercise)\s+(needed|required)\b/i,
      /\b(blocks?|block)\s+fat\s+absorption\b/i,
      /\b(destroys?|destroy|shrinks?|shrink)\s+fat\s+cells?\b/i,
      /\b(permanent|guaranteed)\s+weight\s+loss\b/i,
      /\b(reverses?|reverse)\s+obesity\b/i,
      /\bspot\s+reduction\b/i,
      /\bdetox\s+fat\b/i,
    ],
    categoryGate: new RegExp(`${WEIGHT_GATE.source}|${FOOD_GATE.source}|supplement|beverage|drink`, "i"),
    baseScore: 90,
    severity: "high",
    riskyPhrases: ["guaranteed weight loss", "fat burning", "rapid weight loss"],
    saferRewrite: "Supports fitness goals when combined with a balanced diet and active lifestyle.",
    mainIssue: "Guaranteed or rapid fat loss / body transformation implication.",
    whyRisky: "Weight-loss guarantees, spot reduction, and no-effort claims attract FTC substantiation scrutiny and typicality risk.",
    similarPattern: "Weight loss / fat burning claim",
    suggestedAction: "Remove guarantees and timeframes; tie support language to diet and exercise where appropriate.",
    semanticAnchors: ["burns belly fat", "melts fat", "targets stubborn fat", "destroys fat cells", "lose 10 kg in 10 days"],
  },
  {
    id: "mental_health_claim",
    label: "Mental Health Treatment Claim Risk",
    patterns: [
      /\b(cures?|treats?|fixes?|eliminates?|stops?)\s+(anxiety|depression|adhd|insomnia|panic|stress|overthinking|trauma)\b/i,
      /\b(heals?|heal)\s+trauma\b/i,
      /\b(calms?|calm)\s+your\s+nervous\s+system\s+instantly\b/i,
      /\beliminates?\s+stress\s+permanently\b/i,
      /\bstops?\s+panic\s+attacks?\b/i,
    ],
    categoryGate: /supplement|wellness|herbal|mood|sleep|mental|food|beverage|cosmetic/i,
    baseScore: 86,
    severity: "high",
    riskyPhrases: ["anxiety treatment", "depression cure", "therapy replacement"],
    saferRewrite: "Supports relaxation and a calm evening routine as part of everyday wellness.",
    mainIssue: "Mental health treatment or clinical effect implication.",
    whyRisky: "Anxiety, depression, and insomnia treatment claims can be regulated as drug claims and require specialist review.",
    similarPattern: "Mental health treatment claim",
    suggestedAction: "Use relaxation, unwind, and routine-support language — not cure/treat/fix wording.",
    semanticAnchors: ["cures anxiety", "treats depression", "fixes insomnia", "replaces therapy"],
  },
  {
    id: "pain_relief_claim",
    label: "Pain Relief / Inflammation Claim Risk",
    patterns: [
      /\b(cures?|treats?|heals?|eliminates?)\s+(pain|inflammation)\b/i,
      /\bmy\s+pain\s+disappeared\b/i,
      /\b(instant|immediate)\s+pain\s+relief\b/i,
      /\brelieves?\s+pain\s+instantly\b/i,
    ],
    categoryGate: /supplement|wellness|herbal|topical|cream|balm|pet|baby/i,
    baseScore: 80,
    severity: "high",
    riskyPhrases: ["pain relief", "inflammation cure"],
    saferRewrite: "Supports everyday comfort and joint mobility as part of a balanced routine.",
    mainIssue: "Pain relief or inflammation treatment implication.",
    whyRisky: "Pain and inflammation treatment language can imply drug-like effects without appropriate authorization.",
    similarPattern: "Pain / inflammation treatment claim",
    suggestedAction: "Use comfort and support language instead of cure, treat, or eliminate pain wording.",
    semanticAnchors: ["treats joint pain", "cures inflammation", "my pain disappeared"],
  },
  {
    id: "detox_cleanse_claim",
    label: "Detox / Cleanse Claim Risk",
    patterns: [
      /\bdetox(es|ed|ing)?\s+(your\s+)?(body|liver|kidneys?)\b/i,
      /\b(cleanses?|cleanse)\s+(kidneys?|liver)\b/i,
      /\b(removes?|remove)\s+toxins?\b/i,
      /\beliminates?\s+bloating\s+permanently\b/i,
    ],
    categoryGate: /supplement|food|beverage|functional|juice|wellness|weight|herbal|drink/i,
    baseScore: 72,
    severity: "medium",
    riskyPhrases: ["detox", "organ cleanse", "toxin removal"],
    saferRewrite: "Supports digestive wellness and everyday hydration as part of a balanced lifestyle.",
    mainIssue: "Detoxification or organ-cleansing implication.",
    whyRisky: "Detox and cleanse claims often lack substantiation and can imply unsupported physiological effects.",
    similarPattern: "Detox / cleanse claim",
    suggestedAction: "Replace detox language with digestive wellness, hydration, or general wellness support.",
    semanticAnchors: ["detoxes your body", "detoxes liver", "cleanses kidneys", "removes toxins"],
  },
  {
    id: "baby_medical_claim",
    label: "Baby / Children Medical Claim Risk",
    patterns: [
      /\b(cures?|treats?|heals?|prevents?)\s+(colic|rash(es)?|eczema|infection|illness|allerg(y|ies))\b/i,
      /\bboosts?\s+baby\s+immunity\b/i,
      /\b(makes?|make)\s+baby\s+sleep\s+all\s+night\b/i,
      /\bprevents?\s+infection\b/i,
      /\brelieves?\s+pain\s+instantly\b/i,
    ],
    categoryGate: BABY_GATE,
    baseScore: 88,
    severity: "high",
    riskyPhrases: ["baby treatment", "child disease prevention"],
    saferRewrite: "Gentle for baby skin and designed for everyday care when used as directed.",
    mainIssue: "Medical or disease claim targeted at babies or children.",
    whyRisky: "Treatment and prevention claims for children attract heightened regulatory and consumer protection scrutiny.",
    similarPattern: "Baby / children medical claim",
    suggestedAction: "Use gentle, everyday-care language and avoid cure, treat, or prevent disease wording.",
    semanticAnchors: ["cures colic", "boosts baby immunity", "treats rashes", "prevents infection"],
  },
  {
    id: "pet_veterinary_claim",
    label: "Pet Veterinary Treatment Claim Risk",
    patterns: [
      /\b(cures?|treats?|heals?|prevents?)\s+(arthritis|anxiety|itching|allerg(y|ies)|disease)\b/i,
      /\b(cures?|treats?)\s+(dog|cat|pet)\b/i,
      /\bvet[- ]grade\s+cure\b/i,
      /\bfixes?\s+digestion\b/i,
      /\beliminates?\s+inflammation\b/i,
    ],
    categoryGate: PET_GATE,
    baseScore: 80,
    severity: "high",
    riskyPhrases: ["veterinary treatment", "pet disease cure"],
    saferRewrite: "Supports everyday pet wellness, comfort, and healthy skin and coat appearance.",
    mainIssue: "Veterinary treatment or disease claim for pets.",
    whyRisky: "Pet disease treatment claims can cause products to be regulated as animal drugs.",
    similarPattern: "Pet veterinary treatment claim",
    suggestedAction: "Use comfort, wellness, and appearance support language — not treat, cure, or prevent disease.",
    semanticAnchors: ["cures dog arthritis", "treats pet anxiety", "cures itching", "vet-grade cure"],
  },
  {
    id: "testimonial_risk",
    label: "Testimonial / UGC Claim Risk",
    patterns: [
      /\bthis\s+(cured|healed|fixed|treated)\s+my\b/i,
      /\bmy\s+(diabetes|anxiety|eczema|inflammation|pain)\s+(improved|is\s+gone|disappeared|vanished)\b/i,
      /\bi\s+lost\s+\d+\s*(kg|lb|pounds?)\s+in\s+\d+\s*(week|weeks|day|days)\b/i,
      /\bmy\s+baby\s+stopped\s+getting\s+sick\b/i,
    ],
    baseScore: 76,
    severity: "high",
    riskyPhrases: ["testimonial treatment claim", "UGC disease outcome"],
    saferRewrite: "Individual experiences vary. Consider whether this testimonial implies a treatment or guaranteed result before using it in marketing.",
    mainIssue: "Testimonial may create claim risk if used in marketing.",
    whyRisky: "User testimonials that describe treatment outcomes or guaranteed results can still create advertising compliance risk for the brand.",
    similarPattern: "Testimonial with treatment / guaranteed result",
    suggestedAction: "Review whether this testimonial implies a disease treatment or guaranteed outcome before publishing.",
    semanticAnchors: ["this cured my acne", "my diabetes improved", "I lost 15 kg in 2 weeks", "my anxiety is gone"],
  },
  {
    id: "misleading_scientific_proof",
    label: "Unsupported Scientific Proof Claim Risk",
    patterns: [
      /\b(clinically|scientifically)\s+proven\b/i,
      /\bdoctor\s+recommended\b/i,
      /\bdermatologist\s+approved\b/i,
      /\blab\s+tested\s+to\s+cure\b/i,
      /\bfda\s+approved\b/i,
      /\b100%\s+effective\b/i,
      /\bbacked\s+by\s+science\b/i,
      /\bmedical[- ]grade\s+results?\b/i,
      /\bguaranteed\s+results?\b/i,
    ],
    categoryGate: /cosmetic|skincare|supplement|food|beverage|wellness|weight|baby|pet/i,
    baseScore: 58,
    severity: "needs_review",
    riskyPhrases: ["clinically proven", "doctor recommended", "guaranteed results"],
    saferRewrite: "Carefully formulated with quality ingredients. Confirm substantiation before using proof or endorsement language.",
    mainIssue: "Strong proof or endorsement claim that may require substantiation.",
    whyRisky: "Clinically proven, doctor recommended, and guaranteed-results language needs reliable evidence and clear scope.",
    similarPattern: "Unsupported scientific / proof claim",
    suggestedAction: "Confirm substantiation exists before publishing proof claims, or use softer formulation language.",
    semanticAnchors: ["clinically proven", "scientifically proven", "doctor recommended", "guaranteed results"],
  },
];

const KNOWN_FALSE_NEGATIVES: {
  claim: string;
  productCategory: string;
  correctLevel: GuardRiskLevel;
  family: RiskCategory;
}[] = [
  { claim: "Make you white", productCategory: "Facewash", correctLevel: "high", family: "skin_whitening_claim" },
  { claim: "Makes your face white", productCategory: "Skincare", correctLevel: "high", family: "skin_whitening_claim" },
  { claim: "Whitens skin in 7 days", productCategory: "Cosmetic", correctLevel: "high", family: "skin_whitening_claim" },
  { claim: "Get fair skin naturally", productCategory: "Beauty", correctLevel: "high", family: "skin_whitening_claim" },
  { claim: "Cures inflammation", productCategory: "Dietary Supplement", correctLevel: "high", family: "disease_treatment" },
  { claim: "Prevents diabetes", productCategory: "Functional Food", correctLevel: "high", family: "disease_prevention" },
  { claim: "Burns belly fat", productCategory: "Weight loss", correctLevel: "high", family: "weight_loss_claim" },
  { claim: "Cures anxiety", productCategory: "Wellness", correctLevel: "high", family: "mental_health_claim" },
  { claim: "Boosts baby immunity", productCategory: "Baby products", correctLevel: "high", family: "baby_medical_claim" },
  { claim: "Cures dog arthritis", productCategory: "Pet products", correctLevel: "high", family: "pet_veterinary_claim" },
  { claim: "This cured my acne", productCategory: "Skincare", correctLevel: "high", family: "testimonial_risk" },
];

function matchesCategory(gate: RegExp | undefined, exclude: RegExp | undefined, productCategory: string, sector?: string): boolean {
  const context = `${productCategory} ${sector || ""}`;
  if (exclude?.test(context)) return false;
  if (!gate) return true;
  return gate.test(context);
}

function scoreToLevel(score: number, familySeverity: GuardRiskLevel): GuardRiskLevel {
  if (score >= 75) return "high";
  if (score >= 55) return familySeverity === "needs_review" ? "needs_review" : "medium";
  if (score >= 30) return "needs_review";
  return familySeverity;
}

export function isKnownSafeMarketingPhrase(claimText: string): boolean {
  return KNOWN_SAFE_PHRASES.some((p) => p.test(claimText));
}

function isKnownSafePhrase(claimText: string): boolean {
  return isKnownSafeMarketingPhrase(claimText);
}

function isConfidentlySafe(claimText: string, baseLevel: string): boolean {
  if (isKnownSafePhrase(claimText)) return true;
  if (baseLevel !== "low") return false;
  const saferHits = SAFER_STRUCTURE_PATTERNS.filter((p) => p.test(claimText)).length;
  const riskyHits = ESCALATION_PATTERNS.filter(({ pattern }) => pattern.test(claimText)).length;
  return saferHits >= 2 && riskyHits === 0;
}

function semanticFamilyHit(claimText: string, family: RiskFamily): number {
  if (!family.semanticAnchors?.length) return 0;
  let best = 0;
  for (const anchor of family.semanticAnchors) {
    const sim = jaccardSimilarity(claimText, anchor);
    if (sim > best) best = sim;
    if (claimText.toLowerCase().includes(anchor.toLowerCase())) best = Math.max(best, 0.85);
  }
  return best >= 0.35 ? best : 0;
}

function checkDentalWhiteningBorderline(
  claimText: string,
  productCategory: string,
  sector?: string,
): FalseNegativeGuardResult | null {
  const context = `${productCategory} ${sector || ""}`;
  if (!DENTAL_BORDERLINE.test(context)) return null;
  const whitening = /\b(whiten|whitening|white|brighter?\s+smile)\b/i.test(claimText);
  if (!whitening) return null;
  return {
    triggered: true,
    overrideLevel: "needs_review",
    overrideScore: 48,
    riskCategories: ["cosmetic_drug_boundary"],
    riskyPhrases: ["teeth whitening claim"],
    mainIssue: "Teeth whitening claim may be acceptable with substantiation.",
    whyRisky: "Whitening claims for oral care products may be permissible but often need evidence and careful regional framing.",
    saferRewrite: "Helps teeth look clean and bright when used as directed.",
    similarPattern: "Cosmetic whitening — oral care",
    confidence: 72,
    suggestedAction: "Confirm substantiation and regional rules before publishing whitening language.",
    guardSignals: ["dental_whitening_borderline"],
    layersUsed: ["false_negative_guard", "context_gate"],
  };
}

export function runFalseNegativeGuard(
  input: ClaimIntelligenceInput | AnalyzeClaimInput,
  base: Pick<ClaimAnalysisResult, "riskLevel" | "riskScore" | "riskyPhrases" | "saferRewrite" | "explanation">,
): FalseNegativeGuardResult {
  const claimText = input.claimText;
  const productCategory = input.productCategory;
  const sector = "sector" in input ? input.sector : undefined;
  const contextType = input.contextType;

  const empty: FalseNegativeGuardResult = {
    triggered: false,
    riskCategories: [],
    riskyPhrases: [],
    mainIssue: "",
    whyRisky: "",
    saferRewrite: base.saferRewrite,
    similarPattern: "",
    confidence: 0,
    suggestedAction: "",
    guardSignals: [],
    layersUsed: [],
  };

  if (isKnownSafePhrase(claimText)) {
    return empty;
  }

  if (isConfidentlySafe(claimText, base.riskLevel)) {
    return empty;
  }

  const dental = checkDentalWhiteningBorderline(claimText, productCategory, sector);
  if (dental) return dental;

  let bestFamily: (RiskFamily & { score: number; semanticBoost: number }) | null = null;
  const guardSignals: string[] = [];
  const matchedPhrases: string[] = [];

  for (const family of RISK_FAMILIES) {
    if (!matchesCategory(family.categoryGate, family.categoryExclude, productCategory, sector)) continue;

    const patternHit = family.patterns.some((p) => p.test(claimText));
    const semantic = semanticFamilyHit(claimText, family);
    if (!patternHit && semantic < 0.4) continue;

    let score = family.baseScore;
    if (patternHit) {
      guardSignals.push(`family:${family.id}`);
      matchedPhrases.push(...family.riskyPhrases);
    }
    if (semantic >= 0.4) {
      score = Math.min(99, score + Math.round(semantic * 10));
      guardSignals.push(`semantic:${family.id}`);
    }

    for (const esc of ESCALATION_PATTERNS) {
      if (esc.pattern.test(claimText)) {
        if (esc.phrase === "biological mechanism claim" && /\bhealthy\s+inflammatory\s+response\b/i.test(claimText)) {
          continue;
        }
        score = Math.min(99, score + esc.boost);
        matchedPhrases.push(esc.phrase);
        guardSignals.push(`escalation:${esc.phrase}`);
      }
    }

    if (/ad copy|social media|influencer|headline|tiktok|instagram/i.test(contextType)) {
      score = Math.min(99, score + 5);
      guardSignals.push("channel:marketing");
    }

    if (!bestFamily || score > bestFamily.score) {
      bestFamily = { ...family, score, semanticBoost: semantic };
    }
  }

  for (const known of KNOWN_FALSE_NEGATIVES) {
    const catMatch = new RegExp(known.productCategory, "i").test(`${productCategory} ${sector || ""}`);
    const claimMatch =
      claimText.toLowerCase().trim() === known.claim.toLowerCase().trim() ||
      jaccardSimilarity(claimText, known.claim) >= 0.6;
    if (catMatch && claimMatch) {
      const family = RISK_FAMILIES.find((f) => f.id === known.family);
      if (family) {
        const score = Math.max(family.baseScore, 85);
        if (!bestFamily || score > bestFamily.score) {
          bestFamily = { ...family, score, semanticBoost: 1 };
          guardSignals.push(`known_fn:${known.claim}`);
        }
      }
    }
  }

  if (!bestFamily) return empty;

  const overrideLevel = scoreToLevel(bestFamily.score, bestFamily.severity);
  const shouldOverride =
    base.riskLevel === "low" ||
    (base.riskLevel === "medium" && (overrideLevel === "high" || overrideLevel === "needs_review")) ||
    (base.riskScore < bestFamily.score - 10);

  if (!shouldOverride && base.riskLevel === "high") {
    return {
      ...empty,
      triggered: true,
      riskCategories: [bestFamily.id],
      riskyPhrases: [...new Set([...base.riskyPhrases, ...matchedPhrases])],
      similarPattern: bestFamily.similarPattern,
      guardSignals,
      layersUsed: ["false_negative_guard"],
    };
  }

  if (!shouldOverride) return empty;

  const confidence =
    overrideLevel === "high"
      ? Math.min(97, 88 + (bestFamily.semanticBoost > 0 ? 6 : 0))
      : overrideLevel === "needs_review"
        ? 68
        : 78;

  return {
    triggered: true,
    overrideLevel,
    overrideScore: bestFamily.score,
    riskCategories: [bestFamily.id],
    riskyPhrases: [...new Set([...base.riskyPhrases, ...matchedPhrases, ...bestFamily.riskyPhrases])],
    mainIssue: bestFamily.mainIssue,
    whyRisky: bestFamily.whyRisky,
    saferRewrite: bestFamily.saferRewrite,
    similarPattern: bestFamily.similarPattern,
    confidence,
    suggestedAction: bestFamily.suggestedAction,
    guardSignals,
    layersUsed: ["false_negative_guard", "risk_families", "semantic_similarity"],
  };
}

export function applyFalseNegativeGuard<T extends ClaimAnalysisResult>(
  input: ClaimIntelligenceInput | AnalyzeClaimInput,
  result: T,
  guard: FalseNegativeGuardResult,
): T & { guardApplied?: boolean; similarPattern?: string; suggestedNextAction?: string } {
  if (!guard.triggered || !guard.overrideLevel) {
    return { ...result, guardApplied: guard.triggered };
  }

  const levelOrder: Record<string, number> = { low: 0, needs_review: 1, medium: 2, high: 3 };
  const current = levelOrder[result.riskLevel] ?? 0;
  const proposed = levelOrder[guard.overrideLevel] ?? 0;
  const finalLevel = proposed > current ? guard.overrideLevel : result.riskLevel;

  const finalScore = Math.max(result.riskScore, guard.overrideScore ?? result.riskScore);
  const phrases = [...new Set([...result.riskyPhrases, ...guard.riskyPhrases])];

  let explanation = result.explanation;
  if (guard.mainIssue) {
    explanation = `${guard.whyRisky} Reviewed as ${input.contextType.toLowerCase()} for ${input.productCategory} (${input.market}).`;
  }

  return {
    ...result,
    riskLevel: finalLevel as ClaimAnalysisResult["riskLevel"],
    riskScore: finalScore,
    riskyPhrases: phrases,
    explanation,
    saferRewrite: guard.saferRewrite || result.saferRewrite,
    guardApplied: true,
    similarPattern: guard.similarPattern,
    suggestedNextAction: guard.suggestedAction,
  };
}

export { KNOWN_FALSE_NEGATIVES, RISK_FAMILIES };