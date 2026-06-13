import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeClaim } from "@/lib/analyzeClaim";
import { checkRateLimit } from "@/lib/rate-limit";
import { assertCanScan, getUsageSnapshot, releaseClaimScans, reserveClaimScans } from "@/lib/usage";
import { getSupabaseServer } from "@/lib/supabase/server";

const contextTypes = ["Label", "Website", "Amazon listing", "Ad copy", "Social media", "Influencer script"] as const;
const inputSchema = z.object({
  claimText: z.string().trim().min(3).max(5000),
  productId: z.string().uuid().nullable().optional(),
  productCategory: z.string().trim().min(1).max(100),
  ingredients: z.array(z.string().trim().min(1).max(200)).max(200),
  market: z.string().trim().min(1).max(200),
  contextType: z.enum(contextTypes),
  saveOnly: z.boolean().optional(),
});

function responseRow(input: z.infer<typeof inputSchema>, analysis: ReturnType<typeof analyzeClaim>) {
  return {
    id: crypto.randomUUID(),
    original_text: input.claimText,
    context_type: input.contextType,
    risk_level: analysis.riskLevel,
    risk_score: analysis.riskScore,
    risky_phrases: analysis.riskyPhrases,
    explanation: analysis.explanation,
    safer_rewrite: analysis.saferRewrite,
    sources: analysis.sourceReferences,
    checklist: analysis.checklist,
    status: analysis.riskLevel === "high" ? "expert_review_needed" : "needs_review",
    created_at: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid claim input.", details: parsed.error.flatten() }, { status: 400 });
    let input = parsed.data;
    const supabase = await getSupabaseServer();

    if (!supabase) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
      }
      const analysis = analyzeClaim(input);
      return NextResponse.json({
        analysis: responseRow(input, analysis),
        provider: "rules",
        saved: false,
        warning: "Development mode only: Supabase is unavailable. Save this analysis locally.",
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const burst = await checkRateLimit(`${user.id}:burst`, Number(process.env.ANALYSIS_RATE_LIMIT || 40), 60_000);
    if (!burst.allowed) return NextResponse.json({ error: "Too many analyses. Please try again shortly." }, { status: 429 });

    let reservedScan = false;
    if (!input.saveOnly) {
      const gate = await assertCanScan(user.id, 1);
      if (!gate.allowed) {
        return NextResponse.json({ error: gate.message, usage: gate.snapshot, upgradeRequired: true }, { status: 402 });
      }
      const reserve = await reserveClaimScans(user.id, 1);
      if (!reserve.allowed) {
        return NextResponse.json({
          error: `Monthly scan limit reached (${reserve.snapshot.limits.monthlyScans}/month on ${reserve.snapshot.limits.label}). Upgrade to continue.`,
          usage: reserve.snapshot,
          upgradeRequired: true,
        }, { status: 402 });
      }
      reservedScan = true;
    }

    if (input.productId) {
      const { data: product } = await supabase
        .from("products")
        .select("id, category, ingredients, market")
        .eq("id", input.productId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!product) {
        if (reservedScan) await releaseClaimScans(user.id, 1);
        return NextResponse.json({ error: "Product not found." }, { status: 404 });
      }
      input = {
        ...input,
        productCategory: product.category,
        ingredients: product.ingredients || [],
        market: product.market,
      };
    }

    const analysis = analyzeClaim(input);
    const row = responseRow(input, analysis);
    const { data, error } = await supabase.from("claims").insert({
      user_id: user.id,
      product_id: input.productId || null,
      original_text: row.original_text,
      context_type: row.context_type,
      risk_level: row.risk_level,
      risk_score: row.risk_score,
      risky_phrases: row.risky_phrases,
      explanation: row.explanation,
      safer_rewrite: row.safer_rewrite,
      checklist: row.checklist,
      sources: row.sources,
      status: row.status,
    }).select().single();

    if (error) {
      if (reservedScan) await releaseClaimScans(user.id, 1);
      const usage = await getUsageSnapshot(user.id);
      return NextResponse.json({
        analysis: row,
        provider: "rules",
        saved: false,
        warning: "Analysis completed but Supabase could not save it.",
        usage,
      });
    }

    const usage = await getUsageSnapshot(user.id);

    return NextResponse.json({ analysis: data, provider: "rules", saved: true, usage });
  } catch {
    return NextResponse.json({ error: "Unable to analyze this claim right now." }, { status: 500 });
  }
}