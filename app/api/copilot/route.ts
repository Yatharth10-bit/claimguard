import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildCopilotContext,
  explainClaimResult,
  explainRegulationImpact,
  guidedChannelRewrites,
  helpFixClaim,
} from "@/lib/complianceCopilot";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseServer } from "@/lib/supabase/server";

const contextTypes = ["Label", "Website", "Amazon listing", "Ad copy", "Social media", "Influencer script"] as const;

const claimSchema = z.object({
  action: z.enum(["explain", "fix", "channel_rewrites"]),
  claimText: z.string().trim().min(3).max(5000),
  productCategory: z.string().trim().min(1).max(100),
  ingredients: z.array(z.string().trim().min(1).max(200)).max(200).default([]),
  market: z.string().trim().min(1).max(200),
  contextType: z.enum(contextTypes),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  riskyPhrases: z.array(z.string().trim().max(500)).max(50).optional(),
  explanation: z.string().trim().max(10000).optional(),
  saferRewrite: z.string().trim().max(5000).optional(),
  sources: z.array(z.object({
    title: z.string().trim().max(300),
    url: z.string().trim().max(2000),
    organization: z.string().trim().max(200).optional(),
    category: z.string().trim().max(100).optional(),
  })).max(20).optional(),
});

const regulationSchema = z.object({
  action: z.literal("regulation_impact"),
  regulation: z.object({
    id: z.string().trim().max(100),
    organization: z.string().trim().max(200),
    category: z.string().trim().max(100),
    title: z.string().trim().max(500),
    summary: z.string().trim().max(5000),
    officialUrl: z.string().trim().max(2000),
  }),
  products: z.array(z.object({
    id: z.string().trim().max(100),
    name: z.string().trim().max(200),
    category: z.string().trim().max(100),
    claims: z.string().trim().max(20000),
  })).max(100),
  claims: z.array(z.object({
    id: z.string().trim().max(100),
    product: z.string().trim().max(200),
    originalClaim: z.string().trim().max(5000),
    riskLevel: z.enum(["low", "medium", "high"]),
    riskyPhrases: z.array(z.string().trim().max(500)).max(50),
    status: z.string().trim().max(100),
    date: z.string().trim().max(50),
  })).max(200),
});

const inputSchema = z.union([claimSchema, regulationSchema]);

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid copilot request.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const limit = await checkRateLimit(
      `${user.id}:copilot`,
      Number(process.env.COPILOT_RATE_LIMIT || 30),
    );
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many copilot requests. Please try again shortly." }, { status: 429 });
    }

    const input = parsed.data;

    if (input.action === "regulation_impact") {
      const result = explainRegulationImpact(input.regulation, input.products, input.claims);
      return NextResponse.json({ action: input.action, result, provider: "rules" });
    }

    const context = buildCopilotContext(input);
    if (input.action === "explain") {
      return NextResponse.json({ action: input.action, result: explainClaimResult(context), provider: "rules" });
    }
    if (input.action === "fix") {
      return NextResponse.json({ action: input.action, result: helpFixClaim(context), provider: "rules" });
    }

    return NextResponse.json({ action: input.action, result: guidedChannelRewrites(context), provider: "rules" });
  } catch {
    return NextResponse.json({ error: "Unable to process this copilot request right now." }, { status: 500 });
  }
}