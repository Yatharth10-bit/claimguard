import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getDodoClient, getDodoProductId } from "@/lib/dodo";

const inputSchema = z.object({
  plan: z.enum(["growth_monthly", "growth_annual", "team_monthly", "team_annual"]),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid billing plan." }, { status: 400 });

  try {
    const origin = new URL(request.url).origin;
    const checkout = await getDodoClient().checkoutSessions.create({
      product_cart: [{ product_id: getDodoProductId(parsed.data.plan), quantity: 1 }],
      customer: { email: user.email, name: String(user.user_metadata.full_name || user.email.split("@")[0]) },
      metadata: { supabase_user_id: user.id, plan: parsed.data.plan },
      return_url: process.env.DODO_PAYMENTS_RETURN_URL || `${origin}/settings?billing=success`,
      cancel_url: `${origin}/settings?billing=cancelled`,
    });
    if (!checkout.checkout_url) throw new Error("Dodo Payments did not return a checkout URL.");
    return NextResponse.json({ checkoutUrl: checkout.checkout_url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create checkout." }, { status: 500 });
  }
}

