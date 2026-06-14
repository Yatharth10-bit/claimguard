import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { admin } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data, error } = await admin
    .from("claim_feedback")
    .select("*, claim_check_results(claim_text, risk_level)")
    .eq("reviewed", false)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data || [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { admin } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const body = await request.json();
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

  const { error } = await admin.from("claim_feedback").update({ reviewed: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}