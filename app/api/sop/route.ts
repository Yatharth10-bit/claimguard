import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCopilotContext } from "@/lib/complianceCopilot";
import { generateComplianceSop } from "@/lib/sopGenerator";
import { getUsageSnapshot } from "@/lib/usage";
import { getSupabaseServer } from "@/lib/supabase/server";

const contextTypes = ["Label", "Website", "Amazon listing", "Ad copy", "Social media", "Influencer script"] as const;

const inputSchema = z.object({
  claimText: z.string().trim().min(3).max(5000),
  productCategory: z.string().trim().min(1).max(100),
  ingredients: z.array(z.string().trim().min(1).max(200)).max(200).default([]),
  market: z.string().trim().min(1).max(200),
  contextType: z.enum(contextTypes),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  riskyPhrases: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  saferRewrite: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const usage = await getUsageSnapshot(user.id);
  if (!usage.limits.sopGenerator) {
    return NextResponse.json({
      error: "SOP generator is available on Shield and Agency plans.",
      usage,
      upgradeRequired: true,
    }, { status: 402 });
  }

  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid SOP request.", details: parsed.error.flatten() }, { status: 400 });

  const context = buildCopilotContext(parsed.data);
  return NextResponse.json({ sop: generateComplianceSop(context), provider: "rules" });
}