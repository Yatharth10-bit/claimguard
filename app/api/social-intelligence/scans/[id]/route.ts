import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { id } = await params;

  const { data, error } = await admin
    .from("social_intelligence_scans")
    .select("*, social_intelligence_accounts(platform, handle, profile_url, is_competitor)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Scan not found." }, { status: 404 });

  return NextResponse.json({ scan: data });
}