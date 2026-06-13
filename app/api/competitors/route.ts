import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";

const createSchema = z.object({
  brand_name: z.string().trim().min(1).max(255),
  website_url: z.string().trim().max(2000).optional().nullable(),
  amazon_asin: z.string().trim().max(20).optional().nullable(),
}).refine((d) => d.website_url || d.amazon_asin, {
  message: "Provide a website URL or Amazon ASIN.",
});

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: trackers, error } = await admin
    .from("competitor_trackers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const trackerIds = (trackers || []).map((t) => t.id);
  let latestSnapshots: Record<string, unknown> = {};
  if (trackerIds.length) {
    const { data: snapshots } = await admin
      .from("competitor_snapshots")
      .select("*")
      .in("competitor_tracker_id", trackerIds)
      .order("captured_at", { ascending: false });

    for (const snap of snapshots || []) {
      const key = snap.competitor_tracker_id as string;
      if (!latestSnapshots[key]) latestSnapshots[key] = snap;
    }
  }

  return NextResponse.json({
    competitors: (trackers || []).map((tracker) => ({
      ...tracker,
      latest_snapshot: latestSnapshots[tracker.id] || null,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid competitor input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await admin
    .from("competitor_trackers")
    .insert({
      user_id: user.id,
      brand_name: parsed.data.brand_name,
      website_url: parsed.data.website_url || null,
      amazon_asin: parsed.data.amazon_asin || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitor: data });
}