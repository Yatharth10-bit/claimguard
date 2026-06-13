import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { assertCanAddProduct } from "@/lib/usage";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  market: z.string().trim().min(1).max(200),
  platforms: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  ingredients: z.array(z.string().trim().min(1).max(200)).max(200).default([]),
  claims: z.string().max(20000).default(""),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product input.", details: parsed.error.flatten() }, { status: 400 });

  const gate = await assertCanAddProduct(user.id);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.message, usage: gate.snapshot, upgradeRequired: true }, { status: 402 });
  }

  const { data, error } = await admin.from("products").insert({
    user_id: user.id,
    name: parsed.data.name,
    category: parsed.data.category,
    market: parsed.data.market,
    platforms: parsed.data.platforms,
    ingredients: parsed.data.ingredients,
    claims_text: parsed.data.claims,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data, usage: gate.snapshot });
}