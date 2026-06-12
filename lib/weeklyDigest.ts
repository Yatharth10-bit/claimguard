import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { REGULATORY_SOURCES } from "@/lib/regulatorySources";
import { matchRegulationImpacts, type WorkflowClaim, type WorkflowProduct, type WorkflowRegulation } from "@/lib/workflow";

export type DigestItem = {
  id: string;
  type: "regulation" | "impact" | "action";
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  href?: string;
};

const REGION_ORGS: Record<string, string[]> = {
  "United States": ["FDA", "FTC", "EPA", "USDA", "CPSC", "TTB", "CFPB"],
  India: ["FSSAI"],
  "European Union": ["European Commission"],
  "United Kingdom": ["GOV.UK", "Food Standards Agency", "MHRA"],
  Canada: ["CFIA", "Health Canada"],
  Australia: ["TGA", "ACCC"],
};

function orgMatchesRegions(organization: string, regions: string[]) {
  return regions.some((region) => (REGION_ORGS[region] || []).includes(organization));
}

export function buildWeeklyDigest(input: {
  profile: BrandComplianceProfile;
  regulations: WorkflowRegulation[];
  products: WorkflowProduct[];
  claims: WorkflowClaim[];
}): DigestItem[] {
  const items: DigestItem[] = [];
  const regions = input.profile.salesRegions.length ? input.profile.salesRegions : ["United States"];

  const curated = REGULATORY_SOURCES
    .filter((source) => orgMatchesRegions(source.organization, regions))
    .slice(0, 4)
    .map((source) => ({
      id: `source-${source.id}`,
      type: "regulation" as const,
      title: source.title,
      summary: source.summary,
      priority: source.liveSync ? "high" as const : "medium" as const,
      href: source.url,
    }));
  items.push(...curated);

  const liveUpdates = input.regulations
    .filter((reg) => orgMatchesRegions(reg.organization, regions))
    .slice(0, 3)
    .map((reg) => ({
      id: `update-${reg.id}`,
      type: "regulation" as const,
      title: reg.title,
      summary: reg.summary,
      priority: "high" as const,
      href: reg.officialUrl,
    }));
  items.push(...liveUpdates);

  const impacts = matchRegulationImpacts(input.products, input.claims, input.regulations).slice(0, 3);
  for (const impact of impacts) {
    items.push({
      id: impact.id,
      type: "impact",
      title: `${impact.product} may be affected`,
      summary: impact.reason,
      priority: impact.riskLevel === "high" ? "high" : "medium",
      href: impact.regulation.officialUrl,
    });
  }

  const highClaims = input.claims.filter((claim) => claim.riskLevel === "high").slice(0, 2);
  for (const claim of highClaims) {
    items.push({
      id: `claim-${claim.id}`,
      type: "action",
      title: `Review high-risk copy for ${claim.product}`,
      summary: claim.originalClaim,
      priority: "high",
      href: "/claims",
    });
  }

  if (!items.length) {
    items.push({
      id: "empty",
      type: "action",
      title: "Run your first claim check",
      summary: "Add a product and scan your marketing copy to populate this digest.",
      priority: "low",
      href: "/claim-checker",
    });
  }

  return items.slice(0, 8);
}