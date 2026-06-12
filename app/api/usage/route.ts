import { NextResponse } from "next/server";
import { getUsageSnapshot } from "@/lib/usage";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const usage = await getUsageSnapshot(user.id);
  return NextResponse.json({ usage });
}