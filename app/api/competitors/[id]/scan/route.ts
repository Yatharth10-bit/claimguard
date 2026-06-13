import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { scanCompetitorContent } from "@/lib/competitorScanner";

type Params = { params: Promise<{ id: string }> };

const scanSchema = z.object({
  raw_content: z.string().trim().min(30).max(100000),
  source: z.enum(["website", "amazon"]).default("website"),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { id } = await params;
  const parsed = scanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid scan input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: tracker } = await admin
    .from("competitor_trackers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tracker) return NextResponse.json({ error: "Competitor not found." }, { status: 404 });

  const { data: previous } = await admin
    .from("competitor_snapshots")
    .select("content_hash")
    .eq("competitor_tracker_id", id)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const result = scanCompetitorContent(parsed.data.raw_content, {
    category: "Dietary Supplement",
    market: "United States FDA + FTC",
  });

  const changed = previous ? previous.content_hash !== result.content_hash : false;

  const { data: snapshot, error } = await admin
    .from("competitor_snapshots")
    .insert({
      competitor_tracker_id: id,
      source: parsed.data.source,
      content_hash: result.content_hash,
      raw_content: parsed.data.raw_content,
      claims_found: result.claims_found,
      high_risk_claims: result.high_risk_claims,
      changed_from_previous: changed,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (changed && result.high_risk_claims.length) {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "competitor_claims_changed",
      title: `${tracker.brand_name} claims updated`,
      body: `Competitor copy changed — ${result.high_risk_claims.length} high-risk claim(s) detected.`,
      link: "/competitors",
    });
  }

  return NextResponse.json({ snapshot });
}