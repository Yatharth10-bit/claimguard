import type { ClaimIntelligenceResult } from "@/lib/claimIntelligence/types";
import type { ClaimIntelligenceInput } from "@/lib/claimIntelligence/types";

type CacheEntry = { result: ClaimIntelligenceResult; expires: number };

const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 500;

function cacheKey(input: ClaimIntelligenceInput): string {
  return [
    input.claimText.trim().toLowerCase(),
    input.productCategory,
    input.market,
    input.contextType,
    input.sector || "",
  ].join("|");
}

export function getCachedIntelligence(input: ClaimIntelligenceInput): ClaimIntelligenceResult | null {
  const key = cacheKey(input);
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    CACHE.delete(key);
    return null;
  }
  return entry.result;
}

export function setCachedIntelligence(input: ClaimIntelligenceInput, result: ClaimIntelligenceResult): void {
  if (CACHE.size >= MAX_ENTRIES) {
    const oldest = CACHE.keys().next().value;
    if (oldest) CACHE.delete(oldest);
  }
  CACHE.set(cacheKey(input), { result, expires: Date.now() + TTL_MS });
}