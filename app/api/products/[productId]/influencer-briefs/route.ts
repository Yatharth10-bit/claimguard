import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { fetchOwnedProduct } from "@/lib/ownedProduct";
import { generateInfluencerBrief } from "@/lib/influencerScanner";

type Params = { params: Promise<{ productId: string }> };

const createSchema = z.object({
  platform: z.string().trim().min(2).max(20),
  campaign_name: z.string().trim().max(255).optional().default(""),
});

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { productId } = await params;
  const { product, error: productError } = await fetchOwnedProduct(admin, user.id, productId, "id");
  if (productError) return NextResponse.json({ error: productError }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const { data, error } = await admin
    .from("influencer_briefs")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ briefs: data || [] });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { productId } = await params;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid brief input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { product, error: productError } = await fetchOwnedProduct(
    admin,
    user.id,
    productId,
    "id, name, category, market",
  );
  if (productError) return NextResponse.json({ error: productError }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const brief = generateInfluencerBrief({
    productName: product.name || "Product",
    category: product.category || "Dietary Supplement",
    market: product.market || "United States FDA + FTC",
    platform: parsed.data.platform,
    campaignName: parsed.data.campaign_name,
  });

  const { data, error } = await admin
    .from("influencer_briefs")
    .insert({
      user_id: user.id,
      product_id: productId,
      platform: parsed.data.platform,
      campaign_name: parsed.data.campaign_name || product.name || "",
      do_say: brief.do_say,
      dont_say: brief.dont_say,
      required_disclaimers: brief.required_disclaimers,
      generated_brief_text: brief.generated_brief_text,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brief: data });
}