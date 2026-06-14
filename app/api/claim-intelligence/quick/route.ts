import { NextResponse } from "next/server";
import { z } from "zod";
import { runClaimIntelligenceQuick } from "@/lib/claimIntelligence/engine";

const schema = z.object({
  claimText: z.string().trim().min(3).max(5000),
  productCategory: z.string().trim().min(1).max(100).default("Dietary Supplement"),
  market: z.string().trim().min(1).max(200).default("United States FDA + FTC"),
  contextType: z.string().trim().min(1).max(100).default("Website"),
  sector: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const quick = runClaimIntelligenceQuick({ ...parsed.data, ingredients: [] });
  return NextResponse.json({
    ...quick,
    provider: "claim-intelligence-quick",
    latency: "fast",
  });
}