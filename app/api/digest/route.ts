import { NextResponse } from "next/server";
import { buildWeeklyDigest } from "@/lib/weeklyDigest";
import { getUsageSnapshot } from "@/lib/usage";
import { requireUser } from "@/lib/apiAuth";
import { loadBrandProfileServer } from "@/lib/brandProfileServer";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const usage = await getUsageSnapshot(user.id);
  if (!usage.limits.weeklyDigest) {
    return NextResponse.json({
      error: "Weekly digest is available on Shield and Agency plans.",
      usage,
      upgradeRequired: true,
    }, { status: 402 });
  }

  const [{ data: products }, { data: claims }, { data: regulations }, profile] = await Promise.all([
    admin.from("products").select("id, name, category, claims_text").eq("user_id", user.id),
    admin.from("claims").select("id, original_text, risk_level, risky_phrases, status, created_at, product_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40),
    admin.from("regulation_updates").select("id, organization, category, title, summary, official_url").order("date_found", { ascending: false }).limit(12),
    loadBrandProfileServer(user.id),
  ]);

  const productNames = new Map((products || []).map((row) => [row.id, row.name]));

  const digest = buildWeeklyDigest({
    profile: profile || {
      brandName: "",
      sector: "",
      productType: "",
      commonClaims: "",
      ingredients: "",
      salesRegions: ["United States"],
      salesChannels: [],
      mainConcern: "",
      complianceLevel: "",
      firstClaim: "",
      onboardingCompleted: false,
      createdAt: "",
      updatedAt: "",
    },
    products: (products || []).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      claims: row.claims_text || "",
    })),
    claims: (claims || []).map((row) => ({
      id: row.id,
      product: productNames.get(row.product_id) || "Unassigned",
      originalClaim: row.original_text,
      riskLevel: row.risk_level,
      riskyPhrases: row.risky_phrases || [],
      status: row.status,
      date: row.created_at,
    })),
    regulations: (regulations || []).map((row) => ({
      id: row.id,
      organization: row.organization,
      category: row.category,
      title: row.title,
      summary: row.summary,
      officialUrl: row.official_url,
    })),
  });

  return NextResponse.json({ digest, generatedAt: new Date().toISOString(), usage });
}