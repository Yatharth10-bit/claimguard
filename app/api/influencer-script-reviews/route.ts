import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { fetchOwnedProduct } from "@/lib/ownedProduct";
import { reviewInfluencerScript } from "@/lib/influencerScanner";

const createSchema = z.object({
  product_id: z.string().uuid(),
  raw_script: z.string().trim().min(10).max(50000),
  influencer_handle: z.string().trim().max(100).optional().nullable(),
  influencer_brief_id: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid script input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { product, error: productError } = await fetchOwnedProduct(
    admin,
    user.id,
    parsed.data.product_id,
    "id, category, ingredients, market",
  );
  if (productError) return NextResponse.json({ error: productError }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const review = reviewInfluencerScript(parsed.data.raw_script, {
    category: product.category || "Dietary Supplement",
    ingredients: product.ingredients || [],
    market: product.market || "United States FDA + FTC",
  });

  const { data, error } = await admin
    .from("influencer_script_reviews")
    .insert({
      user_id: user.id,
      product_id: parsed.data.product_id,
      influencer_brief_id: parsed.data.influencer_brief_id || null,
      influencer_handle: parsed.data.influencer_handle || null,
      raw_script: parsed.data.raw_script,
      overall_risk: review.overall_risk,
      issues: review.issues,
      clean_script: review.clean_script,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (review.overall_risk === "high") {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "influencer_script_high_risk",
      title: "Influencer script high risk",
      body: "A submitted script was flagged with high-risk claims.",
      link: `/products/${parsed.data.product_id}?tab=influencer`,
    });
  }

  return NextResponse.json({ review: data });
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id required." }, { status: 400 });

  const { product, error: productError } = await fetchOwnedProduct(admin, user.id, productId, "id");
  if (productError) return NextResponse.json({ error: productError }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const { data, error } = await admin
    .from("influencer_script_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data || [] });
}