import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const [{ data: listings }, { data: scans }, { data: socialScans }, { data: labels }, { data: substantiation }, { data: competitors }] = await Promise.all([
    admin.from("amazon_listings").select("id").eq("user_id", user.id),
    admin.from("amazon_scan_results").select("overall_risk, amazon_listing_id, amazon_listings!inner(user_id)").eq("amazon_listings.user_id", user.id),
    admin.from("social_intelligence_scans").select("high_risk_posts_count").eq("user_id", user.id),
    admin.from("label_scans").select("id").eq("user_id", user.id),
    admin.from("substantiation_entries").select("id").eq("user_id", user.id).is("deleted_at", null),
    admin.from("competitor_trackers").select("id").eq("user_id", user.id).eq("is_active", true),
  ]);

  const listingIds = new Set((listings || []).map((l) => l.id));
  const highRiskListingIds = new Set<string>();
  for (const scan of scans || []) {
    if (scan.overall_risk === "high" && listingIds.has(scan.amazon_listing_id as string)) {
      highRiskListingIds.add(scan.amazon_listing_id as string);
    }
  }

  const socialHighRisk = (socialScans || []).reduce((sum, s) => sum + (s.high_risk_posts_count || 0), 0);

  return NextResponse.json({
    amazon: {
      listings: listings?.length || 0,
      high_risk: highRiskListingIds.size,
    },
    social: {
      scanned: socialScans?.length || 0,
      flagged: socialHighRisk,
    },
    labels: labels?.length || 0,
    substantiation: substantiation?.length || 0,
    competitors: competitors?.length || 0,
  });
}