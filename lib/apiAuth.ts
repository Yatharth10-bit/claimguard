import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return { error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  return { supabase, user };
}