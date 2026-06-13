import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { fetchOwnedProduct } from "@/lib/ownedProduct";

type Params = { params: Promise<{ productId: string }> };

const evidenceTypes = [
  "clinical_study",
  "meta_analysis",
  "in_house_test",
  "regulatory_guidance",
  "expert_opinion",
] as const;

const createSchema = z.object({
  claim_text: z.string().trim().min(3).max(5000),
  evidence_type: z.enum(evidenceTypes),
  evidence_title: z.string().trim().max(500).default(""),
  evidence_url: z.string().trim().max(2000).optional().nullable(),
  file_url: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(10000).default(""),
  approved_by: z.string().trim().max(255).optional().nullable(),
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
    .from("substantiation_entries")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data || [] });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { productId } = await params;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entry input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { product, error: productError } = await fetchOwnedProduct(admin, user.id, productId, "id");
  if (productError) return NextResponse.json({ error: productError }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const { data, error } = await admin
    .from("substantiation_entries")
    .insert({
      user_id: user.id,
      product_id: productId,
      claim_text: parsed.data.claim_text,
      evidence_type: parsed.data.evidence_type,
      evidence_title: parsed.data.evidence_title,
      evidence_url: parsed.data.evidence_url || null,
      file_url: parsed.data.file_url || null,
      notes: parsed.data.notes,
      approved_by: parsed.data.approved_by || null,
      approved_at: parsed.data.approved_by ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}