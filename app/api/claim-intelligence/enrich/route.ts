import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { runClaimIntelligence } from "@/lib/claimIntelligence/engine";
import { fetchApprovedExamples, fetchActiveDbRules } from "@/lib/claimIntelligence/serverContext";
import type { DbExampleRow } from "@/lib/claimIntelligence/retrievalLayer";
import type { DbClaimRuleRow } from "@/lib/claimIntelligence/dbRulesLayer";
import { loadBrandProfileServer } from "@/lib/brandProfileServer";

const schema = z.object({
  claimText: z.string().trim().min(3).max(5000),
  productCategory: z.string().trim().min(1).max(100),
  ingredients: z.array(z.string()).max(200).optional().default([]),
  market: z.string().trim().min(1).max(200),
  contextType: z.string().trim().min(1).max(100),
  sector: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await loadBrandProfileServer(user.id);
  const sector = parsed.data.sector || profile?.sector || "";

  let dbExamples: DbExampleRow[] = [];
  let dbRules: DbClaimRuleRow[] = [];
  if (admin) {
    [dbExamples, dbRules] = await Promise.all([
      fetchApprovedExamples(admin, sector, 150),
      fetchActiveDbRules(admin, sector, 50),
    ]);
  }

  const result = runClaimIntelligence(
    { ...parsed.data, sector, ingredients: parsed.data.ingredients },
    { dbExamples, dbRules, skipCache: false },
  );

  return NextResponse.json({
    intelligence: result,
    provider: "claim-intelligence-enrich",
  });
}