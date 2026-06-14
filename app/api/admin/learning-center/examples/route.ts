import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "edit"]),
  risk_level: z.enum(["low", "medium", "high"]).optional(),
  risk_reason: z.string().max(2000).optional(),
  safer_rewrite: z.string().max(5000).optional(),
  promote_to_rule: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { admin } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, action, risk_level, risk_reason, safer_rewrite, promote_to_rule } = parsed.data;

  if (action === "reject") {
    const { error } = await admin.from("claim_examples").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "rejected" });
  }

  const update: Record<string, unknown> = {
    reviewed: true,
    updated_at: new Date().toISOString(),
  };
  if (action === "approve") {
    update.approved_for_production = true;
    update.confidence_score = 90;
  }
  if (risk_level) update.risk_level = risk_level;
  if (risk_reason) update.risk_reason = risk_reason;
  if (safer_rewrite) update.safer_rewrite = safer_rewrite;

  const { data, error } = await admin.from("claim_examples").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (promote_to_rule && data) {
    await admin.from("claim_rules").insert({
      sector: data.sector,
      region: data.region,
      pattern: data.claim_text.slice(0, 200),
      risk_category: data.risk_category,
      severity: data.risk_level,
      explanation: data.risk_reason,
      safer_alternative_pattern: data.safer_rewrite,
      source: "admin_promoted",
      active: false,
      version: "2.0.0",
    });
  }

  return NextResponse.json({ ok: true, example: data });
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { admin } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const url = new URL(request.url);
  const pending = url.searchParams.get("pending") === "true";

  let query = admin.from("claim_examples").select("*").order("created_at", { ascending: false }).limit(50);
  if (pending) query = query.eq("reviewed", false).eq("approved_for_production", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ examples: data || [] });
}