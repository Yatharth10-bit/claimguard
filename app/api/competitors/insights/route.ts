import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { loadBrandProfileServer } from "@/lib/brandProfileServer";
import { isOnboardingComplete } from "@/lib/brandProfile";
import {
  buildClaimRiskComparison,
  getRecommendedNextAction,
  getSectorInsights,
} from "@/lib/competitorInsights";
import { getSuggestedCompetitors } from "@/lib/competitorSuggestions";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const profile = await loadBrandProfileServer(user.id);
  const onboardingComplete = isOnboardingComplete(profile);
  const sector = profile?.sector || "";
  const sectorInsight = getSectorInsights(sector || "Other");

  const [{ data: claims }, { data: trackers }, { data: snapshots }] = await Promise.all([
    admin.from("claims").select("risk_level").eq("user_id", user.id),
    admin.from("competitor_trackers").select("id").eq("user_id", user.id).eq("is_active", true),
    admin
      .from("competitor_snapshots")
      .select("high_risk_claims, competitor_trackers!inner(user_id)")
      .eq("competitor_trackers.user_id", user.id)
      .order("captured_at", { ascending: false })
      .limit(20),
  ]);

  const userHighRisk = (claims || []).filter((c) => c.risk_level === "high").length;
  const userMediumRisk = (claims || []).filter((c) => c.risk_level === "medium").length;
  let competitorHighRisk = 0;
  for (const snap of snapshots || []) {
    const hr = Array.isArray(snap.high_risk_claims) ? snap.high_risk_claims.length : 0;
    competitorHighRisk = Math.max(competitorHighRisk, hr);
  }

  const comparison = buildClaimRiskComparison({
    profile,
    userHighRisk,
    userMediumRisk,
    userTotalClaims: claims?.length || 0,
    competitorHighRisk,
    sectorInsight,
  });

  return NextResponse.json({
    onboardingComplete,
    profile: profile
      ? {
          brandName: profile.brandName,
          sector: profile.sector,
          salesRegions: profile.salesRegions,
          salesChannels: profile.salesChannels,
          mainConcern: profile.mainConcern,
        }
      : null,
    sectorInsight,
    suggestions: getSuggestedCompetitors(sector || "Other"),
    comparison,
    recommendedAction: getRecommendedNextAction(profile, (trackers?.length || 0) > 0),
    trackedCount: trackers?.length || 0,
    estimated: true,
  });
}