import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { runClaimEvaluation } from "@/lib/claimIntelligence/evaluation";
import { CLAIM_PROMPT_VERSION, CLAIM_RULES_VERSION } from "@/lib/claimIntelligence/versions";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.CLAIMGUARD_CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const report = runClaimEvaluation(500);
  const admin = getSupabaseAdmin();

  if (admin) {
    await admin.from("model_evaluation_runs").insert({
      run_type: report.runType,
      dataset_version: report.datasetVersion,
      rule_version: CLAIM_RULES_VERSION,
      prompt_version: CLAIM_PROMPT_VERSION,
      total_examples: report.totalExamples,
      accuracy_estimate: report.accuracyEstimate,
      false_positive_rate: report.falsePositiveRate,
      false_negative_rate: report.falseNegativeRate,
      rewrite_quality_score: report.rewriteQualityScore,
      sector_breakdown: report.sectorBreakdown,
      risk_category_breakdown: report.riskCategoryBreakdown,
      notes: report.notes,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, report });
}