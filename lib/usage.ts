import { currentUsagePeriod, PLAN_LIMITS, resolvePlanTier, type PlanTier } from "@/lib/planLimits";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type UsageSnapshot = {
  plan: PlanTier;
  periodKey: string;
  claimScansUsed: number;
  productCount: number;
  limits: (typeof PLAN_LIMITS)[PlanTier];
  scansRemaining: number | null;
  productsRemaining: number;
  canScan: boolean;
  canAddProduct: boolean;
};

export async function getUserSubscription(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("billing_subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const periodKey = currentUsagePeriod();
  const subscription = await getUserSubscription(userId);
  const plan = resolvePlanTier(subscription);
  const limits = PLAN_LIMITS[plan];
  const admin = getSupabaseAdmin();

  let claimScansUsed = 0;
  let productCount = 0;

  if (admin) {
    const [{ data: usage }, { count }] = await Promise.all([
      admin.from("usage_counters").select("claim_scans").eq("user_id", userId).eq("period_key", periodKey).maybeSingle(),
      admin.from("products").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    claimScansUsed = usage?.claim_scans ?? 0;
    productCount = count ?? 0;
  }

  const scansRemaining = limits.monthlyScans === null ? null : Math.max(0, limits.monthlyScans - claimScansUsed);
  const productsRemaining = Math.max(0, limits.maxProducts - productCount);

  return {
    plan,
    periodKey,
    claimScansUsed,
    productCount,
    limits,
    scansRemaining,
    productsRemaining,
    canScan: limits.monthlyScans === null || claimScansUsed < limits.monthlyScans,
    canAddProduct: productCount < limits.maxProducts,
  };
}

export async function incrementClaimScans(userId: string, amount = 1) {
  const admin = getSupabaseAdmin();
  if (!admin || amount <= 0) return;
  const periodKey = currentUsagePeriod();
  const { data: existing } = await admin
    .from("usage_counters")
    .select("claim_scans")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .maybeSingle();

  const nextCount = (existing?.claim_scans ?? 0) + amount;
  await admin.from("usage_counters").upsert({
    user_id: userId,
    period_key: periodKey,
    claim_scans: nextCount,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,period_key" });
}

export async function reserveClaimScans(userId: string, amount = 1): Promise<{ allowed: boolean; snapshot: UsageSnapshot }> {
  const periodKey = currentUsagePeriod();
  const subscription = await getUserSubscription(userId);
  const plan = resolvePlanTier(subscription);
  const limits = PLAN_LIMITS[plan];
  const admin = getSupabaseAdmin();

  if (!admin || amount <= 0) {
    const snapshot = await getUsageSnapshot(userId);
    const allowed = limits.monthlyScans === null || snapshot.claimScansUsed + amount <= (limits.monthlyScans ?? 0);
    return { allowed, snapshot };
  }

  const { data, error } = await admin.rpc("increment_claim_scans_if_allowed", {
    p_user_id: userId,
    p_period_key: periodKey,
    p_amount: amount,
    p_max_scans: limits.monthlyScans,
  });

  if (error) {
    const snapshot = await getUsageSnapshot(userId);
    if (!snapshot.canScan || (limits.monthlyScans !== null && snapshot.claimScansUsed + amount > limits.monthlyScans)) {
      return { allowed: false, snapshot };
    }
    await incrementClaimScans(userId, amount);
    return { allowed: true, snapshot: await getUsageSnapshot(userId) };
  }

  return { allowed: Boolean(data), snapshot: await getUsageSnapshot(userId) };
}

export async function releaseClaimScans(userId: string, amount = 1) {
  const admin = getSupabaseAdmin();
  if (!admin || amount <= 0) return;
  const periodKey = currentUsagePeriod();
  const { data: existing } = await admin
    .from("usage_counters")
    .select("claim_scans")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .maybeSingle();
  if (!existing) return;
  const nextCount = Math.max(0, existing.claim_scans - amount);
  await admin.from("usage_counters").update({
    claim_scans: nextCount,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("period_key", periodKey);
}

export async function assertCanScan(userId: string, amount = 1) {
  const snapshot = await getUsageSnapshot(userId);
  if (!snapshot.canScan) {
    return {
      allowed: false as const,
      snapshot,
      message: `Monthly scan limit reached (${snapshot.limits.monthlyScans}/month on ${snapshot.limits.label}). Upgrade to continue.`,
    };
  }
  if (snapshot.limits.monthlyScans !== null && snapshot.claimScansUsed + amount > snapshot.limits.monthlyScans) {
    return {
      allowed: false as const,
      snapshot,
      message: `This action needs ${amount} scan${amount === 1 ? "" : "s"}, but only ${snapshot.scansRemaining ?? 0} remain on ${snapshot.limits.label}.`,
    };
  }
  return { allowed: true as const, snapshot };
}

export async function assertCanAddProduct(userId: string) {
  const snapshot = await getUsageSnapshot(userId);
  if (!snapshot.canAddProduct) {
    return {
      allowed: false as const,
      snapshot,
      message: `Product limit reached (${snapshot.limits.maxProducts} on ${snapshot.limits.label}). Upgrade to add more products.`,
    };
  }
  return { allowed: true as const, snapshot };
}