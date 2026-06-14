import { getSourceReferences } from "@/lib/regulatorySources";
import type { ClaimIntelligenceInput } from "@/lib/claimIntelligence/types";
import type { ClaimRule } from "@/lib/claimRules";

export function buildRegulatoryContext(input: ClaimIntelligenceInput, matchedRules: ClaimRule[]) {
  const sourceIds = [...new Set(matchedRules.flatMap((r) => r.sourceIds || []))];
  const refs = getSourceReferences({
    ...input,
    matchedSourceIds: sourceIds,
  });

  const authorityNote = refs.length
    ? `Compared against ${refs.length} regulatory reference(s) from trusted guidance sources.`
    : "No specific regulatory passage matched; general advertising and labeling principles still apply.";

  return { sourceReferences: refs, authorityNote };
}