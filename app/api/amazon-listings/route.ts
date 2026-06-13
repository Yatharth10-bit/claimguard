import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { fetchOwnedProduct } from "@/lib/ownedProduct";

const createSchema = z.object({
  product_id: z.string().uuid(),
  asin: z.string().trim().max(20).optional().nullable(),
  marketplace: z.string().trim().min(2).max(10).default("US"),
  title: z.string().trim().max(5000).default(""),
  bullet_points: z.array(z.string().trim().max(2000)).max(10).default([]),
  description: z.string().trim().max(20000).default(""),
  backend_keywords: z.string().trim().max(5000).optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listing input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { product, error: productError } = await fetchOwnedProduct(admin, user.id, parsed.data.product_id, "id");
  if (productError) return NextResponse.json({ error: productError }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const { data, error } = await admin
    .from("amazon_listings")
    .insert({
      user_id: user.id,
      product_id: parsed.data.product_id,
      asin: parsed.data.asin || null,
      marketplace: parsed.data.marketplace,
      title: parsed.data.title,
      bullet_points: parsed.data.bullet_points,
      description: parsed.data.description,
      backend_keywords: parsed.data.backend_keywords || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listing: data });
}