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
  riskyPhrases: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  saferRewrite: z.string().optional(),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    organization: z.string().optional(),
    category: z.string().optional(),
  })).optional(),
});

const regulationSchema = z.object({
  action: z.literal("regulation_impact"),
  regulation: z.object({
    id: z.string(),
    organization: z.string(),
    category: z.string(),
    title: z.string(),
    summary: z.string(),
    officialUrl: z.string(),
  }),
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    claims: z.string(),
  })),
  claims: z.array(z.object({
    id: z.string(),
    product: z.string(),
    originalClaim: z.string(),
    riskLevel: z.enum(["low", "medium", "high"]),
    riskyPhrases: z.array(z.string()),
    status: z.string(),
    date: z.string(),
  })),
});

const inputSchema = z.union([claimSchema, regulationSchema]);

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid copilot request.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const limit = checkRateLimit(`${user.id}:copilot`, Number(process.env.COPILOT_RATE_LIMIT || 30));
        if (!limit.allowed) {
          return NextResponse.json({ error: "Too many copilot requests. Please try again shortly." }, { status: 429 });
        }
      }
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