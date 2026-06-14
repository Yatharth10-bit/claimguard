import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: accounts, error: accErr } = await admin
    .from("social_intelligence_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (accErr) {
    if (accErr.message.includes("does not exist")) {
      return NextResponse.json({ accounts: [], scans: [], migration_required: true });
    }
    return NextResponse.json({ error: accErr.message }, { status: 500 });
  }

  const accountIds = (accounts || []).map((a) => a.id);
  let latestScans: Record<string, unknown> = {};
  if (accountIds.length) {
    const { data: scans } = await admin
      .from("social_intelligence_scans")
      .select("id, account_id, overall_score, compliance_score, high_risk_posts_count, status, created_at, payload, engagement_estimate")
      .eq("user_id", user.id)
      .in("account_id", accountIds)
      .order("created_at", { ascending: false });

    for (const scan of scans || []) {
      const key = scan.account_id as string;
      if (!latestScans[key]) latestScans[key] = scan;
    }
  }

  return NextResponse.json({
    accounts: (accounts || []).map((a) => ({
      ...a,
      latest_scan: latestScans[a.id] || null,
    })),
    migration_required: false,
  });
}