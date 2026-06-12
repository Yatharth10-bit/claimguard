import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getDodoClient } from "@/lib/dodo";

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data } = await supabase.from("billing_subscriptions").select("customer_id").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!data?.customer_id) return NextResponse.json({ error: "No Dodo Payments customer was found for this account." }, { status: 404 });

  try {
    const portal = await getDodoClient().customers.customerPortal.create(data.customer_id, { return_url: `${new URL(request.url).origin}/settings` });
    return NextResponse.json({ portalUrl: portal.link });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open billing portal." }, { status: 500 });
  }
}

