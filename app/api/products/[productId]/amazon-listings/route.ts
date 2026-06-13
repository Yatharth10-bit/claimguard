import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { fetchOwnedProduct } from "@/lib/ownedProduct";

type Params = { params: Promise<{ productId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { productId } = await params;

  const { product, error: productError } = await fetchOwnedProduct(admin, user.id, productId, "id");
  if (productError) return NextResponse.json({ error: productError }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const { data: listings, error } = await admin
    .from("amazon_listings")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const listingIds = (listings || []).map((l) => l.id);
  let latestScans: Record<string, unknown> = {};

  if (listingIds.length) {
    const { data: scans } = await admin
      .from("amazon_scan_results")
      .select("*")
      .in("amazon_listing_id", listingIds)
      .order("scanned_at", { ascending: false });

    for (const scan of scans || []) {
      const key = scan.amazon_listing_id as string;
      if (!latestScans[key]) latestScans[key] = scan;
    }
  }

  return NextResponse.json({
    listings: (listings || []).map((listing) => ({
      ...listing,
      latest_scan: latestScans[listing.id] || null,
    })),
  });
}