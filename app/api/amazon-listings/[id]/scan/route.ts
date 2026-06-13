import { NextResponse } from "next/server";
import { AMAZON_POLICY_VERSION, scanAmazonListing } from "@/lib/amazonScanner";
import { requireUser } from "@/lib/apiAuth";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await params;

  const { data: listing } = await admin
    .from("amazon_listings")
    .select("*, products(category, ingredients, market)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const productRow = listing.products as { category: string; ingredients: string[]; market: string } | null;
  const product = {
    category: productRow?.category || "Dietary Supplement",
    ingredients: productRow?.ingredients || [],
    market: productRow?.market || "United States FDA + FTC",
  };

  const { data: labelScan } = await admin
    .from("label_scans")
    .select("claims_found")
    .eq("product_id", listing.product_id)
    .eq("user_id", user.id)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const labelClaims = Array.isArray(labelScan?.claims_found)
    ? (labelScan.claims_found as string[])
    : undefined;

  const result = scanAmazonListing({
    title: listing.title,
    bullet_points: (listing.bullet_points as string[]) || [],
    description: listing.description || "",
    backend_keywords: listing.backend_keywords,
    product,
    labelClaims,
  });

  const scannedAt = new Date().toISOString();

  const { data: scanRow, error: scanError } = await admin
    .from("amazon_scan_results")
    .insert({
      amazon_listing_id: listing.id,
      scanned_at: scannedAt,
      overall_risk: result.overall_risk,
      issues: result.issues,
      amazon_policy_version: AMAZON_POLICY_VERSION,
    })
    .select()
    .single();

  if (scanError) return NextResponse.json({ error: scanError.message }, { status: 500 });

  await admin
    .from("amazon_listings")
    .update({ last_scanned_at: scannedAt })
    .eq("id", listing.id);

  if (result.overall_risk === "high") {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "amazon_listing_high_risk",
      title: "Amazon listing high risk",
      body: `Listing "${listing.title.slice(0, 60) || listing.asin || "Untitled"}" flagged high risk.`,
      link: `/products/${listing.product_id}?tab=amazon&listing=${listing.id}`,
    });
  }

  return NextResponse.json({ scan: scanRow });
}