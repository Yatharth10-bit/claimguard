"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/contexts/AuthContext";
import { CLAIM_DISCLAIMER } from "@/lib/analyzeClaim";
import { REGULATORY_SOURCES } from "@/lib/regulatorySources";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  enrichProduct,
  formatWorkspaceDate,
  rowToAnalysis,
  rowToRegulation,
  rowToTask,
} from "@/lib/workspaceMappers";
import {
  readAuditFallback,
  readClaimFallback,
  readFallback,
  readRegulationFallback,
  readTaskFallback,
} from "@/lib/workspaceStorage";
import type {
  AuditEvent,
  ClaimAnalysis,
  Product,
  RegulationUpdate,
  WorkflowTask,
} from "@/lib/workspaceTypes";

const useDevelopmentFallback = process.env.NODE_ENV === "development" && !isSupabaseConfigured();

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
    checklist: ["Confirm the claim is truthful and not misleading."],
    sources: [{ title: "FDA: Structure/Function Claims", url: "https://www.fda.gov/food/food-labeling-nutrition/structurefunction-claims" }],
    disclaimer: CLAIM_DISCLAIMER,
    status: "Approved",
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

type WorkspaceDataContextValue = {
  products: Product[];
  claims: ClaimAnalysis[];
  tasks: WorkflowTask[];
  regulations: RegulationUpdate[];
  auditEvents: AuditEvent[];
  loading: boolean;
  productsError: string;
  claimsError: string;
  setClaims: React.Dispatch<React.SetStateAction<ClaimAnalysis[]>>;
  setTasks: React.Dispatch<React.SetStateAction<WorkflowTask[]>>;
  reload: () => Promise<void>;
  invalidate: () => void;
};

const WorkspaceDataContext = createContext<WorkspaceDataContextValue | null>(null);

let cacheUserId: string | null = null;
let cacheTimestamp = 0;
const CACHE_MS = 30_000;

export function invalidateWorkspaceCache() {
  cacheUserId = null;
  cacheTimestamp = 0;
}

export function refreshWorkspaceData() {
  invalidateWorkspaceCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("claimguard:workspace-refresh"));
  }
}

export function WorkspaceDataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [claims, setClaims] = useState<ClaimAnalysis[]>([]);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [regulations, setRegulations] = useState<RegulationUpdate[]>(demoRegulations);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [claimsError, setClaimsError] = useState("");

  const loadDevelopmentData = useCallback(() => {
    const localClaims = readClaimFallback();
    const developmentClaims = readFallback("claimguard-claims", demoClaims, useDevelopmentFallback);
    const mergedClaims = [
      ...localClaims,
      ...developmentClaims.filter((claim) => !localClaims.some((local) => local.id === claim.id)),
    ];
    setProducts(readFallback("claimguard-products", demoProducts, useDevelopmentFallback));
    setClaims(mergedClaims);
    setTasks(readTaskFallback());
    setRegulations(readRegulationFallback().length ? readRegulationFallback() : demoRegulations);
    setAuditEvents(readAuditFallback());
    setProductsError(useDevelopmentFallback ? "Supabase is not configured. Using development localStorage." : "Supabase is not configured.");
    setClaimsError(useDevelopmentFallback ? "Supabase is not configured. Using development localStorage." : "Supabase is not configured.");
    setLoading(false);
  }, []);

  const load = useCallback(async (force = false) => {
    if (authLoading) return;

    if (!user) {
      setProducts([]);
      setClaims([]);
      setTasks([]);
      setRegulations(demoRegulations);
      setAuditEvents([]);
      setProductsError("");
      setClaimsError("");
      setLoading(false);
      return;
    }

    if (!force && cacheUserId === user.id && Date.now() - cacheTimestamp < CACHE_MS) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setProductsError("");
    setClaimsError("");

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      loadDevelopmentData();
      return;
    }

    const localClaims = readClaimFallback();
    const localTasks = readTaskFallback();
    const localAudit = readAuditFallback();
    const localRegulations = readRegulationFallback();

    const [
      productsResult,
      claimsResult,
      tasksResult,
      regulationsResult,
      auditResult,
    ] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, category, market, platforms, ingredients, claims_text, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("claims")
        .select("id, original_text, context_type, risk_level, risk_score, risky_phrases, explanation, safer_rewrite, checklist, sources, status, created_at, product_id, products(name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("regulation_updates").select("*").order("date_found", { ascending: false }).limit(50),
      supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(30),
    ]);

    if (productsResult.error) {
      setProductsError(productsResult.error.message);
      setProducts([]);
    }

    if (claimsResult.error) {
      setClaimsError(claimsResult.error.message);
      setClaims([]);
    }

    const databaseClaims: ClaimAnalysis[] = claimsResult.error
      ? []
      : (claimsResult.data || []).map((row: Record<string, unknown>) => rowToAnalysis(row));

    const mergedClaims = [
      ...localClaims,
      ...databaseClaims.filter((claim) => !localClaims.some((local) => local.id === claim.id)),
    ];

    const nextProducts = productsResult.error
      ? []
      : (productsResult.data || []).map((row: Record<string, unknown>) => enrichProduct(row, databaseClaims));

    const databaseTasks: WorkflowTask[] = tasksResult.error
      ? []
      : (tasksResult.data || []).map((row: Record<string, unknown>) => rowToTask(row));

    const mergedTasks = [
      ...localTasks,
      ...databaseTasks.filter((task) => !localTasks.some((local) => local.id === task.id)),
    ];

    const nextRegulations = regulationsResult.data?.length
      ? regulationsResult.data.map((row: Record<string, unknown>) => rowToRegulation(row))
      : localRegulations.length
        ? localRegulations
        : demoRegulations;

    const databaseAudit: AuditEvent[] = (auditResult.data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      action: String(row.action),
      detail: String(row.detail),
      createdAt: String(row.created_at),
    }));

    const mergedAudit = [
      ...localAudit,
      ...databaseAudit.filter((event) => !localAudit.some((local) => local.id === event.id)),
    ];

    setProducts(nextProducts);
    setClaims(mergedClaims);
    setTasks(mergedTasks);
    setRegulations(nextRegulations);
    setAuditEvents(mergedAudit);
    cacheUserId = user.id;
    cacheTimestamp = Date.now();
    setLoading(false);
  }, [authLoading, user, loadDevelopmentData]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handler = () => {
      void load(true);
    };
    window.addEventListener("claimguard:workspace-refresh", handler);
    return () => window.removeEventListener("claimguard:workspace-refresh", handler);
  }, [load]);

  const value = useMemo(
    () => ({
      products,
      claims,
      tasks,
      regulations,
      auditEvents,
      loading,
      productsError,
      claimsError,
      setClaims,
      setTasks,
      reload: () => load(true),
      invalidate: invalidateWorkspaceCache,
    }),
    [products, claims, tasks, regulations, auditEvents, loading, productsError, claimsError, load],
  );

  return <WorkspaceDataContext.Provider value={value}>{children}</WorkspaceDataContext.Provider>;
}

function useWorkspaceData() {
  const context = useContext(WorkspaceDataContext);
  if (!context) throw new Error("useWorkspaceData must be used within WorkspaceDataProvider");
  return context;
}

export function useProducts() {
  const { products, loading, productsError, reload } = useWorkspaceData();
  return { products, loading, error: productsError, reload };
}

export function useClaims() {
  const { claims, loading, claimsError, setClaims, reload } = useWorkspaceData();
  return { claims, loading, error: claimsError, setClaims, reload };
}

export function useTasks() {
  const { tasks, loading, setTasks, reload } = useWorkspaceData();
  return { tasks, setTasks, loading, reload };
}

export function useRegulationFeed() {
  const { regulations } = useWorkspaceData();
  return regulations;
}

export function useAudit() {
  const { auditEvents } = useWorkspaceData();
  return auditEvents;
}

export { formatWorkspaceDate as formatDate };