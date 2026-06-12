import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeClaim } from "@/lib/analyzeClaim";
import { assertCanScan, incrementClaimScans } from "@/lib/usage";
import { splitClaimLikeSentences } from "@/lib/workflow";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseServer } from "@/lib/supabase/server";

const contextTypes = ["Label", "Website", "Amazon listing", "Ad copy", "Social media", "Influencer script"] as const;

const inputSchema = z.object({
  copy: z.string().trim().min(3).max(20000),
  productCategory: z.string().trim().min(1).max(100),
  ingredients: z.array(z.string().trim().min(1).max(200)).max(200).default([]),
  market: z.string().trim().min(1).max(200),
  contextType: z.enum(contextTypes),
});

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid scan input.", details: parsed.error.flatten() }, { status: 400 });

    const sentences = splitClaimLikeSentences(parsed.data.copy);
    if (!sentences.length) return NextResponse.json({ error: "No claim-like sentences found in this copy." }, { status: 400 });

    const burst = checkRateLimit(`${user.id}:burst`, 40, 60_000);
    if (!burst.allowed) return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });

    const gate = await assertCanScan(user.id, sentences.length);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.message, usage: gate.snapshot, upgradeRequired: true }, { status: 402 });
    }

    const analyses = sentences.map((claimText) => {
      const result = analyzeClaim({
        claimText,
        productCategory: parsed.data.productCategory,
        ingredients: parsed.data.ingredients,
        market: parsed.data.market,
        contextType: parsed.data.contextType,
      });
      return {
        originalClaim: claimText,
        contextType: parsed.data.contextType,
        ...result,
      };
    });

    await incrementClaimScans(user.id, sentences.length);

    return NextResponse.json({
      analyses,
      scanned: sentences.length,
      usage: await import("@/lib/usage").then((mod) => mod.getUsageSnapshot(user.id)),
      provider: "rules",
    });
  } catch {
    return NextResponse.json({ error: "Unable to scan this copy right now." }, { status: 500 });
  }
}