import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseServer } from "@/lib/supabase/server";
import { syncRegulations } from "@/lib/syncRegulations";

export async function POST() {
  const supabase = await getSupabaseServer();
  let rateLimitKey = "development-regulation-sync";
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    rateLimitKey = user.id;
  } else if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const limit = checkRateLimit(`regulations:${rateLimitKey}`, 3, 5 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Official sources were synced recently. Please try again in a few minutes." }, { status: 429 });

  try {
    return NextResponse.json(await syncRegulations());
  } catch {
    return NextResponse.json({ error: "Unable to sync official regulation sources right now." }, { status: 500 });
  }
}
