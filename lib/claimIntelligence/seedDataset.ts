import type { ClaimExampleRecord } from "@/lib/claimIntelligence/types";
import { getMegaDatasetSize, retrieveFromMegaDataset } from "@/lib/claimIntelligence/megaSeedGenerator";

/** Legacy in-memory cache for small regression overlay — mega dataset is virtual. */
let legacyOverlay: ClaimExampleRecord[] | null = null;

export function getSeedDatasetSize(): number {
  return getMegaDatasetSize();
}

export function getSeedExamples(): ClaimExampleRecord[] {
  if (legacyOverlay) return legacyOverlay;
  legacyOverlay = retrieveFromMegaDataset("supports wellness immune health skin", "Supplements", "Dietary Supplement", 200);
  return legacyOverlay;
}

export function getSeedExamplesForQuery(sector: string | undefined, limit = 800): ClaimExampleRecord[] {
  return retrieveFromMegaDataset(
    sector ? `${sector} supplement wellness support` : "dietary supplement wellness support",
    sector,
    undefined,
    Math.min(limit, 200),
  );
}