import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY) return NextResponse.json({ error: "Dodo Payments webhook is not configured." }, { status: 503 });
  const { Webhooks } = await import("@dodopayments/nextjs");
  return Webhooks({
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
    onPayload: async (payload) => {
      if (!payload.type.startsWith("subscription.")) return;
      const data = payload.data as Record<string, any>;
      const userId = data.metadata?.supabase_user_id || data.customer?.metadata?.supabase_user_id;
      if (!userId || !data.subscription_id) return;
      const admin = getSupabaseAdmin();
      if (!admin) return;
      await admin.from("billing_subscriptions").upsert({
        user_id: userId,
        customer_id: data.customer?.customer_id,
        subscription_id: data.subscription_id,
        product_id: data.product_id,
        plan: data.metadata?.plan || data.product_id,
        status: data.status,
        currency: data.currency,
        next_billing_date: data.next_billing_date || null,
        cancel_at_next_billing_date: Boolean(data.cancel_at_next_billing_date),
        updated_at: new Date().toISOString(),
      }, { onConflict: "subscription_id" });
    },
  })(request);
}
