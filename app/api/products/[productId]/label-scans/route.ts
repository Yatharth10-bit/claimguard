import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { fetchOwnedProduct } from "@/lib/ownedProduct";
import { scanLabelText } from "@/lib/labelScanner";

type Params = { params: Promise<{ productId: string }> };

const createSchema = z.object({
  extracted_text: z.string().trim().min(20).max(50000),
  file_name: z.string().trim().max(255).optional().default("pasted-label.txt"),
  file_url: z.string().trim().max(2000).optional().default(""),
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
    .from("label_scans")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scans: data || [] });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { productId } = await params;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid label input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { product, error: productError } = await fetchOwnedProduct(
    admin,
    user.id,
    productId,
    "id, category, ingredients, market",
  );
  if (productError) return NextResponse.json({ error: productError }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const result = scanLabelText(parsed.data.extracted_text, {
    category: product.category || "Dietary Supplement",
    ingredients: product.ingredients || [],
    market: product.market || "United States FDA + FTC",
  });

  const scannedAt = new Date().toISOString();

  const { data, error } = await admin
    .from("label_scans")
    .insert({
      user_id: user.id,
      product_id: productId,
      file_url: parsed.data.file_url || "text://paste",
      file_name: parsed.data.file_name,
      extracted_text: parsed.data.extracted_text,
      supplement_facts_raw: result.supplement_facts_raw,
      issues: result.issues,
      claims_found: result.claims_found,
      overall_risk: result.overall_risk,
      scanned_at: scannedAt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (result.overall_risk === "high") {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "label_scan_high_risk",
      title: "Label scan high risk",
      body: "A label scan found high-risk claims or missing disclaimers.",
      link: `/products/${productId}?tab=label`,
    });
  }

  return NextResponse.json({ scan: data });
}