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

    if (!force && cacheUserId === user.id && Date.now() - cacheTimestamp < CACHE_MS && products.length > 0) {
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

    const workspaceResponse = await fetch("/api/workspace", { cache: "no-store" });
    if (!workspaceResponse.ok) {
      const body = await workspaceResponse.json().catch(() => ({})) as { error?: string };
      const message = body.error || "Unable to load workspace data.";
      setProductsError(message);
      setClaimsError(message);
      setProducts([]);
      setClaims([]);
      setLoading(false);
      return;
    }

    const workspace = await workspaceResponse.json() as {
      products?: Record<string, unknown>[];
      claims?: Record<string, unknown>[];
      tasks?: Record<string, unknown>[];
      regulations?: Record<string, unknown>[];
      auditEvents?: Record<string, unknown>[];
      errors?: {
        products?: string | null;
        claims?: string | null;
        tasks?: string | null;
        regulations?: string | null;
        auditEvents?: string | null;
      };
    };

    if (workspace.errors?.products) {
      setProductsError(workspace.errors.products);
      setProducts([]);
    }

    if (workspace.errors?.claims) {
      setClaimsError(workspace.errors.claims);
      setClaims([]);
    }

    const databaseClaims: ClaimAnalysis[] = workspace.errors?.claims
      ? []
      : (workspace.claims || []).map((row) => rowToAnalysis(row));

    const mergedClaims = [
      ...localClaims,
      ...databaseClaims.filter((claim) => !localClaims.some((local) => local.id === claim.id)),
    ];

    const nextProducts = workspace.errors?.products
      ? []
      : (workspace.products || []).map((row) => enrichProduct(row, databaseClaims));

    const databaseTasks: WorkflowTask[] = workspace.errors?.tasks
      ? []
      : (workspace.tasks || []).map((row) => rowToTask(row));

    const mergedTasks = [
      ...localTasks,
      ...databaseTasks.filter((task) => !localTasks.some((local) => local.id === task.id)),
    ];

    const nextRegulations = workspace.regulations?.length
      ? workspace.regulations.map((row) => rowToRegulation(row))
      : localRegulations.length
        ? localRegulations
        : demoRegulations;

    const databaseAudit: AuditEvent[] = (workspace.auditEvents || []).map((row) => ({
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
  }, [authLoading, user, loadDevelopmentData, products.length]);

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