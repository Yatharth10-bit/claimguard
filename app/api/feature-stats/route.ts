import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const [{ data: listings }, { data: scans }, { data: posts }, { data: labels }, { data: substantiation }, { data: competitors }] = await Promise.all([
    supabase.from("amazon_listings").select("id").eq("user_id", user.id),
    supabase.from("amazon_scan_results").select("overall_risk, amazon_listing_id, amazon_listings!inner(user_id)").eq("amazon_listings.user_id", user.id),
    supabase.from("social_posts").select("scan_status, social_connections!inner(user_id)").eq("social_connections.user_id", user.id),
    supabase.from("label_scans").select("id").eq("user_id", user.id),
    supabase.from("substantiation_entries").select("id").eq("user_id", user.id).is("deleted_at", null),
    supabase.from("competitor_trackers").select("id").eq("user_id", user.id).eq("is_active", true),
  ]);

  const listingIds = new Set((listings || []).map((l) => l.id));
  const highRiskListingIds = new Set<string>();
  for (const scan of scans || []) {
    if (scan.overall_risk === "high" && listingIds.has(scan.amazon_listing_id as string)) {
      highRiskListingIds.add(scan.amazon_listing_id as string);
    }
  }

  const flaggedPosts = (posts || []).filter((p) => p.scan_status === "flagged").length;

  return NextResponse.json({
    amazon: {
      listings: listings?.length || 0,
      high_risk: highRiskListingIds.size,
    },
    social: {
      scanned: posts?.length || 0,
      flagged: flaggedPosts,
    },
    labels: labels?.length || 0,
    substantiation: substantiation?.length || 0,
    competitors: competitors?.length || 0,
  });
}