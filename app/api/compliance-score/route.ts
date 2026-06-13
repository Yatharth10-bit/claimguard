import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { calculateComplianceScore } from "@/lib/complianceScore";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const [
    { data: products },
    { data: claims },
    { data: tasks },
    { data: listings },
    { data: scans },
    { data: posts },
    { data: labels },
    { data: substantiation },
  ] = await Promise.all([
    admin.from("products").select("id").eq("user_id", user.id),
    admin.from("claims").select("risk_level").eq("user_id", user.id),
    admin.from("tasks").select("status").eq("user_id", user.id),
    admin.from("amazon_listings").select("id").eq("user_id", user.id),
    admin.from("amazon_scan_results").select("overall_risk, amazon_listing_id, amazon_listings!inner(user_id)").eq("amazon_listings.user_id", user.id),
    admin.from("social_posts").select("scan_status, social_connections!inner(user_id)").eq("social_connections.user_id", user.id),
    admin.from("label_scans").select("overall_risk").eq("user_id", user.id),
    admin.from("substantiation_entries").select("id").eq("user_id", user.id).is("deleted_at", null),
  ]);

  const listingIds = new Set((listings || []).map((l) => l.id));
  let amazonHighRisk = 0;
  const seenListings = new Set<string>();
  for (const scan of scans || []) {
    if (scan.overall_risk === "high" && listingIds.has(scan.amazon_listing_id as string) && !seenListings.has(scan.amazon_listing_id as string)) {
      seenListings.add(scan.amazon_listing_id as string);
      amazonHighRisk++;
    }
  }

  const result = calculateComplianceScore({
    products: products?.length || 0,
    highRiskClaims: (claims || []).filter((c) => c.risk_level === "high").length,
    mediumRiskClaims: (claims || []).filter((c) => c.risk_level === "medium").length,
    openTasks: (tasks || []).filter((t) => !["fixed", "approved"].includes(String(t.status).toLowerCase())).length,
    amazonHighRisk,
    socialFlagged: (posts || []).filter((p) => p.scan_status === "flagged").length,
    labelHighRisk: (labels || []).filter((l) => l.overall_risk === "high").length,
    substantiationEntries: substantiation?.length || 0,
    claimsCount: claims?.length || 0,
  });

  return NextResponse.json(result);
}