import { NextResponse } from "next/server";
import { buildWeeklyDigest } from "@/lib/weeklyDigest";
import { getUsageSnapshot } from "@/lib/usage";
import { getSupabaseServer } from "@/lib/supabase/server";
import { loadBrandProfileServer } from "@/lib/brandProfileServer";

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const usage = await getUsageSnapshot(user.id);
  if (!usage.limits.weeklyDigest) {
    return NextResponse.json({
      error: "Weekly digest is available on Shield and Agency plans.",
      usage,
      upgradeRequired: true,
    }, { status: 402 });
  }

  const [{ data: products }, { data: claims }, { data: regulations }, profile] = await Promise.all([
    supabase.from("products").select("id, name, category, claims_text").eq("user_id", user.id),
    supabase.from("claims").select("id, original_text, risk_level, risky_phrases, status, created_at, product_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40),
    supabase.from("regulation_updates").select("id, organization, category, title, summary, official_url").order("date_found", { ascending: false }).limit(12),
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