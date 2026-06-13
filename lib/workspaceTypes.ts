export type Risk = "High risk" | "Medium risk" | "Safe";
export type RiskLevel = "low" | "medium" | "high";
export type ClaimStatus = "Needs Review" | "Fixing" | "Fixed" | "Approved" | "Expert Review Needed";
export type TaskStatus = ClaimStatus;

export type Product = {
  id: string;
  name: string;
  category: string;
  market: string;
  platforms: string[];
  ingredients: string[];
  claims: string;
  checks: number;
  risk: Risk;
  lastScanned: string;
};

export type ClaimAnalysis = {
  id: string;
  originalClaim: string;
  context: string;
  product: string;
  productId?: string | null;
  date: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskyPhrases: string[];
  explanation: string;
  saferRewrite: string;
  checklist: string[];
  sources: { title: string; url: string }[];
  disclaimer: string;
  status: ClaimStatus;
  storage?: "workspace" | "local";
};

export type RegulationUpdate = {
  id: string;
  organization: string;
  country: string;
  category: string;
  title: string;
  summary: string;
  officialUrl: string;
  dateFound: string;
  status: string;
  notes: string;
};

export type WorkflowTask = {
  id: string;
  product: string;
  claimIssue: string;
  riskLevel: RiskLevel;
  source: string;
  dueDate: string;
  status: TaskStatus;
};

export type AuditEvent = {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
};