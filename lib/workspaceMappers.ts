import { CLAIM_DISCLAIMER } from "@/lib/analyzeClaim";
import type { ClaimAnalysis, ClaimStatus, Product, RegulationUpdate, Risk, RiskLevel, WorkflowTask } from "@/lib/workspaceTypes";

const fallbackDisclaimer = CLAIM_DISCLAIMER;

export function toRisk(level: RiskLevel): Risk {
  return level === "high" ? "High risk" : level === "medium" ? "Medium risk" : "Safe";
}

export function formatWorkspaceDate(value: string | null | undefined) {
  if (!value) return "Not scanned";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function claimStatusFromDb(status: string): ClaimStatus {
  if (status === "expert_review_needed") return "Expert Review Needed";
  if (status === "needs_review") return "Needs Review";
  if (status === "fixing") return "Fixing";
  if (status === "fixed") return "Fixed";
  if (status === "approved") return "Approved";
  return "Needs Review";
}

export function taskStatusFromDb(status: string): WorkflowTask["status"] {
  if (status === "fixing") return "Fixing";
  if (status === "fixed") return "Fixed";
  if (status === "approved") return "Approved";
  if (status === "expert_review_needed") return "Expert Review Needed";
  return "Needs Review";
}

export function enrichProduct(row: Record<string, unknown>, claims: ClaimAnalysis[]): Product {
  const productClaims = claims.filter((claim) => claim.productId === row.id || claim.product === row.name);
  const latest = productClaims[0];
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    market: String(row.market),
    platforms: (row.platforms as string[]) || [],
    ingredients: (row.ingredients as string[]) || [],
    claims: String(row.claims_text || ""),
    checks: productClaims.length,
    risk: toRisk(latest?.riskLevel || "low"),
    lastScanned: latest?.date || "Not scanned",
  };
}

export function rowToAnalysis(row: Record<string, unknown>): ClaimAnalysis {
  const products = row.products as { name?: string } | null;
  return {
    id: String(row.id),
    originalClaim: String(row.original_text),
    context: String(row.context_type),
    product: products?.name || "Unassigned",
    productId: row.product_id ? String(row.product_id) : null,
    date: formatWorkspaceDate(row.created_at as string),
    riskLevel: row.risk_level as RiskLevel,
    riskScore: Number(row.risk_score),
    riskyPhrases: (row.risky_phrases as string[]) || [],
    explanation: String(row.explanation),
    saferRewrite: String(row.safer_rewrite),
    checklist: (row.checklist as string[]) || [],
    sources: (row.sources as { title: string; url: string }[]) || [],
    disclaimer: String(row.disclaimer || fallbackDisclaimer),
    status: claimStatusFromDb(String(row.status)),
    storage: "workspace",
  };
}

export function rowToTask(row: Record<string, unknown>): WorkflowTask {
  return {
    id: String(row.id),
    product: String(row.product_name),
    claimIssue: String(row.claim_issue),
    riskLevel: row.risk_level as RiskLevel,
    source: String(row.source),
    dueDate: String(row.due_date || ""),
    status: taskStatusFromDb(String(row.status)),
  };
}

export function rowToRegulation(row: Record<string, unknown>): RegulationUpdate {
  return {
    id: String(row.id),
    organization: String(row.organization),
    country: String(row.country),
    category: String(row.category),
    title: String(row.title),
    summary: String(row.summary),
    officialUrl: String(row.official_url),
    dateFound: formatWorkspaceDate(row.date_found as string),
    status: "unread",
    notes: "",
  };
}