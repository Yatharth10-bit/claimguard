import { analyzeClaim } from "@/lib/analyzeClaim";
import { getClaimTemplates } from "@/lib/claimIntelligence/claimTemplates";
import {
  CLAIM_VARIANTS_PER_PRODUCT,
  DISTINCT_PRODUCT_COUNT,
  MEGA_DATASET_SIZE,
  productAtIndex,
  sectorIndexForName,
} from "@/lib/claimIntelligence/productCatalog";
import { detectRiskCategories } from "@/lib/claimIntelligence/riskCategories";
import type { ClaimExampleRecord } from "@/lib/claimIntelligence/types";
import { jaccardSimilarity, tokenize } from "@/lib/claimIntelligence/similarity";

const CHANNELS = ["Website", "Amazon listing", "Ad copy", "Social media", "Influencer script", "Label"];
const REGIONS = ["United States FDA + FTC", "India FSSAI", "European Union", "United Kingdom", "Canada", "Australia"];

export function getMegaDatasetSize(): number {
  return MEGA_DATASET_SIZE;
}

export function getDistinctProductCount(): number {
  return DISTINCT_PRODUCT_COUNT;
}

type MegaClaimCore = {
  idx: number;
  claimText: string;
  product: ReturnType<typeof productAtIndex>;
  template: ReturnType<typeof getClaimTemplates>[number];
  channel: string;
  region: string;
};

function resolveMegaCore(globalIndex: number): MegaClaimCore {
  const idx = ((globalIndex % MEGA_DATASET_SIZE) + MEGA_DATASET_SIZE) % MEGA_DATASET_SIZE;
  const productIndex = Math.floor(idx / CLAIM_VARIANTS_PER_PRODUCT);
  const variantIndex = idx % CLAIM_VARIANTS_PER_PRODUCT;
  const product = productAtIndex(productIndex);
  const templates = getClaimTemplates();
  const template = templates[variantIndex % templates.length];
  const claimText = template.template
    .replace("{name}", product.name)
    .replace("{ingredient}", product.ingredient)
    .replace("{product}", product.name);
  return {
    idx,
    claimText,
    product,
    template,
    channel: CHANNELS[variantIndex % CHANNELS.length],
    region: REGIONS[(productIndex + variantIndex) % REGIONS.length],
  };
}

function coreToLightRecord(core: MegaClaimCore): ClaimExampleRecord {
  return {
    id: `mega-${core.idx}`,
    sector: core.product.sector,
    productCategory: core.product.productCategory,
    productType: core.product.productType,
    region: core.region,
    channel: core.channel,
    claimText: core.claimText,
    riskLevel: core.template.risk,
    riskCategory: core.template.category,
    riskReason: "Pattern from mega product catalog.",
    saferRewrite: core.claimText,
    confidenceScore: core.template.risk === "high" ? 85 : 75,
    source: "mega_catalog_v1",
    sourceUrl: "",
    trustScore: 90,
  };
}

/** Full analysis — use for seed export, not hot retrieval paths. */
export function generateMegaExampleAtIndex(globalIndex: number): ClaimExampleRecord {
  const core = resolveMegaCore(globalIndex);
  const analysis = analyzeClaim({
    claimText: core.claimText,
    productCategory: core.product.productCategory,
    ingredients: [core.product.ingredient],
    market: core.region,
    contextType: core.channel,
  });
  const categories = detectRiskCategories(core.claimText, analysis.riskyPhrases);
  const riskLevel = analysis.riskLevel === "low" && core.template.risk !== "low" ? core.template.risk : analysis.riskLevel;

  return {
    ...coreToLightRecord(core),
    riskLevel,
    riskCategory: categories[0] || core.template.category,
    riskReason: analysis.explanation.split(".")[0] + ".",
    saferRewrite: analysis.saferRewrite,
    confidenceScore: riskLevel === "high" ? 88 : riskLevel === "medium" ? 80 : 75,
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick candidate global indices biased toward sector + claim tokens — never scans full 1M. */
export function pickRetrievalCandidateIndices(
  claimText: string,
  sector?: string,
  count = 120,
): number[] {
  const tokens = tokenize(claimText);
  const baseHash = hashString(claimText.toLowerCase());
  const sectorIdx = sectorIndexForName(sector);
  const indices = new Set<number>();

  const sectorStart = sectorIdx !== null ? sectorIdx * 80 * CLAIM_VARIANTS_PER_PRODUCT : 0;
  const sectorSpan = sectorIdx !== null ? 80 * CLAIM_VARIANTS_PER_PRODUCT : MEGA_DATASET_SIZE;

  for (let i = 0; i < count; i++) {
    const tokenBump = tokens.length ? hashString(tokens[i % tokens.length]) : 0;
    const mixed = (baseHash + i * 9973 + tokenBump) >>> 0;
    let idx: number;
    if (sectorIdx !== null && i < count * 0.7) {
      idx = sectorStart + (mixed % sectorSpan);
    } else {
      idx = mixed % MEGA_DATASET_SIZE;
    }
    indices.add(idx);
  }

  return [...indices];
}

/** Retrieve top similar examples from virtual 1M dataset without loading into memory. */
export function retrieveFromMegaDataset(
  claimText: string,
  sector?: string,
  productCategory?: string,
  limit = 8,
): ClaimExampleRecord[] {
  const candidates = pickRetrievalCandidateIndices(claimText, sector, 150);
  const scored: { core: MegaClaimCore; sim: number }[] = [];

  for (const idx of candidates) {
    const core = resolveMegaCore(idx);
    let sim = jaccardSimilarity(claimText, core.claimText);
    if (sector && core.product.sector.toLowerCase().includes(sector.toLowerCase())) sim += 0.06;
    if (productCategory && core.product.productCategory === productCategory) sim += 0.04;
    if (sim >= 0.04) scored.push({ core, sim });
  }

  const top = scored.sort((a, b) => b.sim - a.sim).slice(0, limit);

  return top.map(({ core }) => {
    const analysis = analyzeClaim({
      claimText: core.claimText,
      productCategory: core.product.productCategory,
      ingredients: [core.product.ingredient],
      market: core.region,
      contextType: core.channel,
    });
    const categories = detectRiskCategories(core.claimText, analysis.riskyPhrases);
    return {
      ...coreToLightRecord(core),
      riskLevel: analysis.riskLevel,
      riskCategory: categories[0] || core.template.category,
      riskReason: analysis.explanation.split(".")[0] + ".",
      saferRewrite: analysis.saferRewrite,
    };
  });
}

/** Fast batch for DB seeding — template-based, no per-row analyzeClaim. */
export function* iterateMegaBatchLight(start: number, batchSize: number): Generator<ClaimExampleRecord> {
  for (let i = 0; i < batchSize; i++) {
    yield coreToLightRecord(resolveMegaCore(start + i));
  }
}

export function* iterateMegaBatch(start: number, batchSize: number): Generator<ClaimExampleRecord> {
  for (let i = 0; i < batchSize; i++) {
    yield generateMegaExampleAtIndex(start + i);
  }
}