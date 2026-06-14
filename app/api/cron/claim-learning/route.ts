import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_LEARNING_SOURCES,
  generateSyntheticLearningBatch,
  runDailyRegulatorySync,
} from "@/lib/claimIntelligence/learningPipeline";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.CLAIMGUARD_CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const runStarted = new Date().toISOString();
  let claimsExtracted = 0;
  let highRisk = 0;
  let lowConfidence = 0;
  const errors: string[] = [];

  try {
    const sync = await runDailyRegulatorySync();

    if (admin) {
      for (const source of DEFAULT_LEARNING_SOURCES.slice(0, 6)) {
        await admin.from("internet_learning_sources").upsert({
          source_url: source.sourceUrl,
          source_type: source.sourceType,
          trust_level: source.trustLevel,
          sector: source.sector,
          fetch_frequency: source.fetchFrequency,
          status: "active",
          last_fetched_at: new Date().toISOString(),
        }, { onConflict: "source_url" });
      }

      const batch = generateSyntheticLearningBatch();
      for (const claim of batch) {
        const approved = claim.approvedForProduction;
        const { error } = await admin.from("claim_examples").insert({
          sector: claim.sector,
          product_category: claim.sector,
          claim_text: claim.claimText,
          risk_level: claim.riskLevel,
          risk_category: claim.riskCategory,
          risk_reason: claim.riskReason,
          safer_rewrite: claim.saferRewrite,
          confidence_score: claim.confidenceScore,
          source: claim.source,
          source_url: claim.sourceUrl,
          trust_score: claim.trustScore,
          reviewed: false,
          approved_for_production: approved,
        });
        if (!error) {
          claimsExtracted++;
          if (claim.riskLevel === "high") highRisk++;
          if (claim.confidenceScore < 70) lowConfidence++;
        }
      }

      await admin.from("internet_learning_runs").insert({
        run_type: "daily_regulatory",
        status: "completed",
        claims_extracted: claimsExtracted,
        high_risk_patterns_found: highRisk,
        low_confidence_count: lowConfidence,
        started_at: runStarted,
        completed_at: new Date().toISOString(),
        errors: errors.join("; "),
      });
    }

    return NextResponse.json({
      ok: true,
      regulatorySync: sync,
      claimsExtracted,
      highRiskPatterns: highRisk,
      lowConfidence,
      note: "Low-trust examples remain in review queue until admin approval.",
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Learning run failed.",
      claimsExtracted,
    }, { status: 500 });
  }
}