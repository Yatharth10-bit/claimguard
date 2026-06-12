export type PlanTier = "radar" | "guard" | "shield" | "agency";

export type PlanLimits = {
  id: PlanTier;
  label: string;
  monthlyScans: number | null;
  maxProducts: number;
  weeklyDigest: boolean;
  sopGenerator: boolean;
  taskBoard: boolean;
  auditTrail: boolean;
  pdfExport: boolean;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  radar: {
    id: "radar",
    label: "Radar",
    monthlyScans: 5,
    maxProducts: 1,
    weeklyDigest: false,
    sopGenerator: false,
    taskBoard: false,
    auditTrail: false,
    pdfExport: false,
  },
  guard: {
    id: "guard",
    label: "Guard",
    monthlyScans: 30,
    maxProducts: 3,
    weeklyDigest: false,
    sopGenerator: false,
    taskBoard: true,
    auditTrail: true,
    pdfExport: true,
  },
  shield: {
    id: "shield",
    label: "Shield",
    monthlyScans: null,
    maxProducts: 15,
    weeklyDigest: true,
    sopGenerator: true,
    taskBoard: true,
    auditTrail: true,
    pdfExport: true,
  },
  agency: {
    id: "agency",
    label: "Agency",
    monthlyScans: null,
    maxProducts: 50,
    weeklyDigest: true,
    sopGenerator: true,
    taskBoard: true,
    auditTrail: true,
    pdfExport: true,
  },
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function resolvePlanTier(subscription: { plan?: string | null; status?: string | null } | null): PlanTier {
  if (!subscription?.plan || !subscription.status || !ACTIVE_STATUSES.has(subscription.status)) {
    return "radar";
  }
  if (subscription.plan.startsWith("growth")) return "guard";
  if (subscription.plan.startsWith("team")) return "shield";
  if (subscription.plan.startsWith("agency")) return "agency";
  return "radar";
}

export function currentUsagePeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatScanLimit(plan: PlanLimits, used: number) {
  if (plan.monthlyScans === null) return `${used} scans this month · unlimited plan`;
  return `${used}/${plan.monthlyScans} scans used this month`;
}

export function formatProductLimit(plan: PlanLimits, used: number) {
  return `${used}/${plan.maxProducts} products`;
}

export const PUBLIC_BETA = true;