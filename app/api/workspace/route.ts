import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { admin, user } = auth;
  if (!admin) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const [productsResult, claimsResult, tasksResult, regulationsResult, auditResult] = await Promise.all([
    admin
      .from("products")
      .select("id, name, category, market, platforms, ingredients, claims_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("claims")
      .select("id, original_text, context_type, risk_level, risk_score, risky_phrases, explanation, safer_rewrite, checklist, sources, status, created_at, product_id, products(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    admin.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("regulation_updates").select("*").order("date_found", { ascending: false }).limit(50),
    admin.from("audit_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);

  return NextResponse.json({
    products: productsResult.data ?? [],
    claims: claimsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    regulations: regulationsResult.data ?? [],
    auditEvents: auditResult.data ?? [],
    errors: {
      products: productsResult.error?.message ?? null,
      claims: claimsResult.error?.message ?? null,
      tasks: tasksResult.error?.message ?? null,
      regulations: regulationsResult.error?.message ?? null,
      auditEvents: auditResult.error?.message ?? null,
    },
  });
}