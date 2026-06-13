"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight, Check, CheckCircle2, ChevronRight, ClipboardCheck, Copy, ExternalLink,
  FileText, FlaskConical, Gauge, LayoutDashboard, Lightbulb, ListChecks, LoaderCircle, LogOut,
  Landmark, Menu, Package, Plus, Search, Settings, ShieldCheck, Sparkles, Trash2, TrendingUp,
  Upload, WandSparkles, AlertTriangle, CalendarDays, ChevronDown, Printer, ScanText,
  UserRound, X, Zap, Sun, Moon, Contrast, Globe2
} from "lucide-react";
import { BetaBadge } from "@/components/billing/BetaBadge";
import { UsageMeter } from "@/components/billing/UsageMeter";
import { WeeklyDigestPanel } from "@/components/billing/WeeklyDigestPanel";
import { ClaimExamplePicker } from "@/components/claim-checker/ClaimExamplePicker";
import { ComplianceCopilotPanel } from "@/components/claim-checker/ComplianceCopilotPanel";
import { RegressionCoverageBadge } from "@/components/claim-checker/RegressionCoverageBadge";
import { RiskPatternTips } from "@/components/claim-checker/RiskPatternTips";
import { RegulationImpactExplainer } from "@/components/regulations/RegulationImpactExplainer";
import { CheckFirstClaimCTA } from "@/components/landing/CheckFirstClaimCTA";
import { FeedbackForm } from "@/components/support/FeedbackForm";
import { LegalPage } from "@/components/legal/LegalPage";
import { SignupLegalConsent } from "@/components/legal/SignupLegalConsent";
import { COOKIE_POLICY, LEGAL_POLICY_VERSION, PRIVACY_POLICY, PRODUCT_DISCLAIMER, TERMS_OF_SERVICE } from "@/lib/legalContent";
import {
  BILLING_TIER_TO_DODO,
  formatEnterpriseFrom,
  formatPlanPrice,
  FOUNDING_OFFER_COPY,
  PRICE_ANCHOR_COPY,
  PRICING_PLANS,
  PRICING_REGIONS,
  type PricingRegionCode,
} from "@/lib/pricing";
import { sectorToProductCategory, regionToMarket } from "@/lib/sectorMapping";
import type { ClaimExample } from "@/lib/claimLearnings";
import { PersonalizedDashboardHeader, PersonalizedDashboardSections } from "@/components/dashboard/PersonalizedDashboardLayer";
import { BrandProfileSettings } from "@/components/onboarding/BrandProfileSettings";
import { OnboardingPage } from "@/components/onboarding/OnboardingPage";
import { useAuthSession } from "@/contexts/AuthContext";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import { useClientMounted } from "@/hooks/useClientMounted";
import { useUsage } from "@/hooks/useUsage";
import { postAuthPath } from "@/lib/authRouting";
import { BRAND_ONBOARDING_ENABLED, isOnboardingComplete, loadBrandProfile } from "@/lib/brandProfile";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { analyzeClaim, CLAIM_DISCLAIMER } from "@/lib/analyzeClaim";
import { calculateProductRisk, matchRegulationImpacts, needsSupplementDisclaimer, splitClaimLikeSentences } from "@/lib/workflow";
import { MARKET_OPTIONS, PRODUCT_CATEGORIES } from "@/lib/complianceData";
import { REGULATORY_SOURCES } from "@/lib/regulatorySources";

type Risk = "High risk" | "Medium risk" | "Safe";
type RiskLevel = "low" | "medium" | "high";
type ClaimStatus = "Needs Review" | "Fixing" | "Fixed" | "Approved" | "Expert Review Needed";
type TaskStatus = ClaimStatus;

type Product = {
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

type ClaimAnalysis = {
  id: string;
  originalClaim: string;
  context: string;
  product: string;
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

type RegulationUpdate = {
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

type WorkflowTask = {
  id: string;
  product: string;
  claimIssue: string;
  riskLevel: RiskLevel;
  source: string;
  dueDate: string;
  status: TaskStatus;
};

type AuditEvent = {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
};

const demoProducts: Product[] = [
  {
    id: "p1",
    name: "Daily Glow Collagen",
    category: "Dietary Supplement",
    market: "United States",
    platforms: ["Website", "Amazon"],
    ingredients: ["Hydrolyzed collagen", "Vitamin C", "Biotin", "Hyaluronic acid"],
    claims: "Supports healthy skin, hair, and nails.",
    checks: 8,
    risk: "Safe",
    lastScanned: "Today",
  },
  {
    id: "p2",
    name: "Calm Night Gummies",
    category: "Dietary Supplement",
    market: "United States FDA + FTC",
    platforms: ["Retail", "Social media"],
    ingredients: ["Magnesium glycinate", "L-theanine", "Chamomile"],
    claims: "Supports a calm evening routine and restful sleep.",
    checks: 5,
    risk: "High risk",
    lastScanned: "May 28, 2026",
  },
  {
    id: "p3",
    name: "Focus Spark",
    category: "Beverage",
    market: "United States FDA + FTC",
    platforms: ["Website", "Amazon", "Retail"],
    ingredients: ["Green tea extract", "L-theanine", "B vitamins"],
    claims: "Helps support focus and sustained energy.",
    checks: 11,
    risk: "Medium risk",
    lastScanned: "May 24, 2026",
  },
];

const demoClaims: ClaimAnalysis[] = [
  {
    id: "c1",
    originalClaim: "Supports healthy skin, hair, and nails.",
    context: "Website",
    product: "Daily Glow Collagen",
    date: "Jun 11, 2026",
    riskLevel: "low",
    riskScore: 18,
    riskyPhrases: [],
    explanation: "No configured high- or medium-risk phrases were found.",
    saferRewrite: "Supports healthy skin, hair, and nails.",
    checklist: [
      "Confirm the claim is truthful and not misleading.",
      "Keep substantiation on file.",
      "Review the complete ad or label context.",
    ],
    sources: [
      { title: "FDA: Structure/Function Claims", url: "https://www.fda.gov/food/food-labeling-nutrition/structurefunction-claims" },
      { title: "FTC: Health Products Compliance Guidance", url: "https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance" },
    ],
    disclaimer: CLAIM_DISCLAIMER,
    status: "Approved",
  },
  {
    id: "c2",
    originalClaim: "Treats anxiety and supports deep sleep.",
    context: "Ad copy",
    product: "Calm Night Gummies",
    date: "Jun 10, 2026",
    riskLevel: "high",
    riskScore: 88,
    riskyPhrases: ["treat", "anxiety"],
    explanation: "This claim contains disease or treatment language that can create significant FDA or FTC risk.",
    saferRewrite: "Supports relaxation and calm and helps support restful sleep.",
    checklist: [
      "Remove disease, cure, treatment, or prevention language.",
      "Use measured structure/function wording.",
      "Confirm strong substantiation before publishing.",
      "Escalate the final claim for compliance review.",
    ],
    sources: [
      { title: "FDA: Structure/Function Claims", url: "https://www.fda.gov/food/food-labeling-nutrition/structurefunction-claims" },
      { title: "FTC: Health Products Compliance Guidance", url: "https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance" },
    ],
    disclaimer: CLAIM_DISCLAIMER,
    status: "Expert Review Needed",
  },
];

const demoRegulations: RegulationUpdate[] = REGULATORY_SOURCES.map((source, index) => ({
  id: source.id,
  organization: source.organization,
  country: source.country,
  category: source.category,
  title: source.title,
  summary: source.summary,
  officialUrl: source.url,
  dateFound: index < 5 ? "Jun 12, 2026" : "Reference library",
  status: "unread",
  notes: "",
}));

const fallbackDisclaimer = CLAIM_DISCLAIMER;
const useDevelopmentFallback = process.env.NODE_ENV === "development" && !isSupabaseConfigured();

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/claim-checker", label: "Claim Checker", icon: Sparkles },
  { href: "/copy-scanner", label: "Copy Scanner", icon: ScanText },
  { href: "/claims", label: "Saved Claims", icon: ClipboardCheck },
  { href: "/regulations", label: "Regulations", icon: Landmark },
  { href: "/impact", label: "Product Impact", icon: AlertTriangle },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const statusStyles: Record<Risk, string> = {
  "Safe": "border border-emerald-100 bg-emerald-50 text-emerald-600",
  "Medium risk": "border border-amber-100 bg-amber-50 text-amber-600",
  "High risk": "border border-red-100 bg-red-50 text-red-600",
};

const levelStyles: Record<RiskLevel, string> = {
  low: "border border-emerald-100 bg-emerald-50 text-emerald-600",
  medium: "border border-amber-100 bg-amber-50 text-amber-600",
  high: "border border-red-100 bg-red-50 text-red-600",
};

function toRisk(level: RiskLevel): Risk {
  return level === "high" ? "High risk" : level === "medium" ? "Medium risk" : "Safe";
}

function statusToDb(status: ClaimStatus) {
  return status === "Expert Review Needed" ? "expert_review_needed" : status === "Needs Review" ? "needs_review" : status.toLowerCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not scanned";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function displayText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&#0*34;/g, "\"")
    .replace(/&nbsp;/g, " ");
}

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    market: row.market,
    platforms: row.platforms || [],
    ingredients: row.ingredients || [],
    claims: row.claims_text || "",
    checks: row.claims?.length || 0,
    risk: toRisk((row.claims?.[0]?.risk_level || "low") as RiskLevel),
    lastScanned: formatDate(row.claims?.[0]?.created_at),
  };
}

function rowToAnalysis(row: any): ClaimAnalysis {
  return {
    id: row.id,
    originalClaim: row.original_text,
    context: row.context_type,
    product: row.products?.name || "Unassigned",
    date: formatDate(row.created_at),
    riskLevel: row.risk_level,
    riskScore: row.risk_score,
    riskyPhrases: row.risky_phrases || [],
    explanation: row.explanation,
    saferRewrite: row.safer_rewrite,
    checklist: row.checklist || [],
    sources: row.sources || [],
    disclaimer: row.disclaimer || fallbackDisclaimer,
    status: row.status === "fixing" ? "Fixing" : row.status === "fixed" ? "Fixed" : row.status === "approved" ? "Approved" : row.status === "expert_review_needed" ? "Expert Review Needed" : "Needs Review",
    storage: "workspace",
  };
}

function readFallback<T>(key: string, seed: T): T {
  if (!useDevelopmentFallback || typeof window === "undefined") return seed;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(key, JSON.stringify(seed));
  } catch {
    return seed;
  }
  return seed;
}

function writeFallback<T>(key: string, value: T) {
  if (!useDevelopmentFallback || typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function readClaimFallback() {
  if (typeof window === "undefined") return [] as ClaimAnalysis[];
  try { return JSON.parse(localStorage.getItem("claimguard-claims-fallback") || "[]") as ClaimAnalysis[]; } catch { return []; }
}

function writeClaimFallback(claims: ClaimAnalysis[]) {
  if (typeof window !== "undefined") localStorage.setItem("claimguard-claims-fallback", JSON.stringify(claims));
}

function readRegulationFallback() {
  if (typeof window === "undefined") return [] as RegulationUpdate[];
  try { return JSON.parse(localStorage.getItem("claimguard-regulations-fallback") || "[]") as RegulationUpdate[]; } catch { return []; }
}

function writeRegulationFallback(updates: RegulationUpdate[]) {
  if (typeof window !== "undefined") localStorage.setItem("claimguard-regulations-fallback", JSON.stringify(updates));
}

function readTaskFallback() {
  if (typeof window === "undefined") return [] as WorkflowTask[];
  try { return JSON.parse(localStorage.getItem("claimguard-tasks") || "[]") as WorkflowTask[]; } catch { return []; }
}

function writeTaskFallback(tasks: WorkflowTask[]) {
  if (typeof window !== "undefined") localStorage.setItem("claimguard-tasks", JSON.stringify(tasks));
}

function readAuditFallback() {
  if (typeof window === "undefined") return [] as AuditEvent[];
  try { return JSON.parse(localStorage.getItem("claimguard-audit") || "[]") as AuditEvent[]; } catch { return []; }
}

function writeAuditFallback(events: AuditEvent[]) {
  if (typeof window !== "undefined") localStorage.setItem("claimguard-audit", JSON.stringify(events));
}

async function recordAudit(action: string, detail: string) {
  const event = { id: crypto.randomUUID(), action, detail, createdAt: new Date().toISOString() };
  const supabase = getSupabaseBrowser();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("audit_events").insert({ user_id: user.id, action, detail });
      if (!error) return;
    }
  }
  writeAuditFallback([event, ...readAuditFallback()].slice(0, 100));
}

async function createWorkflowTask(input: Omit<WorkflowTask, "id" | "status"> & { status?: TaskStatus }) {
  const task: WorkflowTask = { ...input, id: crypto.randomUUID(), status: input.status || "Needs Review" };
  const supabase = getSupabaseBrowser();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from("tasks").insert({
        user_id: user.id,
        product_name: task.product,
        claim_issue: task.claimIssue,
        risk_level: task.riskLevel,
        source: task.source,
        due_date: task.dueDate,
        status: statusToDb(task.status),
      }).select().single();
      if (!error && data) {
        await recordAudit("Task created", `${task.product}: ${task.claimIssue}`);
        return { ...task, id: data.id };
      }
    }
  }
  writeTaskFallback([task, ...readTaskFallback()]);
  await recordAudit("Task created", `${task.product}: ${task.claimIssue}`);
  return task;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

function Notice({ text }: { text: string }) {
  return <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">{text}</div>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-link flex items-center gap-2.5 font-extrabold text-ink">
      <span className="brand-mark grid h-8 w-8 place-items-center rounded-[10px] border border-transparent bg-ink text-[#43dfc6]"><ShieldCheck size={16} /></span>
      {!compact && <span className="text-base tracking-[-.035em]">ClaimGuard</span>}
    </Link>
  );
}

function AppShell({ children, title, subtitle, action }: { children: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    if (useDevelopmentFallback) localStorage.removeItem("claimguard-dev-user");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-stone">
      <aside className="app-sidebar fixed inset-y-0 left-0 z-30 hidden w-56 flex-col overflow-y-auto border-r lg:flex">
        <div className="border-b border-white/[.07] px-6 py-6">
        <Logo />
        </div>
        <div className="px-6 pt-6 text-[10px] font-bold uppercase tracking-[.18em] text-white/30">Workspace</div>
        <nav className="flex-1 space-y-1 px-3 py-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                path === href || (href === "/products" && (path === "/products/new" || path === "/products/add")) || (href === "/claims" && path === "/saved-claims")
                  ? "nav-link-active"
                  : ""
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className="sidebar-action mx-5 mb-6 mt-auto flex items-center gap-3 border-t px-1 pt-5 text-sm font-semibold">
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-black/[.06] bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-ink"><Menu /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-[82%] max-w-xs bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)}><X /></button>
            </div>
            <nav className="mt-8 space-y-1">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link key={href} onClick={() => setOpen(false)} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${path === href ? "bg-ink text-white" : "text-muted"}`}>
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
      <main className="app-main pb-20 lg:pl-56 lg:pb-0">
        <div className="mx-auto max-w-[1320px] px-4 py-7 sm:px-8 lg:px-10 lg:py-9">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-black/[.06] pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#14a995]">ClaimGuard workspace</p>
              <h1 className="text-2xl font-extrabold tracking-[-.04em] text-ink sm:text-[1.85rem]">{title}</h1>
              {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p>}
            </div>
            {action}
          </div>
          {children}
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-black/[.06] bg-white lg:hidden">
        {nav.filter((item) => ["/dashboard", "/products", "/claim-checker", "/regulations", "/tasks"].includes(item.href)).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${path === href ? "text-ink" : "text-slate-400"}`}>
            <Icon size={18} />
            {label === "Claim Checker" ? "Check" : label === "Regulations" ? "Updates" : label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function WizardHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-7">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function Empty({ icon: Icon, title, text, action, actionText }: { icon: typeof FileText; title: string; text: string; action?: string; actionText?: string }) {
  return (
    <div className="grid min-h-[360px] place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-black/[.04] text-slate-400"><Icon size={20} /></span>
        <h2 className="mt-5 text-lg font-bold">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{text}</p>
        {action && <Link href={action} className="primary mt-5">{actionText}<ArrowRight size={16} /></Link>}
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone, note }: { label: string; value: string; icon: typeof Package; tone: string; note: string }) {
  return (
    <div className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-[1.4rem] font-extrabold tracking-[-.03em]">{value}</p>
        </div>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}><Icon size={15} /></span>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">{note}</p>
    </div>
  );
}

function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setProducts(useDevelopmentFallback ? readFallback("claimguard-products", demoProducts) : []);
      setError(useDevelopmentFallback ? "Supabase is not configured. Using development localStorage." : "Supabase is not configured.");
      setLoading(false);
      return;
    }
    const { data, error: dbError } = await supabase
      .from("products")
      .select("*, claims(risk_level, created_at)")
      .order("created_at", { ascending: false });
    if (dbError) {
      setError(dbError.message);
      setProducts([]);
    } else {
      setProducts((data || []).map(rowToProduct));
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return { products, loading, error, reload: load };
}

function useClaims() {
  const [claims, setClaims] = useState<ClaimAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      const developmentClaims = useDevelopmentFallback ? readFallback("claimguard-claims", demoClaims) : [];
      setClaims([...readClaimFallback(), ...developmentClaims.filter((claim) => !readClaimFallback().some((local) => local.id === claim.id))]);
      setError(useDevelopmentFallback ? "Supabase is not configured. Using development localStorage." : "Supabase is not configured.");
      setLoading(false);
      return;
    }
    const { data, error: dbError } = await supabase
      .from("claims")
      .select("*, products(name)")
      .order("created_at", { ascending: false });
    if (dbError) {
      setError(dbError.message);
      setClaims([]);
    } else {
      const localClaims = readClaimFallback();
      const databaseClaims: ClaimAnalysis[] = (data || []).map(rowToAnalysis);
      setClaims([...localClaims, ...databaseClaims.filter((claim) => !localClaims.some((local) => local.id === claim.id))]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return { claims, setClaims, loading, error, reload: load };
}

function useTasks() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const local = readTaskFallback();
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setTasks(local);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (error) setTasks(local);
    else {
      const databaseTasks: WorkflowTask[] = (data || []).map((row: any) => ({
        id: row.id,
        product: row.product_name,
        claimIssue: row.claim_issue,
        riskLevel: row.risk_level,
        source: row.source,
        dueDate: row.due_date || "",
        status: row.status === "fixing" ? "Fixing" : row.status === "fixed" ? "Fixed" : row.status === "approved" ? "Approved" : row.status === "expert_review_needed" ? "Expert Review Needed" : "Needs Review",
      }));
      setTasks([...local, ...databaseTasks.filter((task) => !local.some((item) => item.id === task.id))]);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);
  return { tasks, setTasks, loading, reload: load };
}

function useAudit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  useEffect(() => {
    const load = async () => {
      const local = readAuditFallback();
      const supabase = getSupabaseBrowser();
      if (!supabase) return setEvents(local);
      const { data } = await supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(30);
      const databaseEvents: AuditEvent[] = (data || []).map((row: any) => ({ id: row.id, action: row.action, detail: row.detail, createdAt: row.created_at }));
      setEvents([...local, ...databaseEvents.filter((event) => !local.some((item) => item.id === event.id))]);
    };
    void load();
  }, []);
  return events;
}

function Dashboard() {
  const { usage } = useUsage();
  const router = useRouter();
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { claims, loading: claimsLoading, error: claimsError } = useClaims();
  const { profile, loading: profileLoading, isComplete, enabled: onboardingEnabled } = useBrandProfile();
  const loading = productsLoading || claimsLoading;
  const counts = useMemo(() => ({
    products: products.length,
    high: claims.filter((claim) => claim.riskLevel === "high").length,
    medium: claims.filter((claim) => claim.riskLevel === "medium").length,
    low: claims.filter((claim) => claim.riskLevel === "low").length,
  }), [claims, products]);

  useEffect(() => {
    if (!onboardingEnabled || profileLoading) return;
    if (!isComplete) router.replace("/onboarding");
  }, [onboardingEnabled, profileLoading, isComplete, router]);

  const personalizedHeader = onboardingEnabled && isComplete && profile
    ? PersonalizedDashboardHeader({ profile })
    : null;

  return (
    <AppShell
      title={personalizedHeader?.title || "Compliance snapshot"}
      subtitle={personalizedHeader?.subtitle || "Here is what needs your attention today."}
      action={<Link href="/claim-checker" className="primary"><Sparkles size={17} /> Check a claim</Link>}
    >
      <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <UsageMeter usage={usage} />
        <WeeklyDigestPanel />
      </div>
      {onboardingEnabled && isComplete && profile && <PersonalizedDashboardSections profile={profile} />}
      {(productsError || claimsError) && <Notice text={productsError || claimsError} />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="Products monitored" value={loading ? "..." : String(counts.products)} icon={Package} tone="bg-blue-50 text-blue-500" note="In your workspace" />
        <Metric label="High-risk claims" value={loading ? "..." : String(counts.high)} icon={AlertTriangle} tone="bg-red-50 text-red-500" note="Review recommended" />
        <Metric label="Medium-risk claims" value={loading ? "..." : String(counts.medium)} icon={TrendingUp} tone="bg-amber-50 text-amber-500" note="Needs careful wording" />
        <Metric label="Safe claims" value={loading ? "..." : String(counts.low)} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-500" note="Best current fit" />
        <Metric label="Regulation updates" value="5" icon={Landmark} tone="bg-purple-50 text-purple-500" note="Official sources" />
        <Metric label="Tasks due" value={String(claims.filter((claim) => claim.status !== "Approved").length)} icon={ListChecks} tone="bg-orange-50 text-orange-500" note="Open workflow" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_.8fr]">
        <section className="surface p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Recent activity</h2>
              <p className="mt-1 text-xs text-muted">Your latest analyzed claims</p>
            </div>
            <Link href="/claims" className="text-sm font-semibold text-lavender">View all</Link>
          </div>
          {claims.length ? (
            <div className="divide-y divide-slate-100">
              {claims.slice(0, 4).map((claim) => (
                <div key={claim.id} className="flex items-center gap-3 py-4">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${levelStyles[claim.riskLevel]}`}><ClipboardCheck size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{claim.product}</p>
                    <p className="truncate text-xs text-muted">{claim.originalClaim}</p>
                  </div>
                  <span className="hidden text-xs text-muted sm:block">{claim.date}</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{loading ? "Loading activity..." : "No saved analyses yet."}</p>
          )}
        </section>
        <section className="surface p-5 sm:p-6">
          <h2 className="font-bold">Risk summary</h2>
          <p className="mt-1 text-xs text-muted">All checked claims</p>
          <div className="my-7 flex items-center justify-center">
            <div className="relative grid h-36 w-36 place-items-center rounded-full" style={{ background: "conic-gradient(#42a678 0 60%, #e8a24d 60% 82%, #d9667a 82%)" }}>
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                <div>
                  <strong className="text-2xl">{loading ? "..." : claims.length}</strong>
                  <p className="text-[11px] text-muted">total checks</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[["Safe", counts.low, "bg-safe"], ["Medium risk", counts.medium, "bg-medium"], ["High risk", counts.high, "bg-high"]].map(([label, value, color]) => (
              <div className="flex items-center text-sm" key={String(label)}>
                <span className={`mr-2 h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="text-muted">{label}</span>
                <strong className="ml-auto">{loading ? "..." : value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:flex sm:items-center sm:gap-5">
        <span className="mb-4 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 sm:mb-0"><Lightbulb size={18} /></span>
        <div>
          <p className="font-bold">Quick tip: be specific, not absolute</p>
          <p className="mt-1 text-sm leading-6 text-muted">"Supports immune system health" is usually safer than "prevents illness." ClaimGuard helps you spot that difference before publishing.</p>
        </div>
        <Link href="/claim-checker" className="secondary mt-4 shrink-0 border-0 sm:ml-auto sm:mt-0">Try it now <ArrowRight size={16} /></Link>
      </div>
    </AppShell>
  );
}

function Products() {
  const { products, loading, error } = useProducts();
  const { claims } = useClaims();
  const { tasks } = useTasks();
  const regulations = useRegulationFeed();
  const impacts = useMemo(() => matchRegulationImpacts(products, claims, regulations), [products, claims, regulations]);
  const [query, setQuery] = useState("");
  const visible = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell title="Products" subtitle="Keep product details and claim history in one organized place." action={<Link href="/products/new" className="primary"><Plus size={17} /> Add product</Link>}>
      {error && <Notice text={error} />}
      <div className="surface mb-5 flex items-center gap-3 px-4 py-3">
        <Search size={18} className="text-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search products..." />
        <span className="text-xs text-muted">{loading ? "Loading..." : `${visible.length} products`}</span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((product) => (
          <Link href={`/claim-checker?product=${product.id}`} key={product.id} className="surface group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            {(() => {
              const unresolvedTasks = tasks.filter((task) => task.product === product.name && !["Fixed", "Approved"].includes(task.status)).length;
              const regulationMatches = impacts.filter((impact) => impact.product === product.name).length;
              const risk = calculateProductRisk(product, claims, unresolvedTasks, regulationMatches);
              return (
                <div className="mb-4 rounded-2xl bg-stone p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Product risk score</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <strong className="text-lg leading-6">{product.name} — {risk.score}/100</strong>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${risk.score >= 70 ? "bg-rose text-high" : risk.score >= 40 ? "bg-apricot text-medium" : "bg-mint text-safe"}`}>{risk.level}</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted">{risk.factors.high} high · {risk.factors.medium} medium · {risk.factors.unresolvedTasks} unresolved tasks · {risk.factors.regulationMatches} regulation matches</p>
                </div>
              );
            })()}
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${product.risk === "High risk" ? "bg-red-50 text-red-500" : product.risk === "Medium risk" ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"}`}><Package size={18} /></span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[product.risk]}`}>{product.risk}</span>
            </div>
            <h2 className="mt-5 font-bold">{product.name}</h2>
            <p className="mt-1 text-sm text-muted">{product.category}</p>
            <div className="my-5 h-px bg-slate-100" />
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-muted">Market</span>
              <span className="text-right font-medium">United States</span>
              <span className="text-muted">Ingredients</span>
              <span className="text-right font-medium">{product.ingredients.length}</span>
              <span className="text-muted">Claims checked</span>
              <span className="text-right font-medium">{product.checks}</span>
              <span className="text-muted">Last scanned</span>
              <span className="text-right font-medium">{product.lastScanned}</span>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

const steps = ["Basics", "Ingredients", "Claims", "Review"];

function AddProduct() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ingredient, setIngredient] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "Dietary Supplement",
    market: "United States",
    platforms: [] as string[],
    ingredients: [] as string[],
    claims: "",
  });
  const platforms = ["Website", "Amazon", "Retail", "Social media", "Other"];

  const patch = (value: Partial<typeof form>) => setForm({ ...form, ...value });

  const addIngredient = () => {
    const value = ingredient.trim();
    if (value && !form.ingredients.includes(value)) {
      patch({ ingredients: [...form.ingredients, value] });
      setIngredient("");
    }
  };

  const submit = async () => {
    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      if (useDevelopmentFallback) {
        const products = readFallback("claimguard-products", demoProducts);
        const item: Product = { id: crypto.randomUUID(), name: form.name.trim(), category: form.category, market: form.market, platforms: form.platforms, ingredients: form.ingredients, claims: form.claims, checks: 0, risk: "Safe", lastScanned: "Not scanned" };
        writeFallback("claimguard-products", [item, ...products]);
        router.push("/products");
        return;
      }
      setError("Supabase environment variables are required to add products.");
      setSaving(false);
      return;
    }
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        category: form.category,
        market: form.market,
        platforms: form.platforms,
        ingredients: form.ingredients,
        claims: form.claims,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Unable to add product.");
      setSaving(false);
      return;
    }
    router.push("/products");
    router.refresh();
  };

  return (
    <AppShell title="Add a product" subtitle="A few details help ClaimGuard make checks more relevant.">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex items-center justify-between">
          {steps.map((stepLabel, index) => (
            <div key={stepLabel} className="flex flex-1 items-center last:flex-none">
              <button onClick={() => index < step && setStep(index)} className="flex items-center gap-2">
                <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${index <= step ? "border-ink bg-ink text-white" : "border-black/[.08] bg-white text-muted"}`}>
                  {index < step ? <Check size={15} /> : index + 1}
                </span>
                <span className={`hidden text-xs font-semibold sm:block ${index <= step ? "text-ink" : "text-muted"}`}>{stepLabel}</span>
              </button>
              {index < 3 && <div className={`mx-2 h-px flex-1 sm:mx-4 ${index < step ? "bg-ink" : "bg-black/[.08]"}`} />}
            </div>
          ))}
        </div>
        <div className="surface p-5 sm:p-8">
          {step === 0 && (
            <div>
              <WizardHeading title="Tell us about your product" text="Start with the basics so we can keep checks organized." />
              <div className="space-y-5">
                <Field label="Product name"><input className="input" value={form.name} onChange={(event) => patch({ name: event.target.value })} placeholder="e.g. Daily Glow Collagen" /></Field>
                <Field label="Product category">
                  <select className="input" value={form.category} onChange={(event) => patch({ category: event.target.value })}>
                    {PRODUCT_CATEGORIES.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Market">
                  <select className="input" value={form.market} onChange={(event) => patch({ market: event.target.value })}>
                    {MARKET_OPTIONS.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Platforms">
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => patch({ platforms: form.platforms.includes(platform) ? form.platforms.filter((item) => item !== platform) : [...form.platforms, platform] })}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${form.platforms.includes(platform) ? "border-ink bg-ink text-white" : "border-black/[.08] bg-stone text-muted hover:border-black/20"}`}
                      >
                        {form.platforms.includes(platform) && <Check size={14} className="mr-1 inline" />}
                        {platform}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <WizardHeading title="Add your ingredients" text="Enter one ingredient at a time. Press Enter or use the add button." />
              <Field label="Ingredients">
                <div className="flex gap-2">
                  <input className="input" value={ingredient} onChange={(event) => setIngredient(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addIngredient(); } }} placeholder="e.g. Vitamin C" />
                  <button onClick={addIngredient} className="primary"><Plus size={16} /><span className="hidden sm:inline">Add</span></button>
                </div>
              </Field>
              <div className="mt-4 flex min-h-40 flex-wrap content-start gap-2 rounded-2xl bg-stone p-4">
                {form.ingredients.length ? form.ingredients.map((value) => (
                  <span key={value} className="flex h-fit items-center gap-2 rounded-full border border-black/[.06] bg-white px-3 py-2 text-sm font-medium">
                    {value}
                    <button onClick={() => patch({ ingredients: form.ingredients.filter((item) => item !== value) })}><X size={14} className="text-muted" /></button>
                  </span>
                )) : <p className="text-sm text-muted">Your ingredient tags will appear here.</p>}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <WizardHeading title="Add product claims" text="Paste label, website, Amazon, ad, or influencer copy. You can check individual claims later." />
              <Field label="Claims and marketing copy"><textarea className="input min-h-64 resize-none leading-6" value={form.claims} onChange={(event) => patch({ claims: event.target.value })} placeholder="Paste your product copy here..." /></Field>
              <p className="mt-2 text-right text-xs text-muted">{form.claims.length} characters</p>
            </div>
          )}
          {step === 3 && (
            <div>
              <WizardHeading title="Review product details" text="Make sure everything looks right before adding this product." />
              <div className="divide-y divide-black/[.06] rounded-2xl border border-black/[.06] bg-stone px-5">
                {[["Product name", form.name || "Not provided"], ["Category", form.category], ["Market", form.market], ["Platforms", form.platforms.join(", ") || "None selected"], ["Ingredients", `${form.ingredients.length} added`]].map(([label, value]) => (
                  <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr]" key={String(label)}>
                    <span className="text-sm text-muted">{label}</span>
                    <span className="text-sm font-semibold">{value}</span>
                  </div>
                ))}
                <div className="py-4">
                  <p className="mb-2 text-sm text-muted">Claims</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{form.claims || "No claim copy added."}</p>
                </div>
              </div>
            </div>
          )}
          {error && <Notice text={error} />}
          <div className="mt-8 flex justify-between border-t border-black/[.06] pt-5">
            <button disabled={step === 0 || saving} onClick={() => setStep(step - 1)} className="secondary disabled:opacity-0">Back</button>
            {step < 3 ? (
              <button disabled={step === 0 && !form.name.trim()} onClick={() => setStep(step + 1)} className="primary">Continue <ArrowRight size={16} /></button>
            ) : (
              <button disabled={saving} onClick={submit} className="primary"><Check size={16} /> {saving ? "Adding..." : "Add product"}</button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

type CopilotPayload = {
  claimText: string;
  productCategory: string;
  ingredients: string[];
  market: string;
  contextType: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskyPhrases: string[];
  explanation: string;
  saferRewrite: string;
  sources: { title: string; url: string; organization?: string; category?: string }[];
};

function AnalysisResult({ result, copied, onCopy, onStatus, onTask, copilotPayload }: { result: ClaimAnalysis; copied: boolean; onCopy: () => void; onStatus: (status: ClaimStatus) => void; onTask?: () => void; copilotPayload?: CopilotPayload }) {
  return (
    <div className="mt-6 border-t border-black/[.06] pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${levelStyles[result.riskLevel]}`}>{result.riskLevel} risk</span>
        <strong className="text-sm">Risk score: {result.riskScore}/100</strong>
        <span className="text-xs text-muted">{result.storage === "local" ? "Saved locally as a fallback" : "Saved to your workspace"}</span>
      </div>
      <div className="mt-5 grid gap-4">
        <ResultSection title="Original claim"><p className="text-sm leading-6">{result.originalClaim}</p></ResultSection>
        <ResultSection title="Risky phrases">
          {result.riskyPhrases.length ? (
            <div className="flex flex-wrap gap-2">
              {result.riskyPhrases.map((phrase) => <span key={phrase} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${levelStyles[result.riskLevel]}`}>{phrase}</span>)}
            </div>
          ) : <p className="text-sm text-muted">No configured risky phrases found.</p>}
        </ResultSection>
        <ResultSection title="Why it was flagged"><p className="text-sm leading-6 text-muted">{result.explanation}</p></ResultSection>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Safer rewrite</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">{result.saferRewrite}</p>
            </div>
            <button onClick={onCopy} className="secondary shrink-0 border-0 bg-white !p-2.5" title="Copy safer rewrite">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
        <ResultSection title="Pre-publish checklist">
          <div className="space-y-3">
            {result.checklist.map((item) => (
              <p className="flex gap-3 text-sm leading-6 text-muted" key={item}><CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-500" />{item}</p>
            ))}
          </div>
        </ResultSection>
        <ResultSection title="Sources">
          <div className="space-y-2">
            {result.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-lavender hover:underline">
                {source.title}
                <ExternalLink size={14} />
              </a>
            ))}
          </div>
        </ResultSection>
        {copilotPayload && <ComplianceCopilotPanel payload={copilotPayload} />}
        <p className="rounded-xl bg-stone p-4 text-xs leading-5 text-muted">{result.disclaimer}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={onCopy} className="secondary"><Copy size={16} />{copied ? "Copied" : "Copy"}</button>
          <button onClick={() => onStatus("Needs Review")} className="secondary"><Plus size={16} />Needs Review</button>
          <button onClick={() => onStatus("Fixed")} className="secondary"><Check size={16} />Mark Fixed</button>
          <button onClick={() => onStatus("Approved")} className="primary"><ShieldCheck size={16} />Approve</button>
          <button onClick={() => onStatus("Expert Review Needed")} className="secondary"><UserRound size={16} />Expert Review Needed</button>
          {onTask && result.riskLevel !== "low" && <button onClick={onTask} className="secondary"><ListChecks size={16} />Create task</button>}
        </div>
      </div>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/[.05] bg-stone p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{title}</p>
      {children}
    </div>
  );
}

function SourceEvidencePanel({ source, whyItMatters, lastChecked }: { source: { title: string; url: string; organization?: string; category?: string }; whyItMatters: string; lastChecked?: string }) {
  return (
    <details className="rounded-xl border border-black/[.06] bg-stone">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600"><Landmark size={14} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{source.title}</p>
          <p className="text-xs text-muted">{source.organization || "Official source"}{source.category ? ` · ${source.category}` : ""}</p>
        </div>
        <ChevronDown size={16} className="text-muted" />
      </summary>
      <div className="border-t border-black/[.06] p-4">
        <p className="text-sm leading-6 text-muted">{whyItMatters}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={source.url} target="_blank" rel="noreferrer" className="secondary !py-2"><ExternalLink size={15} />Official link</a>
          <span className="text-xs text-muted">Last checked {lastChecked || "today"}</span>
        </div>
      </div>
    </details>
  );
}

function ClaimChecker() {
  const searchParams = useSearchParams();
  const { products } = useProducts();
  const { profile } = useBrandProfile();
  const { usage, refresh: refreshUsage } = useUsage();
  const [product, setProduct] = useState("");
  const [context, setContext] = useState("Website");
  const [claim, setClaim] = useState("");
  const [result, setResult] = useState<ClaimAnalysis | null>(null);
  const [copilotPayload, setCopilotPayload] = useState<CopilotPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const productId = searchParams.get("product");
    if (productId) setProduct(productId);
  }, [searchParams]);

  const buildAnalysisInput = () => {
    const selected = products.find((item) => item.id === product);
    const brandCategory = sectorToProductCategory(profile?.sector || "");
    const brandMarket = profile?.salesRegions[0] ? regionToMarket(profile.salesRegions[0]) : "United States FDA + FTC";
    const brandIngredients = profile?.ingredients
      ? profile.ingredients.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean)
      : [];
    return {
      claimText: claim.trim(),
      contextType: context,
      productCategory: selected?.category || brandCategory,
      ingredients: selected?.ingredients || brandIngredients,
      market: selected?.market || brandMarket,
    };
  };

  const analysisFromRules = (input: ReturnType<typeof buildAnalysisInput>, savedRemotely = false): ClaimAnalysis => {
    const rulesResult = analyzeClaim(input);
    const selected = products.find((item) => item.id === product);
    return {
      id: crypto.randomUUID(),
      originalClaim: input.claimText,
      context: input.contextType,
      product: selected?.name || profile?.brandName || "Unassigned",
      date: formatDate(new Date().toISOString()),
      riskLevel: rulesResult.riskLevel,
      riskScore: rulesResult.riskScore,
      riskyPhrases: rulesResult.riskyPhrases,
      explanation: rulesResult.explanation,
      saferRewrite: rulesResult.saferRewrite,
      checklist: rulesResult.checklist,
      sources: rulesResult.sourceReferences.map((source) => ({ title: source.title, url: source.url })),
      disclaimer: rulesResult.disclaimer,
      status: rulesResult.riskLevel === "high" ? "Expert Review Needed" : "Needs Review",
      storage: savedRemotely ? "workspace" : "local",
    };
  };

  const persistLocalAnalysis = (analysis: ClaimAnalysis, warning?: string) => {
    writeClaimFallback([analysis, ...readClaimFallback().filter((item) => item.id !== analysis.id)]);
    if (useDevelopmentFallback) {
      const claims = readFallback("claimguard-claims", demoClaims);
      writeFallback("claimguard-claims", [analysis, ...claims.filter((item) => item.id !== analysis.id)]);
    }
    if (warning) setError(warning);
  };

  const analyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setCopilotPayload(null);
    const input = buildAnalysisInput();
    try {
      let analysis: ClaimAnalysis | null = null;
      let usedClientFallback = false;

      if (isSupabaseConfigured()) {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimText: input.claimText,
            contextType: input.contextType,
            productId: product || null,
            productCategory: input.productCategory,
            ingredients: input.ingredients,
            market: input.market,
          }),
        });
        const body = await response.json();
        if (response.ok) {
          analysis = {
            ...rowToAnalysis(body.analysis),
            product: products.find((item) => item.id === product)?.name || profile?.brandName || "Unassigned",
            storage: body.saved === false ? "local" as const : "workspace" as const,
          };
          if (body.saved === false) persistLocalAnalysis(analysis, body.warning || "Analysis completed and was saved locally.");
        } else if (response.status === 401 && useDevelopmentFallback) {
          usedClientFallback = true;
        } else if (response.status === 402) {
          throw new Error(`${body.error} Upgrade at Settings → Subscription.`);
        } else {
          throw new Error(body.error || "Analysis failed.");
        }
      }

      if (!analysis) {
        analysis = analysisFromRules(input, false);
        usedClientFallback = true;
        persistLocalAnalysis(analysis, isSupabaseConfigured() ? "Analysis ran locally because the workspace session was unavailable." : "Analysis completed using the local rules engine.");
      }

      setResult(analysis);
      setCopilotPayload({
        claimText: input.claimText,
        productCategory: input.productCategory,
        ingredients: input.ingredients,
        market: input.market,
        contextType: input.contextType,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        riskyPhrases: analysis.riskyPhrases,
        explanation: analysis.explanation,
        saferRewrite: analysis.saferRewrite,
        sources: analysis.sources,
      });
      await recordAudit("Claim checked", `${analysis.product}: ${analysis.riskLevel} risk (${analysis.riskScore}/100)${usedClientFallback ? " [local]" : ""}`);
      void refreshUsage();
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Analysis failed.");
    } finally {
      setLoading(false);
      setCopied(false);
    }
  };

  const applyExample = (example: ClaimExample) => {
    setClaim(example.claim);
    setContext(example.context || "Website");
    setResult(null);
    setCopilotPayload(null);
  };

  const updateStatus = async (status: ClaimStatus) => {
    if (!result) return;
    await recordAudit(status === "Fixing" ? "Claim edit started" : status === "Approved" ? "Claim approved" : "Claim status changed", `${result.product}: ${status}`);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      if (useDevelopmentFallback) {
        const claims = readFallback("claimguard-claims", demoClaims).map((claim) => claim.id === result.id ? { ...claim, status } : claim);
        writeFallback("claimguard-claims", claims);
        setResult({ ...result, status });
      }
      writeClaimFallback(readClaimFallback().map((claim) => claim.id === result.id ? { ...claim, status } : claim));
      return;
    }
    const { error: dbError } = await supabase
      .from("claims")
      .update({ status: statusToDb(status), updated_at: new Date().toISOString() })
      .eq("id", result.id);
    if (dbError) {
      const nextResult = { ...result, status };
      writeClaimFallback([nextResult, ...readClaimFallback().filter((claim) => claim.id !== result.id)]);
      setResult(nextResult);
      setError("Supabase could not update the status. The change was saved locally.");
      return;
    }
    setResult({ ...result, status });
  };

  const copyRewrite = async () => {
    if (!result) return;
    setCopied(await copyText(result.saferRewrite));
    setTimeout(() => setCopied(false), 1800);
  };

  const createTask = async () => {
    if (!result) return;
    await createWorkflowTask({
      product: result.product,
      claimIssue: result.originalClaim,
      riskLevel: result.riskLevel,
      source: result.context,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: result.riskLevel === "high" ? "Expert Review Needed" : "Needs Review",
    });
    setError("Task created and added to the workflow board.");
  };

  return (
    <AppShell title="Claim checker" subtitle="Analyze a claim for FDA and FTC risk flags before publishing. Validated across 1000 product scenarios.">
      <div className="mb-5 space-y-4">
        <RegressionCoverageBadge />
        <UsageMeter usage={usage} />
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <section className="surface p-5 sm:p-7">
          {error && <Notice text={error} />}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Product">
              <select className="input" value={product} onChange={(event) => setProduct(event.target.value)}>
                <option value="">Choose a product</option>
                {products.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Where will this appear?">
              <select className="input" value={context} onChange={(event) => setContext(event.target.value)}>
                {["Label", "Website", "Amazon listing", "Ad copy", "Social media", "Influencer script"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-5">
            <Field label="Claim text">
              <textarea className="input min-h-52 resize-none leading-6" maxLength={5000} value={claim} onChange={(event) => { setClaim(event.target.value); setResult(null); }} placeholder="Paste one claim you want to check..." />
            </Field>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted">{claim.length}/5000 characters</p>
              <button disabled={!claim.trim() || loading} onClick={() => void analyze()} className="primary">
                {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {loading ? "Analyzing..." : "Analyze claim"}
              </button>
            </div>
            <ClaimExamplePicker sector={profile?.sector || "Other"} onSelect={applyExample} />
          </div>
        </section>
        <aside className="space-y-5">
          {result ? (
            <div className="surface overflow-hidden p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Analysis provider: production rules engine</p>
              {needsSupplementDisclaimer(products.find((item) => item.id === product)?.category || "", claim) && (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                  <strong>Label disclaimer checker:</strong> This claim may need a supplement disclaimer before publishing.
                </div>
              )}
              <AnalysisResult result={result} copied={copied} onCopy={copyRewrite} onStatus={updateStatus} onTask={createTask} copilotPayload={copilotPayload || undefined} />
            </div>
          ) : (
          <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed border-black/10 bg-stone p-10 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-black/[.04] text-slate-400"><Sparkles size={20} /></span>
              <p className="mt-4 text-sm text-slate-400">{loading ? "Analyzing claim..." : "Analysis results will appear here."}</p>
              <p className="mt-1 text-xs text-slate-300">Paste a claim and click Analyze claim.</p>
            </div>
          </div>
          )}
          {!result && <RiskPatternTips />}
          <div className="rounded-2xl bg-ink p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Resilient analysis</p>
            <p className="mt-3 text-sm leading-6 text-white/80">ClaimGuard uses an inspectable rules engine with product category, ingredients, market, and publishing context. Plan limits are enforced server-side.</p>
            <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-white/60">{fallbackDisclaimer}</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function SavedClaims() {
  const { claims, setClaims, loading, error } = useClaims();
  const [copyId, setCopyId] = useState("");

  const update = async (id: string, status: ClaimStatus) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      if (useDevelopmentFallback) {
        const next = claims.map((claim) => claim.id === id ? { ...claim, status } : claim);
        setClaims(next);
        writeFallback("claimguard-claims", next);
        writeClaimFallback(readClaimFallback().map((claim) => claim.id === id ? { ...claim, status } : claim));
      }
      return;
    }
    const { error: dbError } = await supabase.from("claims").update({ status: statusToDb(status), updated_at: new Date().toISOString() }).eq("id", id);
    const next = claims.map((claim) => claim.id === id ? { ...claim, status } : claim);
    if (!dbError) setClaims(next);
    else {
      setClaims(next);
      writeClaimFallback(next.filter((claim) => readClaimFallback().some((local) => local.id === claim.id) || claim.id === id));
    }
  };

  const remove = async (id: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      if (useDevelopmentFallback) {
        const next = claims.filter((claim) => claim.id !== id);
        setClaims(next);
        writeFallback("claimguard-claims", next);
        writeClaimFallback(readClaimFallback().filter((claim) => claim.id !== id));
      }
      return;
    }
    const { error: dbError } = await supabase.from("claims").delete().eq("id", id);
    const next = claims.filter((claim) => claim.id !== id);
    if (!dbError) setClaims(next);
    else {
      setClaims(next);
      writeClaimFallback(readClaimFallback().filter((claim) => claim.id !== id));
    }
  };

  const copy = async (id: string, text: string) => {
    const copied = await copyText(text);
    if (copied) {
      setCopyId(id);
      setTimeout(() => setCopyId(""), 1800);
    }
  };

  return (
    <AppShell title="Saved claims" subtitle="Revisit analyzed claims, safer wording, and approval status from one place.">
      {error && <Notice text={error} />}
      <div className="space-y-5">
        {loading ? (
          <div className="surface p-8 text-sm text-muted">Loading saved claims...</div>
        ) : claims.length ? (
          claims.map((claim) => (
            <article key={claim.id} className="surface p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${levelStyles[claim.riskLevel]}`}>{claim.riskLevel} risk · {claim.riskScore}</span>
                    <span className="rounded-full border border-black/[.06] bg-stone px-3 py-1 text-xs font-semibold text-ink">{claim.status}</span>
                  </div>
                  <h2 className="mt-4 text-sm font-bold leading-6">{claim.originalClaim}</h2>
                  <p className="mt-1 text-xs text-muted">{claim.product} · {claim.context} · {claim.date}</p>
                </div>
                <button onClick={() => remove(claim.id)} className="self-start rounded-lg p-2 text-muted hover:bg-rose hover:text-high"><Trash2 size={17} /></button>
              </div>
              {claim.riskyPhrases.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {claim.riskyPhrases.map((phrase) => <span key={phrase} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelStyles[claim.riskLevel]}`}>{phrase}</span>)}
                </div>
              )}
              <div className="mt-5 rounded-2xl bg-mint p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-safe">Safer rewrite</p>
                <p className="mt-2 text-sm leading-6 text-safe">{claim.saferRewrite}</p>
              </div>
              <p className="mt-4 rounded-xl bg-stone p-4 text-xs leading-5 text-muted">{claim.disclaimer}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => void copy(claim.id, claim.saferRewrite)} className="secondary !py-2"><Copy size={15} />{copyId === claim.id ? "Copied" : "Copy"}</button>
                <button onClick={() => void update(claim.id, "Fixed")} className="secondary !py-2"><Check size={15} />Mark Fixed</button>
                <button onClick={() => void update(claim.id, "Approved")} className="primary !py-2"><ShieldCheck size={15} />Approve</button>
                <button onClick={() => void update(claim.id, "Needs Review")} className="secondary !py-2"><Plus size={15} />Needs Review</button>
                <button onClick={() => void update(claim.id, "Expert Review Needed")} className="secondary !py-2"><UserRound size={15} />Expert Review Needed</button>
              </div>
            </article>
          ))
        ) : (
          <div className="surface">
            <Empty icon={ClipboardCheck} title="No saved claims yet" text="Run a claim check and the result will be saved automatically." action="/claim-checker" actionText="Check a claim" />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Regulations() {
  const { products } = useProducts();
  const { claims } = useClaims();
  const [updates, setUpdates] = useState<RegulationUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState("All");
  const [sourceSearch, setSourceSearch] = useState("");
  const filters = ["All", "FDA", "FTC", "EPA", "FSSAI", "TGA", "Health Canada", "Food", "Advertising", "Environmental Claims"];
  const visibleUpdates = updates.filter((update) => {
    const matchesFilter = filter === "All" || update.organization === filter || update.category.toLowerCase().includes(filter.toLowerCase());
    const query = sourceSearch.trim().toLowerCase();
    return matchesFilter && (!query || `${update.organization} ${update.country} ${update.category} ${update.title} ${update.summary}`.toLowerCase().includes(query));
  });

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        const storedDevelopmentUpdates = useDevelopmentFallback ? readFallback<RegulationUpdate[]>("claimguard-regulation-statuses", demoRegulations) : [];
        const storedStatuses = new Map(storedDevelopmentUpdates.map((update) => [update.officialUrl, { status: update.status, notes: update.notes }]));
        const developmentUpdates = useDevelopmentFallback ? demoRegulations.map((update) => ({
          ...update,
          status: storedStatuses.get(update.officialUrl)?.status || update.status,
          notes: storedStatuses.get(update.officialUrl)?.notes || update.notes,
        })) : [];
        const localUpdates = readRegulationFallback();
        setUpdates([...localUpdates, ...developmentUpdates.filter((update) => !localUpdates.some((local) => local.officialUrl === update.officialUrl))]);
        setError(useDevelopmentFallback ? "Supabase is not configured. Using development localStorage." : "Supabase is not configured.");
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: regulationRows, error: regulationsError }, { data: statusRows, error: statusesError }] = await Promise.all([
        supabase.from("regulation_updates").select("*").order("date_found", { ascending: false }),
        supabase.from("user_regulation_status").select("*").eq("user_id", user.id),
      ]);
      if (regulationsError || statusesError) {
        setError(regulationsError?.message || statusesError?.message || "Unable to load regulation updates.");
      } else {
        const statuses = new Map<string, { status: string; notes: string }>((statusRows || []).map((row: any) => [row.regulation_update_id, { status: row.status, notes: row.notes }]));
        setUpdates((regulationRows || []).map((row: any) => ({
          id: row.id,
          organization: row.organization,
          country: row.country,
          category: row.category,
          title: row.title,
          summary: row.summary,
          officialUrl: row.official_url,
          dateFound: formatDate(row.date_found),
          status: statuses.get(row.id)?.status || "unread",
          notes: statuses.get(row.id)?.notes || "",
        })));
      }
      setLoading(false);
    };
    void load();
  }, [reloadKey]);

  const sync = async () => {
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/regulations/sync", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to sync official sources.");
      if (isSupabaseConfigured() && body.persisted) {
        setReloadKey((value) => value + 1);
      } else {
        const currentStatuses = new Map(updates.map((update) => [update.officialUrl, { status: update.status, notes: update.notes }]));
        const synced = body.updates.map((row: any) => ({
          id: row.official_url,
          organization: row.organization,
          country: row.country,
          category: row.category,
          title: row.title,
          summary: row.summary,
          officialUrl: row.official_url,
          dateFound: formatDate(row.date_found),
          status: currentStatuses.get(row.official_url)?.status || "unread",
          notes: currentStatuses.get(row.official_url)?.notes || "",
        }));
        setUpdates(synced);
        writeFallback("claimguard-regulation-statuses", synced);
        writeRegulationFallback(synced);
      }
      setMessage(body.persisted ? "Official sources synced and saved successfully." : "Official sources synced. Seeded or live results are shown locally because server-side Supabase sync is not configured.");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Unable to sync official sources.");
    } finally {
      setSyncing(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const next = updates.map((update) => update.id === id ? { ...update, status } : update);
    setUpdates(next);
    const supabase = getSupabaseBrowser();
    if (!supabase || id.startsWith("http")) {
      writeFallback("claimguard-regulation-statuses", next);
      writeRegulationFallback(next);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: dbError } = await supabase.from("user_regulation_status").upsert(
      { user_id: user.id, regulation_update_id: id, status },
      { onConflict: "user_id,regulation_update_id" },
    );
    if (dbError) {
      writeRegulationFallback(next);
      setError("Supabase could not save this status. The change was saved locally.");
    }
  };

  return (
    <AppShell title="Regulation Library" subtitle={`${REGULATORY_SOURCES.length} curated official sources across ${new Set(REGULATORY_SOURCES.map((source) => source.organization)).size} regulators and ${MARKET_OPTIONS.length} markets.`} action={<button onClick={sync} disabled={syncing} className="primary">{syncing ? <LoaderCircle size={16} className="animate-spin" /> : <Landmark size={16} />}{syncing ? "Syncing..." : "Sync official sources"}</button>}>
      {error && <Notice text={error} />}
      {message && <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Official sources" value={String(REGULATORY_SOURCES.length)} icon={Landmark} tone="bg-blue-50 text-blue-600" note="Curated regulator guidance" />
        <Metric label="Product categories" value={String(PRODUCT_CATEGORIES.length)} icon={Package} tone="bg-emerald-50 text-emerald-600" note="Sector-aware matching" />
        <Metric label="Markets covered" value={String(MARKET_OPTIONS.length)} icon={Globe2} tone="bg-violet-50 text-violet-600" note="Localized source selection" />
      </div>
      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} className="input !pl-11" placeholder="Search regulator, market, sector, or guidance topic..." />
      </label>
      <div className="mb-5 flex flex-wrap gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "primary !py-2" : "secondary !py-2"}>{item}</button>)}</div>
      <div className="space-y-5">
        {loading ? <div className="surface p-8 text-sm text-muted">Loading regulation updates...</div> : visibleUpdates.length ? visibleUpdates.map((update) => (
          <article key={update.id} className="surface p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${update.organization === "FDA" ? "border-blue-100 bg-blue-50 text-blue-700" : update.organization === "FTC" ? "border-orange-100 bg-orange-50 text-orange-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>{update.organization}</span>
                  <span className="rounded-full bg-stone px-3 py-1 text-xs font-semibold text-muted">{update.category}</span>
                  <span className="rounded-full bg-stone px-3 py-1 text-xs font-semibold text-muted">{update.status.replace("_", " ")}</span>
                  <span className="rounded-full bg-apricot px-3 py-1 text-xs font-semibold text-medium">May affect your products</span>
                </div>
                <h2 className="mt-4 font-bold">{displayText(update.title)}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{displayText(update.summary)}</p>
                <p className="mt-3 text-xs text-muted">{update.country} · Found {update.dateFound}</p>
              </div>
              <a href={update.officialUrl} target="_blank" rel="noreferrer" className="secondary shrink-0"><ExternalLink size={16} />Official source</a>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-black/[.06] pt-4">
              <button onClick={() => void updateStatus(update.id, "reviewed")} className="secondary !py-2"><Check size={15} />Reviewed</button>
              <button onClick={() => void updateStatus(update.id, "action_needed")} className="primary !py-2"><Zap size={15} />Action needed</button>
              <button onClick={() => void updateStatus(update.id, "dismissed")} className="secondary !py-2">Dismiss</button>
            </div>
            <RegulationImpactExplainer
              regulation={{
                id: update.id,
                organization: update.organization,
                category: update.category,
                title: update.title,
                summary: update.summary,
                officialUrl: update.officialUrl,
              }}
              products={products.map((item) => ({
                id: item.id,
                name: item.name,
                category: item.category,
                claims: item.claims,
              }))}
              claims={claims.map((item) => ({
                id: item.id,
                product: item.product,
                originalClaim: item.originalClaim,
                riskLevel: item.riskLevel,
                riskyPhrases: item.riskyPhrases,
                status: item.status,
                date: item.date,
              }))}
            />
          </article>
        )) : <div className="surface"><Empty icon={Landmark} title="No regulation updates yet" text="Authenticated users will see published regulation updates here." /></div>}
      </div>
    </AppShell>
  );
}

function ClaimLibrary() {
  const { claims, setClaims, loading, error } = useClaims();
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const filters = ["All", "High Risk", "Medium Risk", "Low Risk", "Needs Review", "Fixing", "Expert Review Needed", "Fixed", "Approved"];
  const visible = claims.filter((claim) => filter === "All" || filter === claim.status || filter.toLowerCase() === `${claim.riskLevel} risk`);

  const update = async (claim: ClaimAnalysis, status: ClaimStatus) => {
    const next = claims.map((item) => item.id === claim.id ? { ...item, status } : item);
    setClaims(next);
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const { error: dbError } = await supabase.from("claims").update({ status: statusToDb(status), updated_at: new Date().toISOString() }).eq("id", claim.id);
      if (dbError) writeClaimFallback(next);
    } else {
      writeFallback("claimguard-claims", next);
      writeClaimFallback(next);
    }
    await recordAudit(status === "Fixing" ? "Claim edit started" : status === "Approved" ? "Claim approved" : "Claim status changed", `${claim.product}: ${status}`);
  };

  const createTask = async (claim: ClaimAnalysis) => {
    await createWorkflowTask({
      product: claim.product,
      claimIssue: claim.originalClaim,
      riskLevel: claim.riskLevel,
      source: claim.context,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: claim.riskLevel === "high" ? "Expert Review Needed" : "Needs Review",
    });
    setMessage("Task created.");
  };

  return (
    <AppShell title="Claim Library" subtitle="A searchable review record for original claims, safer versions, risk, status, and evidence.">
      {error && <Notice text={error} />}
      {message && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div>}
      <div className="mb-5 flex flex-wrap gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "primary !py-2" : "secondary !py-2"}>{item}</button>)}</div>
      <div className="space-y-5">
        {loading ? <div className="surface p-8 text-sm text-muted">Loading claim library...</div> : visible.length ? visible.map((claim) => (
          <article key={claim.id} className="surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${levelStyles[claim.riskLevel]}`}>{claim.riskLevel} risk · {claim.riskScore}</span>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{claim.status}</span>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Original claim</p><p className="mt-2 text-sm font-semibold leading-6">{claim.originalClaim}</p></div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Safer version</p><p className="mt-2 text-sm leading-6 text-emerald-800">{claim.saferRewrite}</p></div>
            </div>
            <p className="mt-4 text-xs text-muted">{claim.product} · {claim.context} · Last checked {claim.date}</p>
            {claim.riskyPhrases.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{claim.riskyPhrases.map((phrase) => <span key={phrase} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelStyles[claim.riskLevel]}`}>{phrase}</span>)}</div>}
            <div className="mt-5 space-y-2">{claim.sources.slice(0, 2).map((source) => <SourceEvidencePanel key={source.url} source={source} whyItMatters="This official source provides context for the rule that flagged this claim." lastChecked={claim.date} />)}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => void copyText(claim.saferRewrite)} className="secondary !py-2"><Copy size={15} />Copy safer version</button>
              {(["Needs Review", "Fixing", "Expert Review Needed", "Fixed", "Approved"] as ClaimStatus[]).map((status) => <button key={status} onClick={() => void update(claim, status)} className={status === "Approved" ? "primary !py-2" : "secondary !py-2"}>{status}</button>)}
              {claim.riskLevel !== "low" && <button onClick={() => void createTask(claim)} className="secondary !py-2"><ListChecks size={15} />Create task</button>}
            </div>
          </article>
        )) : <div className="surface"><Empty icon={ClipboardCheck} title="No claims match this filter" text="Scan or check copy to add claims to the library." action="/copy-scanner" actionText="Open copy scanner" /></div>}
      </div>
    </AppShell>
  );
}

function CopyScanner() {
  const { products } = useProducts();
  const { usage, refresh: refreshUsage } = useUsage();
  const [productId, setProductId] = useState("");
  const [context, setContext] = useState("Website");
  const [copy, setCopy] = useState("");
  const [results, setResults] = useState<ClaimAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const contexts = ["Website", "Amazon listing", "Instagram caption", "Influencer script", "Email campaign", "Label"];
  const selected = products.find((product) => product.id === productId);

  const scan = async () => {
    setLoading(true);
    setError("");
    try {
      const contextType = context === "Instagram caption" ? "Social media" : context === "Email campaign" ? "Ad copy" : context;
      const response = await fetch("/api/scan-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copy,
          productCategory: selected?.category || "Other",
          ingredients: selected?.ingredients || [],
          market: selected?.market || "United States FDA + FTC",
          contextType,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Copy scan failed.");
      const analyses = (body.analyses || []).map((analysis: any) => ({
        id: crypto.randomUUID(),
        originalClaim: analysis.originalClaim,
        context,
        product: selected?.name || "Unassigned",
        date: formatDate(new Date().toISOString()),
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        riskyPhrases: analysis.riskyPhrases,
        explanation: analysis.explanation,
        saferRewrite: analysis.saferRewrite,
        checklist: analysis.checklist,
        sources: analysis.sourceReferences,
        disclaimer: analysis.disclaimer,
        status: analysis.riskLevel === "high" ? "Expert Review Needed" as const : "Needs Review" as const,
        storage: "workspace" as const,
      }));
      setResults(analyses);
      void refreshUsage();
      void recordAudit("Copy scanned", `${analyses.length} claim-like sentences reviewed from ${context}`);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Copy scan failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const save = async (result: ClaimAnalysis) => {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimText: result.originalClaim,
        productId: isSupabaseConfigured() ? productId || null : null,
        productCategory: selected?.category || "Other",
        ingredients: selected?.ingredients || [],
        market: selected?.market || "United States FDA + FTC",
        contextType: context === "Instagram caption" ? "Social media" : context === "Email campaign" ? "Ad copy" : context,
        saveOnly: true,
      }),
    });
    const body = await response.json();
    if (!response.ok || body.saved === false) writeClaimFallback([result, ...readClaimFallback().filter((claim) => claim.id !== result.id)]);
    setMessage("Claim saved to the library.");
    await recordAudit("Claim saved", `${result.product}: ${result.originalClaim}`);
  };

  const task = async (result: ClaimAnalysis) => {
    await createWorkflowTask({ product: result.product, claimIssue: result.originalClaim, riskLevel: result.riskLevel, source: context, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) });
    setMessage("Task created.");
  };

  return (
    <AppShell title="Copy Scanner" subtitle="Paste website, Amazon listing, social, or email copy — each sentence is checked against your plan limits.">
      <div className="mb-5"><UsageMeter usage={usage} /></div>
      {error && <Notice text={error} />}
      {message && <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
      <section className="surface p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Product"><select className="input" value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Unassigned</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>
          <Field label="Copy source"><select className="input" value={context} onChange={(event) => setContext(event.target.value)}>{contexts.map((item) => <option key={item}>{item}</option>)}</select></Field>
        </div>
        <div className="mt-5"><Field label="Paste copy"><textarea value={copy} onChange={(event) => setCopy(event.target.value)} className="input min-h-64 resize-none leading-6" placeholder="Paste website, listing, social, email, influencer, or label copy..." /></Field></div>
        <div className="mt-4 flex justify-end"><button onClick={() => void scan()} disabled={!copy.trim() || loading} className="primary">{loading ? <LoaderCircle size={16} className="animate-spin" /> : <ScanText size={16} />}Scan copy</button></div>
      </section>
      <div className="mt-5 space-y-4">{results.map((result) => (
        <article key={result.id} className="surface p-5">
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${levelStyles[result.riskLevel]}`}>{result.riskLevel} risk · {result.riskScore}</span>{result.riskyPhrases.map((phrase) => <span key={phrase} className="rounded-full bg-stone px-3 py-1 text-xs text-muted">{phrase}</span>)}</div>
          <p className="mt-4 text-sm font-semibold leading-6">{result.originalClaim}</p>
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Safer rewrite</p><p className="mt-2 text-sm leading-6 text-emerald-800">{result.saferRewrite}</p></div>
          {needsSupplementDisclaimer(selected?.category || "", result.originalClaim) && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">This claim may need a supplement disclaimer before publishing.</p>}
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void save(result)} className="primary !py-2"><ClipboardCheck size={15} />Save Claim</button><button onClick={() => void task(result)} className="secondary !py-2"><ListChecks size={15} />Create Task</button></div>
        </article>
      ))}</div>
    </AppShell>
  );
}

function useRegulationFeed() {
  const [updates, setUpdates] = useState<RegulationUpdate[]>(demoRegulations);
  useEffect(() => {
    const load = async () => {
      const local = readRegulationFallback();
      const supabase = getSupabaseBrowser();
      if (!supabase) return setUpdates(local.length ? local : demoRegulations);
      const { data } = await supabase.from("regulation_updates").select("*").order("date_found", { ascending: false });
      if (data?.length) setUpdates(data.map((row: any) => ({ id: row.id, organization: row.organization, country: row.country, category: row.category, title: row.title, summary: row.summary, officialUrl: row.official_url, dateFound: formatDate(row.date_found), status: "unread", notes: "" })));
    };
    void load();
  }, []);
  return updates;
}

function ProductImpact() {
  const { products } = useProducts();
  const { claims } = useClaims();
  const regulations = useRegulationFeed();
  const [message, setMessage] = useState("");
  const matches = useMemo(() => matchRegulationImpacts(products, claims, regulations), [products, claims, regulations]);

  const createTask = async (match: typeof matches[number]) => {
    await createWorkflowTask({ product: match.product, claimIssue: match.reason, riskLevel: match.riskLevel, source: match.regulation.organization, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) });
    setMessage("Impact task created.");
  };

  return (
    <AppShell title="Product Impact Matching" subtitle="Rule-based matches connect official updates with your products and saved claims.">
      {message && <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
      <div className="space-y-5">{matches.length ? matches.map((match) => (
        <article className="surface p-5 sm:p-6" key={match.id}>
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${levelStyles[match.riskLevel]}`}>{match.riskLevel} risk</span><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{match.regulation.organization}</span></div>
          <h2 className="mt-4 font-bold">{match.product}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{match.reason}</p>
          <div className="mt-4 rounded-2xl bg-stone p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">Matched claims</p>{match.matchedClaims.length ? match.matchedClaims.map((claim) => <p className="mt-2 text-sm" key={claim}>{claim}</p>) : <p className="mt-2 text-sm text-muted">Product category match; review current product copy.</p>}</div>
          <p className="mt-4 text-sm"><strong>Recommended action:</strong> {match.recommendedAction}</p>
          <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => void createTask(match)} className="primary !py-2"><ListChecks size={15} />Create task</button><a className="secondary !py-2" href={match.regulation.officialUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />Official update</a></div>
        </article>
      )) : <div className="surface"><Empty icon={AlertTriangle} title="No product impacts found yet" text="Add products and scan claims to create rule-based regulation matches." action="/products/new" actionText="Add a product" /></div>}</div>
    </AppShell>
  );
}

function TasksBoard() {
  const { usage } = useUsage();
  const { tasks, setTasks, loading } = useTasks();
  const columns: TaskStatus[] = ["Needs Review", "Fixing", "Expert Review Needed", "Fixed", "Approved"];
  const move = async (task: WorkflowTask, status: TaskStatus) => {
    const next = tasks.map((item) => item.id === task.id ? { ...item, status } : item);
    setTasks(next);
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const { error } = await supabase.from("tasks").update({ status: statusToDb(status), updated_at: new Date().toISOString() }).eq("id", task.id);
      if (error) writeTaskFallback(next);
    } else writeTaskFallback(next);
    await recordAudit("Task status changed", `${task.product}: ${status}`);
  };
  const remove = async (task: WorkflowTask) => {
    const next = tasks.filter((item) => item.id !== task.id);
    setTasks(next);
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) writeTaskFallback(next);
    } else writeTaskFallback(next);
    await recordAudit("Task removed", `${task.product}: ${task.claimIssue}`);
  };
  if (usage && !usage.limits.taskBoard) {
    return (
      <AppShell title="Task Board" subtitle="Workflow tasks are available on Guard and above.">
        <div className="surface p-6">
          <p className="text-sm leading-6 text-muted">Upgrade to Guard to turn risky claims into assigned remediation tasks with audit history.</p>
          <Link href="/settings" className="primary mt-4 inline-flex"><Sparkles size={16} />Upgrade plan</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Task Board" subtitle="Turn compliance risks into trackable fixes.">
      {loading ? <div className="surface p-8 text-sm text-muted">Loading tasks...</div> : <div className="flex gap-4 overflow-x-auto pb-4">{columns.map((column) => (
        <section key={column} className="w-64 shrink-0">
          <div className="mb-3 flex items-center justify-between px-1"><h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{column}</h2><span className="rounded-full bg-black/[.05] px-2 py-1 text-xs text-muted">{tasks.filter((task) => task.status === column).length}</span></div>
          <div className="space-y-3">{tasks.filter((task) => task.status === column).map((task) => (
            <article key={task.id} className="surface cursor-default p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${levelStyles[task.riskLevel]}`}>{task.riskLevel} risk</span>
              <p className="mt-3 text-sm font-bold">{task.product}</p><p className="mt-2 text-xs leading-5 text-muted">{task.claimIssue}</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted"><Landmark size={12} />{task.source}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted"><CalendarDays size={12} />{task.dueDate || "No due date"}</p>
              <select className="input mt-4 !px-2 !py-2 text-xs" value={task.status} onChange={(event) => void move(task, event.target.value as TaskStatus)}>{columns.map((item) => <option key={item}>{item}</option>)}</select>
              <div className="mt-3 flex flex-wrap gap-2">
                {task.status !== "Approved" && <button onClick={() => void move(task, task.status === "Needs Review" ? "Fixing" : task.status === "Fixing" ? "Expert Review Needed" : task.status === "Expert Review Needed" ? "Fixed" : "Approved")} className="secondary !px-2 !py-1.5 text-xs"><ArrowRight size={13} />Next</button>}
                <button onClick={() => void move(task, "Approved")} className="secondary !px-2 !py-1.5 text-xs"><Check size={13} />Approve</button>
                <button onClick={() => void remove(task)} className="secondary !px-2 !py-1.5 text-xs"><Trash2 size={13} />Remove</button>
              </div>
            </article>
          ))}<Link href="/claims" className="flex w-full items-center gap-2 rounded-xl border border-dashed border-black/10 px-3 py-2 text-xs text-slate-400 hover:border-black/20 hover:text-muted"><Plus size={12} />Add task from claim</Link></div>
        </section>
      ))}</div>}
    </AppShell>
  );
}

function AuditTimeline() {
  const events = useAudit();
  return (
    <section className="surface p-5 sm:p-6"><h2 className="font-bold">Audit trail</h2><p className="mt-1 text-xs text-muted">Claim checks, edits, approvals, task changes, and exports.</p>
      <div className="mt-5 space-y-4">{events.length ? events.slice(0, 12).map((event) => <div className="flex gap-3" key={event.id}><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-lavender" /><div><p className="text-sm font-semibold">{event.action}</p><p className="mt-1 text-xs text-muted">{event.detail} · {formatDate(event.createdAt)}</p></div></div>) : <p className="text-sm text-muted">Activity will appear as your team reviews claims.</p>}</div>
    </section>
  );
}

type SubscriptionSummary = {
  plan: string;
  product_id: string;
  status: string;
  next_billing_date: string | null;
  cancel_at_next_billing_date: boolean;
};

function BillingPanel({ email }: { email: string }) {
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [usage, setUsage] = useState<ReturnType<typeof useUsage>["usage"]>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [billingMessage, setBillingMessage] = useState("");

  const loadSubscription = async () => {
    try {
      const response = await fetch("/api/billing/status");
      const result = await response.json();
      setConfigured(Boolean(result.configured));
      setSubscription(result.subscription);
      setUsage(result.usage || null);
      if (!result.configured) setBillingMessage("Add your Dodo Payments API key and product IDs to activate subscriptions.");
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : "Could not load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscription();
  }, [email]);

  const startCheckout = async (tier: "guard" | "shield") => {
    const billingCycle = localStorage.getItem("claimguard-billing-cycle") === "annual" ? "annual" : "monthly";
    const plan = `${BILLING_TIER_TO_DODO[tier]}_${billingCycle}`;
    setCheckoutLoading(plan);
    setBillingMessage("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create checkout.");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : "Could not open the subscription checkout.");
    } finally {
      setCheckoutLoading("");
    }
  };

  const openPortal = async () => {
    setCheckoutLoading("portal");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not open billing portal.");
      window.location.assign(result.portalUrl);
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : "Could not open billing portal.");
    } finally {
      setCheckoutLoading("");
    }
  };

  const active = subscription?.status === "active" || subscription?.status === "trialing";
  return (
    <section className="surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#14a995]">Dodo Payments</p><h2 className="mt-2 font-bold">Subscription</h2></div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-mint text-safe" : "bg-stone text-muted"}`}>{active ? (subscription?.status === "trialing" ? "Trial" : "Active") : "Free"}</span>
      </div>
      {loading ? <p className="mt-5 text-sm text-muted">Loading subscription...</p> : (
        <>
          <div className="mt-5 rounded-xl bg-stone p-4">
            <p className="text-xs text-muted">Current access</p>
            <p className="mt-1 text-lg font-extrabold capitalize">{active ? (subscription.plan.startsWith("growth") ? "Guard" : subscription.plan.startsWith("team") ? "Shield" : subscription.plan.replace("_", " ")) : "Radar (Free)"}</p>
            {subscription?.product_id && <p className="mt-1 text-xs text-muted">{subscription.product_id}</p>}
            {subscription?.next_billing_date && <p className="mt-3 text-xs text-muted">{subscription.cancel_at_next_billing_date ? "Access ends" : "Renews"} {formatDate(subscription.next_billing_date)}</p>}
          </div>
          {usage && <div className="mt-4"><UsageMeter usage={usage} /></div>}
          {billingMessage && <p className="mt-4 text-sm leading-6 text-muted">{billingMessage}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => void startCheckout("guard")} disabled={Boolean(checkoutLoading) || !configured} className="primary">{checkoutLoading === "growth_monthly" || checkoutLoading === "growth_annual" ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}Choose Guard — $39/mo</button>
            <button onClick={() => void startCheckout("shield")} disabled={Boolean(checkoutLoading) || !configured} className="secondary">Choose Shield — $99/mo</button>
            {subscription && <button onClick={() => void openPortal()} disabled={Boolean(checkoutLoading)} className="secondary">Manage billing <ExternalLink size={14} /></button>}
          </div>
          <p className="mt-4 text-xs text-muted">Checkout uses the monthly or annual preference selected on the pricing page. Signed in as {email || "your workspace account"}.</p>
        </>
      )}
    </section>
  );
}

function SettingsPage() {
  const [profile, setProfile] = useState({ email: "", fullName: "", companyName: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setProfile(readFallback("claimguard-profile", profile));
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("email, full_name, company_name").eq("id", user.id).maybeSingle();
      setProfile({ email: data?.email || user.email || "", fullName: data?.full_name || "", companyName: data?.company_name || "" });
    };
    void load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      writeFallback("claimguard-profile", profile);
      setMessage("Profile saved to development localStorage.");
      setSaving(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: profile.fullName, company_name: profile.companyName }).eq("id", user.id);
    setMessage(error ? error.message : "Profile saved.");
    setSaving(false);
  };

  return (
    <AppShell title="Settings" subtitle="Manage your workspace preferences and account details.">
      <div className="grid gap-5 lg:grid-cols-2">
        <BrandProfileSettings />
        <section className="surface p-6">
          <h2 className="font-bold">Profile</h2>
          <div className="mt-5 space-y-4">
            <Field label="Email"><input className="input" value={profile.email} disabled /></Field>
            <Field label="Full name"><input className="input" value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} /></Field>
            <Field label="Company name"><input className="input" value={profile.companyName} onChange={(event) => setProfile({ ...profile, companyName: event.target.value })} /></Field>
            {message && <p className="text-sm text-muted">{message}</p>}
            <button onClick={saveProfile} disabled={saving} className="primary">{saving ? "Saving..." : "Save profile"}</button>
          </div>
        </section>
        <section className="surface p-6">
          <h2 className="font-bold">Notifications</h2>
          <div className="mt-5 space-y-2">
            {["High-risk claim alerts", "Weekly risk summary", "Product scan reminders"].map((item, index) => (
              <label className="flex items-center justify-between rounded-xl bg-stone p-4 text-sm font-medium" key={item}>
                {item}
                <input type="checkbox" defaultChecked={index < 2} className="h-4 w-4 accent-[#0F1729]" />
              </label>
            ))}
          </div>
        </section>
        <BillingPanel email={profile.email} />
        <FeedbackForm />
      </div>
    </AppShell>
  );
}

function Reports() {
  const { usage } = useUsage();
  const { products } = useProducts();
  const { claims } = useClaims();
  const [productName, setProductName] = useState("");
  const selectedClaims = claims.filter((claim) => !productName || claim.product === productName);
  const exportReport = () => {
    void recordAudit("Report exported", productName || "All products");
    window.print();
  };
  if (usage && !usage.limits.pdfExport) {
    return (
      <AppShell title="Reports" subtitle="PDF-style claim-risk reports are available on Guard and above.">
        <div className="surface p-6">
          <p className="text-sm leading-6 text-muted">Upgrade to Guard to export printable compliance reports for your team and consultants.</p>
          <Link href="/settings" className="primary mt-4 inline-flex"><Sparkles size={16} />View plans</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Reports" subtitle="Preview a clean, PDF-style claim-risk report for your team." action={<button onClick={exportReport} className="primary"><Printer size={16} />Export / Print</button>}>
      <div className="mb-5 max-w-sm"><Field label="Product"><select className="input" value={productName} onChange={(event) => setProductName(event.target.value)}><option value="">All products</option>{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></Field></div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <article className="surface p-6 sm:p-10">
          <div className="border-b border-black/[.06] pb-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">ClaimGuard Risk Report</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.03em]">{productName || "All products"}</h2><p className="mt-2 text-sm text-muted">Generated {formatDate(new Date().toISOString())} · {selectedClaims.length} claims scanned</p></div>
          <div className="my-6 grid gap-3 sm:grid-cols-3">{(["high", "medium", "low"] as RiskLevel[]).map((level) => <div key={level} className={`rounded-2xl p-4 ${levelStyles[level]}`}><p className="text-xs font-bold uppercase">{level} risk</p><p className="mt-2 text-2xl font-bold">{selectedClaims.filter((claim) => claim.riskLevel === level).length}</p></div>)}</div>
          <div className="space-y-5">{selectedClaims.map((claim) => <section key={claim.id} className="rounded-2xl border border-black/[.06] p-5"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${levelStyles[claim.riskLevel]}`}>{claim.riskLevel} risk</span><span className="text-xs text-muted">{claim.context}</span></div><p className="mt-4 text-sm font-semibold">{claim.originalClaim}</p><p className="mt-3 rounded-xl bg-mint p-4 text-sm text-safe">{claim.saferRewrite}</p>{claim.riskyPhrases.length > 0 && <p className="mt-3 text-xs text-muted">Risky phrases: {claim.riskyPhrases.join(", ")}</p>}<div className="mt-4 space-y-1">{claim.sources.slice(0, 2).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-lavender">{source.title}</a>)}</div></section>)}</div>
          <div className="mt-7 rounded-2xl bg-stone p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted">Checklist</p><p className="mt-3 text-sm leading-6 text-muted">Confirm substantiation, review complete publishing context, verify required label elements, resolve open tasks, and document final approval.</p></div>
          <p className="mt-5 text-xs leading-5 text-muted">{fallbackDisclaimer}</p>
        </article>
        <AuditTimeline />
      </div>
    </AppShell>
  );
}

function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing-motion");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = Array.from(root.querySelectorAll<HTMLElement>("section > div, footer > div"));
    revealTargets.forEach((element, index) => {
      element.classList.add("motion-reveal");
      element.dataset.revealIndex = String(index);
      element.classList.add(index % 2 === 0 ? "reveal-from-left" : "reveal-from-right");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
    });

    let lastScrollY = window.scrollY;
    let scrollDirection: "up" | "down" = "down";
    const setRevealSide = (element: HTMLElement) => {
      const index = Number(element.dataset.revealIndex || 0);
      const fromLeft = scrollDirection === "down" ? index % 2 === 0 : index % 2 !== 0;
      element.classList.toggle("reveal-from-left", fromLeft);
      element.classList.toggle("reveal-from-right", !fromLeft);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          setRevealSide(element);
          element.classList.add("is-visible");
        } else {
          element.classList.remove("is-visible");
          setRevealSide(element);
        }
      });
    }, { threshold: 0.08, rootMargin: "-6% 0px -6% 0px" });
    revealTargets.forEach((element) => observer.observe(element));

    const updatePointer = (event: PointerEvent) => {
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
      root.style.setProperty("--parallax-x", `${(event.clientX / window.innerWidth - .5) * 18}px`);
      root.style.setProperty("--parallax-y", `${(event.clientY / window.innerHeight - .5) * 14}px`);
    };

    const updateScrollReveal = () => {
      const nextScrollY = window.scrollY;
      if (Math.abs(nextScrollY - lastScrollY) > 2) {
        scrollDirection = nextScrollY > lastScrollY ? "down" : "up";
        lastScrollY = nextScrollY;
      }
      root.querySelectorAll<HTMLElement>(".scroll-reveal-text").forEach((element) => {
        const rect = element.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (window.innerHeight * .82 - rect.top) / (window.innerHeight * .55)));
        element.style.setProperty("--text-reveal", `${progress * 100}%`);
      });
    };

    const tiltTargets = Array.from(root.querySelectorAll<HTMLElement>(".surface, .motion-card"));
    const tiltCleanup = tiltTargets.map((element) => {
      const move = (event: PointerEvent) => {
        if (reduceMotion) return;
        const rect = element.getBoundingClientRect();
        element.style.setProperty("--tilt-x", `${((event.clientY - rect.top) / rect.height - .5) * -5}deg`);
        element.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - .5) * 5}deg`);
        element.style.setProperty("--card-x", `${event.clientX - rect.left}px`);
        element.style.setProperty("--card-y", `${event.clientY - rect.top}px`);
      };
      const leave = () => {
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
      };
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerleave", leave);
      return () => {
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerleave", leave);
      };
    });

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("scroll", updateScrollReveal, { passive: true });
    updateScrollReveal();
    requestAnimationFrame(() => revealTargets.slice(0, 2).forEach((element) => element.classList.add("is-visible")));

    return () => {
      observer.disconnect();
      tiltCleanup.forEach((cleanup) => cleanup());
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("scroll", updateScrollReveal);
    };
  }, []);

  return (
    <>
      <div className="cursor-glow" aria-hidden="true" />
      <div className="cursor-dot" aria-hidden="true" />
    </>
  );
}

function AnimatedRiskRing({ value, label, color }: { value: number; label: string; color: string }) {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const element = document.querySelector<HTMLElement>(`[data-risk-ring="${label}"]`);
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: .45 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [label]);

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / 900);
      setCount(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, visible]);

  return (
    <div data-risk-ring={label} className={`risk-ring ${visible ? "is-active" : ""}`} style={{ "--risk-value": `${value * 3.6}deg`, "--risk-color": color } as React.CSSProperties}>
      <div><strong>{count}</strong><span>{label}</span></div>
    </div>
  );
}

type BillingCycle = "monthly" | "annual";

function Landing() {
  const { isLoggedIn, loading: authLoading } = useAuthSession();
  const [heroClaim, setHeroClaim] = useState("Boosts immunity and prevents illness.");
  const [heroResult, setHeroResult] = useState<ReturnType<typeof analyzeClaim> | null>(null);
  const [demoView, setDemoView] = useState<"products" | "risk" | "updates">("risk");
  const [theme, setTheme] = useState<"light" | "dark" | "contrast">("light");
  const [navCompact, setNavCompact] = useState(false);
  const [pricingRegion, setPricingRegion] = useState<PricingRegionCode>("US");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const mounted = useClientMounted();

  useEffect(() => {
    if (!mounted) return;
    const stored = localStorage.getItem("claimguard-landing-theme");
    if (stored === "dark" || stored === "contrast" || stored === "light") setTheme(stored);
    const storedRegion = localStorage.getItem("claimguard-pricing-region");
    const storedBillingCycle = localStorage.getItem("claimguard-billing-cycle");
    if (storedBillingCycle === "monthly" || storedBillingCycle === "annual") setBillingCycle(storedBillingCycle);
    if (storedRegion && storedRegion in PRICING_REGIONS) {
      setPricingRegion(storedRegion as PricingRegionCode);
    } else {
      const detectedRegion = navigator.language.split("-")[1]?.toUpperCase();
      if (detectedRegion && detectedRegion in PRICING_REGIONS) setPricingRegion(detectedRegion as PricingRegionCode);
      else if (["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"].includes(detectedRegion)) setPricingRegion("EU");
    }
  }, [mounted]);

  useEffect(() => {
    const onScroll = () => setNavCompact(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("claimguard-landing-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("claimguard-pricing-region", pricingRegion);
  }, [pricingRegion, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("claimguard-billing-cycle", billingCycle);
  }, [billingCycle, mounted]);

  const region = PRICING_REGIONS[pricingRegion];
  const planPrice = (planId: string) => {
    if (planId === "free") return new Intl.NumberFormat(region.locale, { style: "currency", currency: region.currency, maximumFractionDigits: 0 }).format(0);
    if (planId === "guard") return formatPlanPrice(region.guard, region, billingCycle);
    if (planId === "shield") return formatPlanPrice(region.shield, region, billingCycle);
    if (planId === "agency") return formatPlanPrice(region.agency, region, billingCycle);
    return "";
  };

  const checkHeroClaim = () => {
    setHeroResult(analyzeClaim({
      claimText: heroClaim,
      productCategory: "Dietary Supplement",
      ingredients: ["Botanical blend"],
      market: "United States FDA + FTC",
      contextType: "Website",
    }));
  };

  return (
    <div className="landing-motion min-h-screen bg-stone" data-theme={mounted ? theme : "light"}>
      <LandingMotion />
      <header className={`landing-nav sticky top-0 z-40 ${navCompact ? "is-compact" : ""}`}>
        <div className="nav-inner mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          <a href="#product-demo">Product</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#resources">Resources</a>
          {!authLoading && !isLoggedIn && <Link href="/login">Log in</Link>}
        </nav>
        <div className="flex items-center gap-2">
          {mounted ? (
            <div className="theme-switcher flex rounded-full border border-black/[.08] bg-white/70 p-0.5 sm:p-1">
              {([["light", Sun], ["dark", Moon], ["contrast", Contrast]] as const).map(([value, Icon]) => (
                <button key={value} type="button" aria-label={`${value} theme`} onClick={() => setTheme(value)} className={`grid h-7 w-7 place-items-center rounded-full sm:h-8 sm:w-8 ${theme === value ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink"}`}><Icon size={13} /></button>
              ))}
            </div>
          ) : (
            <div className="h-8 w-[92px] rounded-full border border-black/[.08] bg-white/70" aria-hidden />
          )}
          {mounted && !authLoading && (
            isLoggedIn
              ? <Link href="/dashboard" className="primary !rounded-full !px-3 !py-2 sm:!px-5">Dashboard</Link>
              : <Link href="/signup" className="primary !rounded-full !px-3 !py-2 sm:!px-5">Start <span className="hidden sm:inline">Free</span></Link>
          )}
        </div>
        </div>
      </header>
      <main>
        <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 overflow-hidden px-5 py-16 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:gap-8 lg:py-12 xl:gap-12">
          <div className="max-w-[620px]">
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/[.08] bg-white px-3 py-1.5 text-xs font-medium text-muted shadow-sm"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#43dfc6]" /> Rules-engine compliance for small brands</span>
              <BetaBadge />
            </span>
            <h1 className="mt-6 text-[2.75rem] font-extrabold leading-[1.04] tracking-[-.055em] sm:text-[3.15rem] lg:text-[3.35rem] xl:text-[3.75rem]">Compliance monitoring for brands that <span className="figma-accent">cannot afford surprises.</span></h1>
            <p className="mt-6 max-w-[640px] text-base leading-7 text-muted sm:text-lg sm:leading-8">ClaimGuard watches regulation updates, checks risky product claims, and shows exactly what to fix before your food, supplement, or wellness brand gets into trouble.</p>
            <div className="mt-6 rounded-2xl border border-black/[.08] bg-white p-2 shadow-[0_16px_38px_rgba(16,24,45,.08)]">
              {mounted ? (
                <div className="flex gap-2">
                  <input aria-label="Quick claim check" autoComplete="off" value={heroClaim} onChange={(event) => setHeroClaim(event.target.value)} onKeyDown={(event) => event.key === "Enter" && checkHeroClaim()} className="min-w-0 flex-1 rounded-xl bg-stone px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                  <button type="button" onClick={checkHeroClaim} disabled={!heroClaim.trim()} className="primary shrink-0 !px-4"><Sparkles size={16} /><span className="hidden sm:inline">Check</span></button>
                </div>
              ) : (
                <div className="flex gap-2" aria-hidden>
                  <div className="h-11 min-w-0 flex-1 rounded-xl bg-stone" />
                  <div className="h-11 w-20 rounded-full bg-ink/90" />
                </div>
              )}
              {heroResult && (
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-stone px-3 py-2.5 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-bold uppercase ${levelStyles[heroResult.riskLevel]}`}>{heroResult.riskLevel} · {heroResult.riskScore}</span>
                  <p className="min-w-0 flex-1 truncate text-muted">{heroResult.saferRewrite}</p>
                  <Link href="/claim-checker" className="font-bold text-lavender">Full check</Link>
                </div>
              )}
            </div>
            <div className="mt-3">
              <RegressionCoverageBadge compact />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <CheckFirstClaimCTA />
              <Link href="/dashboard" className="secondary !rounded-full !px-6"><span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[9px] text-white">▶</span> View Product Demo</Link>
            </div>
            <p className="mt-5 text-xs font-medium text-slate-400">Built for small food, supplement, wellness, and DTC brands.</p>
          </div>
          <div className="hero-dashboard-wrap relative mx-auto w-full max-w-[760px] px-2 pt-4 sm:px-8 lg:mx-0 lg:max-w-none lg:px-6">
            <div className="floating-card floating-card-a absolute -left-1 top-14 z-10 rounded-2xl border border-black/[.06] bg-white px-4 py-3 shadow-[0_15px_35px_rgba(15,23,41,.13)] lg:-left-5">
              <p className="text-xs text-muted">Detected</p><p className="text-sm font-bold">High-risk claim</p>
            </div>
            <div className="floating-card floating-card-b absolute -right-1 top-32 z-10 hidden rounded-2xl border border-black/[.06] bg-white px-4 py-3 shadow-[0_15px_35px_rgba(15,23,41,.13)] sm:block lg:-right-5">
              <p className="text-xs text-muted">Alert</p><p className="text-sm font-bold">FDA update found</p>
            </div>
            <div className="floating-card floating-card-c absolute -left-1 bottom-12 z-10 hidden rounded-2xl border border-black/[.06] bg-white px-4 py-3 shadow-[0_15px_35px_rgba(15,23,41,.13)] sm:block">
              <p className="text-xs text-muted">Action needed</p><p className="text-sm font-bold">3 products</p>
            </div>
            <div className="hero-dashboard relative overflow-hidden rounded-3xl border border-black/[.07] bg-white shadow-[0_28px_80px_rgba(15,23,41,.13)]">
              <div className="flex items-center justify-between border-b border-black/[.06] px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-bold"><span className="grid h-6 w-6 place-items-center rounded-lg bg-ink text-[#43dfc6]"><ShieldCheck size={13} /></span> ClaimGuard Dashboard</div>
                <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  {mounted ? (
                    ([
                      ["products", "Products", "8", "text-blue-600"],
                      ["risk", "High Risk", "3", "text-red-600"],
                      ["updates", "Updates", "12", "text-emerald-600"],
                    ] as const).map(([view, label, value, tone]) => (
                      <button type="button" onClick={() => setDemoView(view)} className={`rounded-xl border p-3 text-left transition ${demoView === view ? "border-emerald-200 bg-emerald-50 shadow-sm" : "border-black/[.06] bg-stone hover:bg-white"}`} key={view}>
                        <p className="text-[10px] text-muted">{label}</p>
                        <p className={`mt-1 text-xl font-extrabold ${tone}`}>{value}</p>
                      </button>
                    ))
                  ) : (
                    ([
                      ["products", "Products", "8", "text-blue-600"],
                      ["risk", "High Risk", "3", "text-red-600"],
                      ["updates", "Updates", "12", "text-emerald-600"],
                    ] as const).map(([view, label, value, tone]) => (
                      <div className={`rounded-xl border p-3 text-left ${view === "risk" ? "border-emerald-200 bg-emerald-50 shadow-sm" : "border-black/[.06] bg-stone"}`} key={view} aria-hidden>
                        <p className="text-[10px] text-muted">{label}</p>
                        <p className={`mt-1 text-xl font-extrabold ${tone}`}>{value}</p>
                      </div>
                    ))
                  )}
                </div>
                {demoView === "risk" && <div className="mt-4 rounded-xl border border-black/[.06] p-4"><div className="flex justify-between gap-3"><p className="text-sm font-bold">Turmeric Gummies</p><span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">High Risk</span></div><div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 w-4/5 rounded-full bg-red-500" /></div><p className="mt-2 text-right text-xs font-bold">82/100</p><div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-700">Safer Rewrite Ready</p><p className="mt-1 text-[11px] text-emerald-700/70">Supports everyday comfort and mobility.</p></div></div>}
                {demoView === "products" && <div className="mt-4 space-y-2">{[["Daily Glow Collagen", "18", "bg-emerald-500"], ["Focus Spark", "46", "bg-amber-400"], ["Turmeric Gummies", "82", "bg-red-500"]].map(([name, score, color]) => <div key={name} className="rounded-xl border border-black/[.06] p-3"><div className="flex justify-between text-xs"><strong>{name}</strong><span>{score}/100</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} /></div></div>)}</div>}
                {demoView === "updates" && <div className="mt-4 space-y-2">{demoRegulations.slice(0, 3).map((item) => <div key={item.id} className="rounded-xl border border-blue-100 bg-blue-50 p-3"><div className="flex items-center justify-between"><p className="text-xs font-bold text-blue-700">{item.organization} · {item.title}</p><ChevronRight size={13} className="text-blue-500" /></div><p className="mt-1 truncate text-[10px] text-blue-700/60">{item.summary}</p></div>)}</div>}
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-black/[.05] bg-white px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#14a995]">The compliance gap</p>
            <h2 className="scroll-reveal-text mt-6 text-3xl font-extrabold leading-tight tracking-[-.045em] sm:text-5xl">Regulations change. Claims multiply. Small teams are expected to catch everything.</h2>
          </div>
        </section>
        <section className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#14a995]">Why ClaimGuard</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Compliance should not depend on someone remembering every rule.</h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                [AlertTriangle, "Risky claims hide in plain sight", "A single phrase on a label, ad, or listing can create unnecessary exposure."],
                [Landmark, "Rules keep moving", "FDA, FTC, and marketplace guidance changes faster than most teams can track."],
                [Search, "Review is fragmented", "Product details, evidence, claims, and decisions often live in different places."],
                [Zap, "Fixes happen too late", "Teams discover problems after copy is approved, published, or already printed."],
              ].map(([Icon, title, text]: any) => (
                <div key={title} className="motion-card surface p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose text-high"><Icon size={19} /></span>
                  <h3 className="mt-6 font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="features" className="bg-stone px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Features</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">A simpler way to review marketing claims</h2>
              <p className="mt-4 text-sm leading-7 text-muted">ClaimGuard brings product information, claim checks, safer rewrites, and regulatory updates into one calm workspace your team can actually use.</p>
            </div>
            <div className="mt-10 grid auto-rows-[minmax(190px,auto)] gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="motion-card surface p-6 md:col-span-2 lg:row-span-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500"><Gauge size={18} /></span>
                <h3 className="mt-5 text-xl font-bold">Claim risk checker</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted">Understand what needs attention at a glance, with clear low, medium, and high risk levels.</p>
                <div className="mt-7 rounded-2xl bg-stone p-4">
                  <div className="flex items-center justify-between"><p className="text-sm font-bold">“Prevents illness all year.”</p><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">High · 89</span></div>
                  <div className="mt-5 h-2 rounded-full bg-white"><div className="h-2 w-[89%] rounded-full bg-red-500" /></div>
                  <div className="mt-4 flex flex-wrap gap-2">{["prevents", "illness"].map((phrase) => <span key={phrase} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-600">{phrase}</span>)}</div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <AnimatedRiskRing value={18} label="Safe" color="#10b981" />
                  <AnimatedRiskRing value={46} label="Review" color="#f59e0b" />
                  <AnimatedRiskRing value={89} label="High" color="#ef4444" />
                </div>
              </div>
              <div className="motion-card surface p-6 md:col-span-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Sparkles size={18} /></span>
                <h3 className="mt-5 font-bold">Safer claim rewriter</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Turn risky promises into measured, support-oriented language.</p>
                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Supports immune system health throughout the year.</div>
              </div>
              <div className="motion-card surface p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Package size={18} /></span>
                <h3 className="mt-5 font-bold">Product workspace</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Keep markets, ingredients, and claims connected.</p>
                <div className="mt-5 flex -space-x-2">{["DG", "CN", "FS"].map((name, index) => <span key={name} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white ${["bg-blue-500", "bg-violet-500", "bg-emerald-500"][index]}`}>{name}</span>)}</div>
              </div>
              <div className="motion-card surface p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Landmark size={18} /></span>
                <h3 className="mt-5 font-bold">Regulation watch</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Follow FDA, FTC, and FSSAI updates.</p>
                <div className="mt-5 flex gap-2">{["FDA", "FTC", "FSSAI"].map((org) => <span key={org} className="rounded-full bg-stone px-3 py-1 text-[10px] font-bold">{org}</span>)}</div>
              </div>
              <div className="motion-card surface p-6 md:col-span-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><ListChecks size={18} /></span>
                <h3 className="mt-5 font-bold">Compliance workflow</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Move risky claims from review to approved with a clear audit trail.</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-bold"><span className="rounded-lg bg-rose p-3 text-high">Needs review · 4</span><span className="rounded-lg bg-apricot p-3 text-medium">Fixing · 2</span><span className="rounded-lg bg-mint p-3 text-safe">Approved · 12</span></div>
              </div>
              <div className="motion-card surface p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><ScanText size={18} /></span>
                <h3 className="mt-5 font-bold">Copy scanner</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Paste website, Amazon, social, or email copy — each sentence is checked against FDA/FTC rules.</p>
              </div>
              <div className="motion-card surface p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><FileText size={18} /></span>
                <h3 className="mt-5 font-bold">Reports & evidence</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Keep sources, decisions, and exports ready to share.</p>
              </div>
            </div>
          </div>
        </section>
        <section id="how" className="px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From draft claim to a clearer next step</h2>
              <p className="mt-4 text-sm leading-7 text-muted">You do not need to be a regulatory expert to get started. ClaimGuard explains what it found and keeps the next action practical.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                [Upload, "01", "Add your product", "Capture the category, market, platforms, ingredients, and existing marketing copy."],
                [Sparkles, "02", "Check a claim", "Paste label, website, Amazon, ad, social, or influencer copy for a focused review."],
                [WandSparkles, "03", "Improve and track", "Review risky phrases, use a safer rewrite, and mark the claim fixed or approved."],
              ].map(([Icon, number, title, text]: any) => (
                <div key={title} className="motion-card rounded-2xl border border-black/[.06] bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={18} /></span>
                    <span className="text-xs font-bold tracking-[.18em] text-slate-300">{number}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="product-demo" className="bg-ink px-5 py-20 text-white sm:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/50">Built for real marketing work</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Review the places where wellness claims actually appear</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/65">A claim can feel reasonable on a product page and become risky in an ad or influencer script. ClaimGuard keeps the publishing context visible throughout the review.</p>
              <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-stone">
                Start your workspace <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Product labels", "Review structure/function wording before packaging is finalized."],
                ["Website and Amazon copy", "Paste headlines, bullets, descriptions, and benefit claims — no URL crawling required."],
                ["Paid ads and social", "Catch absolute promises before campaigns go live."],
                ["Influencer scripts", "Give creators clearer, safer language to work from."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[.06] p-5">
                  <CheckCircle2 size={18} className="text-[#9bd5b8]" />
                  <h3 className="mt-4 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#14a995]">Interactive claim checker</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Know what is risky before it goes live.</h2>
              <p className="mt-5 text-sm leading-7 text-muted">Paste a product claim and get a clear risk level, the phrases that triggered it, and a safer direction your team can work with.</p>
              <Link href="/claim-checker" className="primary mt-7">Check a claim <ArrowRight size={16} /></Link>
            </div>
            <div className="surface p-5 sm:p-7">
              <div className="rounded-xl border border-black/[.08] bg-stone p-5 text-sm leading-7">“Clinically proven to eliminate anxiety and guarantee perfect sleep.”</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-red-600">High risk · 92/100</p>
                  <p className="mt-3 text-sm leading-6 text-red-800">Disease language and absolute promises need attention.</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-700">Safer rewrite</p>
                  <p className="mt-3 text-sm leading-6 text-emerald-800">Supports relaxation and helps maintain a restful sleep routine.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="resources" className="bg-white px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#14a995]">Regulation watch</p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Official updates, translated into practical next steps.</h2>
              </div>
              <Link href="/regulations" className="secondary">View all updates <ArrowRight size={16} /></Link>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {demoRegulations.slice(0, 3).map((item, index) => (
                <div key={item.id} className="surface p-6">
                  <div className="flex items-center justify-between"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{item.organization}</span><span className="text-xs text-muted">{item.dateFound}</span></div>
                  <h3 className="mt-6 font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.summary}</p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#14a995]"><Sparkles size={14} /> {index + 1} product{index ? "s" : ""} may be affected</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#14a995]">Before and after</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Safer wording without losing the point.</h2></div>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-red-600">Before · high risk</p><p className="mt-5 text-xl font-bold leading-8">“Boosts immunity and prevents illness all year long.”</p><p className="mt-5 text-sm leading-7 text-red-800/70">Absolute prevention language can imply a disease claim.</p></div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">After · safer direction</p><p className="mt-5 text-xl font-bold leading-8">“Supports immune system health throughout the year.”</p><p className="mt-5 text-sm leading-7 text-emerald-800/70">Measured structure/function language keeps the intended benefit clear.</p></div>
            </div>
          </div>
        </section>
        <section id="pricing" className="bg-white px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#14a995]">Transparent pricing under $100/mo</p>
                <BetaBadge />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Consultants charge $300/hr. ClaimGuard starts at $39/mo.</h2>
              <p className="mt-4 text-sm leading-7 text-muted">{PRICE_ANCHOR_COPY} Plans are locally priced for your market.</p>
              {mounted && pricingRegion === "US" && <p className="mt-3 rounded-full bg-mint px-4 py-2 text-xs font-semibold text-safe">{FOUNDING_OFFER_COPY}</p>}
            </div>
            <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-black/[.08] bg-stone p-3 sm:flex-row">
              {mounted ? (
                <>
                  <label className="relative flex w-full items-center gap-2 sm:w-auto">
                    <Globe2 className="pointer-events-none absolute left-3 text-[#14a995]" size={16} />
                    <select aria-label="Pricing country and currency" autoComplete="off" value={pricingRegion} onChange={(event) => setPricingRegion(event.target.value as PricingRegionCode)} className="w-full appearance-none rounded-xl border border-black/[.08] bg-white py-2.5 pl-10 pr-10 text-sm font-bold outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 sm:w-auto">
                      {Object.entries(PRICING_REGIONS).map(([code, option]) => <option key={code} value={code}>{option.country} · {option.currency}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 text-muted" size={14} />
                  </label>
                  <div className="flex w-full rounded-xl border border-black/[.08] bg-white p-1 sm:w-auto">
                    {(["monthly", "annual"] as BillingCycle[]).map((cycle) => (
                      <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)} className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold capitalize transition sm:flex-none ${billingCycle === cycle ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink"}`}>
                        {cycle}{cycle === "annual" && <span className="ml-1.5 text-[#43dfc6]">-20%</span>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-hidden>
                  <div className="h-10 w-full rounded-xl bg-white sm:w-56" />
                  <div className="h-10 w-full rounded-xl bg-white sm:w-44" />
                </div>
              )}
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {PRICING_PLANS.map((plan) => {
                const highlighted = plan.highlighted;
                const price = planPrice(plan.id);
                const showFounding = plan.id === "guard" && region.foundingGuard && pricingRegion === "US";
                return (
                  <div key={plan.id} className={`rounded-2xl border p-7 ${highlighted ? "border-ink bg-ink text-white shadow-xl" : "border-black/[.08] bg-stone"}`}>
                    <p className={`text-xs font-bold uppercase tracking-[.16em] ${highlighted ? "text-[#43dfc6]" : "text-muted"}`}>{plan.name} · {plan.subtitle}</p>
                    <p className="mt-5 text-4xl font-extrabold tracking-[-.05em]">
                      {showFounding && (
                        <span className={`mr-2 text-lg line-through ${highlighted ? "text-white/40" : "text-muted"}`}>
                          {formatPlanPrice(region.guard, region, billingCycle)}
                        </span>
                      )}
                      {showFounding ? formatPlanPrice(region.foundingGuard!, region, billingCycle) : price}
                      <span className={`text-sm font-medium ${highlighted ? "text-white/45" : "text-muted"}`}> / month</span>
                    </p>
                    {showFounding && <p className={`mt-2 text-xs font-semibold ${highlighted ? "text-[#43dfc6]" : "text-safe"}`}>Founding price · locked for life</p>}
                    {billingCycle === "annual" && plan.id !== "free" && <p className={`mt-2 text-xs font-semibold ${highlighted ? "text-[#43dfc6]" : "text-safe"}`}>Billed annually · save 20%</p>}
                    <p className={`mt-4 text-sm leading-7 ${highlighted ? "text-white/60" : "text-muted"}`}>{plan.description}</p>
                    <div className="my-7 h-px bg-current opacity-10" />
                    <div className="space-y-3">{plan.features.map((item) => <p key={item} className="flex items-center gap-2 text-sm"><Check size={15} className={highlighted ? "text-[#43dfc6]" : "text-safe"} />{item}</p>)}</div>
                    <Link href={plan.href} className={`${highlighted ? "secondary" : "primary"} mt-8 w-full`}>{plan.id === "agency" ? "Contact sales" : plan.cta}</Link>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-black/[.08] bg-stone px-6 py-5 text-center sm:flex-row sm:text-left">
              <div>
                <p className="text-sm font-bold">Enterprise — {formatEnterpriseFrom(region)}</p>
                <p className="mt-1 text-xs leading-6 text-muted">SSO, API access, FSSAI/EU compliance packs, custom SLAs, and dedicated onboarding for larger teams.</p>
              </div>
              <Link href="/signup" className="secondary shrink-0">Contact sales <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>
        <section className="bg-stone px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            <div className="surface p-6 sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-safe"><ShieldCheck size={20} /></span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-safe">Designed for responsible review</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Helpful guidance without pretending to be legal advice</h2>
              <p className="mt-4 text-sm leading-7 text-muted">Every result includes an explanation, practical checklist, official FDA and FTC sources, and a clear disclaimer. High-risk claims should still go to a qualified compliance professional.</p>
            </div>
            <div className="surface p-6 sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-apricot text-medium"><Landmark size={20} /></span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-medium">Stay organized</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Keep regulatory updates and claim decisions together</h2>
              <p className="mt-4 text-sm leading-7 text-muted">Track shared regulation updates, mark items reviewed or action needed, and keep each saved claim connected to the product and publishing context it belongs to.</p>
            </div>
          </div>
        </section>
        <section className="px-5 py-20 sm:px-8 lg:py-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-ink px-6 py-12 text-center text-white sm:px-10 sm:py-16">
            <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-[#00C9A7]/15 blur-3xl" />
            <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10 text-[#00C9A7]"><ShieldCheck size={22} /></span>
            <h2 className="relative mx-auto mt-6 max-w-2xl text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">Stop guessing. Catch compliance risk before it becomes expensive.</h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60">Start with one product and one claim. ClaimGuard will help your team build a clearer, more consistent review habit over time.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <CheckFirstClaimCTA variant="secondary" />
              <Link href="/disclaimer" className="relative px-4 py-3 text-sm font-semibold text-white/60 hover:text-white">Read the disclaimer</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-black/[.06] bg-white px-5 py-12 text-sm text-muted sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6">A calmer way for food, supplement, and wellness teams to spot claim risk, follow official updates, and document their review work.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-ink">Product</p>
            <div className="mt-4 grid gap-3">
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Start free</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-ink">Legal</p>
            <div className="mt-4 grid gap-3">
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/cookies">Cookies</Link>
              <Link href="/disclaimer">Disclaimer</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-black/[.06] pt-6 text-xs">
          © 2026 ClaimGuard. Educational compliance guidance, not legal advice.
        </div>
      </footer>
    </div>
  );
}

function Auth({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useClientMounted();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const resolvePostAuthPath = async () => {
    const profile = await loadBrandProfile();
    return postAuthPath(profile, { next: searchParams.get("next"), signup });
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (signup && !agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to create an account.");
      return;
    }
    if (!isSupabaseConfigured()) {
      if (useDevelopmentFallback) {
        localStorage.setItem("claimguard-dev-user", JSON.stringify({ email, full_name: name }));
        router.push(await resolvePostAuthPath());
        return;
      }
      setError("Add Supabase environment variables to enable authentication.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Supabase client could not be created.");
      setLoading(false);
      return;
    }
    if (signup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            terms_accepted_at: new Date().toISOString(),
            terms_version: LEGAL_POLICY_VERSION,
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        if (data.session) {
          await loadBrandProfile(data.user?.id);
          router.push(await resolvePostAuthPath());
          router.refresh();
        } else {
          setMessage("Account created. Check your inbox to confirm your email, then log in.");
        }
      }
    } else {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        await loadBrandProfile(signInData.user?.id);
        router.push(await resolvePostAuthPath());
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen bg-stone lg:grid-cols-2">
      <div className="flex min-h-screen items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          <Logo />
          <div className="surface mt-10 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">{signup ? "Start free" : "Welcome back"}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-.03em]">{signup ? "Create your workspace" : "Log in to ClaimGuard"}</h1>
          <p className="mt-2 text-sm text-muted">{signup ? "Start checking claims with confidence." : "Log in to continue to ClaimGuard."}</p>
          <div className="mt-8 space-y-4">
            {mounted ? (
              <>
                {signup && <Field label="Full name"><input className="input" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></Field>}
                <Field label="Work email"><input className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></Field>
                <Field label="Password"><input type="password" className="input" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></Field>
                {signup && <SignupLegalConsent checked={agreedToTerms} onChange={setAgreedToTerms} />}
                {error && <Notice text={error} />}
                {message && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
                <button type="button" onClick={handleSubmit} disabled={loading || (signup && !agreedToTerms)} className="primary w-full">
                  {loading ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {signup ? "Create account" : "Log in"}
                </button>
              </>
            ) : (
              <div className="space-y-4" aria-hidden>
                <div className="h-20 rounded-xl bg-stone" />
                <div className="h-20 rounded-xl bg-stone" />
                <div className="h-20 rounded-xl bg-stone" />
                <div className="h-12 rounded-full bg-ink/90" />
              </div>
            )}
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            {signup ? "Already have an account?" : "New to ClaimGuard?"}{" "}
            <Link className="font-semibold text-blue-700" href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create an account"}</Link>
          </p>
          </div>
        </div>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-ink p-14 text-white lg:flex">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#00C9A7]/15 blur-3xl" />
        <div className="relative max-w-md">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10 text-[#00C9A7]"><ShieldCheck size={23} /></span>
          <h2 className="mt-8 text-4xl font-extrabold leading-tight tracking-[-.04em]">Publish with more clarity and fewer surprises.</h2>
          <p className="mt-5 leading-7 text-white/60">A focused workspace for checking claims, monitoring official updates, and keeping every fix moving.</p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const path = usePathname();

  if (path === "/") return <Landing />;
  if (path === "/login") return <Auth />;
  if (path === "/signup") return <Auth signup />;
  if (path === "/onboarding") return <OnboardingPage />;
  if (path === "/dashboard") return <Dashboard />;
  if (path === "/products") return <Products />;
  if (path === "/products/new" || path === "/products/add") return <AddProduct />;
  if (path === "/claim-checker") return <ClaimChecker />;
  if (path === "/claims" || path === "/saved-claims") return <ClaimLibrary />;
  if (path === "/regulations") return <Regulations />;
  if (path === "/impact") return <ProductImpact />;
  if (path === "/copy-scanner") return <CopyScanner />;
  if (path === "/tasks") return <TasksBoard />;
  if (path === "/settings") return <SettingsPage />;
  if (path === "/reports") return <Reports />;
  if (path === "/terms") return <LegalPage document={TERMS_OF_SERVICE} />;
  if (path === "/privacy") return <LegalPage document={PRIVACY_POLICY} />;
  if (path === "/cookies") return <LegalPage document={COOKIE_POLICY} />;
  if (path === "/disclaimer") return <LegalPage document={PRODUCT_DISCLAIMER} />;
  return <Landing />;
}
