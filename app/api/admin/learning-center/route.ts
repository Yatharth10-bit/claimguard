import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { runClaimEvaluation } from "@/lib/claimIntelligence/evaluation";
import { getSeedDatasetSize } from "@/lib/claimIntelligence/seedDataset";
import {
  CLAIM_DATASET_VERSION,
  CLAIM_PROMPT_VERSION,
  CLAIM_RULES_VERSION,
} from "@/lib/claimIntelligence/versions";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { admin } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const [
    { count: dbExamples },
    { count: pendingReview },
    { count: approvedExamples },
    { count: feedbackCount },
    { data: sources },
    { data: recentRuns },
    { data: evaluations },
    { data: versions },
  ] = await Promise.all([
    admin.from("claim_examples").select("*", { count: "exact", head: true }),
    admin.from("claim_examples").select("*", { count: "exact", head: true }).eq("reviewed", false).eq("approved_for_production", false),
    admin.from("claim_examples").select("*", { count: "exact", head: true }).eq("approved_for_production", true),
    admin.from("claim_feedback").select("*", { count: "exact", head: true }),
    admin.from("internet_learning_sources").select("*").order("updated_at", { ascending: false }).limit(20),
    admin.from("internet_learning_runs").select("*").order("started_at", { ascending: false }).limit(10),
    admin.from("model_evaluation_runs").select("*").order("started_at", { ascending: false }).limit(5),
    admin.from("claim_engine_versions").select("*").eq("is_production", true).limit(1),
  ]);

  const liveEval = runClaimEvaluation(200);
  const tablesMissing = dbExamples === null;

  return NextResponse.json({
    tablesMissing,
    migration: "supabase/claim-intelligence-engine.sql",
    stats: {
      seedDatasetSize: getSeedDatasetSize(),
      dbExamples: dbExamples ?? 0,
      approvedExamples: approvedExamples ?? 0,
      pendingReview: pendingReview ?? 0,
      feedbackCount: feedbackCount ?? 0,
      sourcesScanned: sources?.filter((s) => s.status === "active").length ?? 0,
      failedSources: sources?.filter((s) => s.status === "failed").length ?? 0,
    },
    versions: {
      ruleVersion: versions?.[0]?.rule_version || CLAIM_RULES_VERSION,
      promptVersion: versions?.[0]?.prompt_version || CLAIM_PROMPT_VERSION,
      datasetVersion: versions?.[0]?.dataset_version || CLAIM_DATASET_VERSION,
    },
    latestEvaluation: evaluations?.[0] || liveEval,
    liveEvaluation: liveEval,
    sources: sources || [],
    recentRuns: recentRuns || [],
    lowConfidenceExamples: pendingReview ?? 0,
  });
}