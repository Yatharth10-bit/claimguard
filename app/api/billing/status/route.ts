import { NextResponse } from "next/server";
import { getUsageSnapshot } from "@/lib/usage";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ configured: false, subscription: null, usage: null });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const [{ data: subscription }, usage] = await Promise.all([
    supabase.from("billing_subscriptions").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    getUsageSnapshot(user.id),
  ]);

  return NextResponse.json({
    configured: Boolean(process.env.DODO_PAYMENTS_API_KEY),
    subscription: subscription || null,
    usage,
  });
}