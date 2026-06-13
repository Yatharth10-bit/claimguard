import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

type Params = { params: Promise<{ scanId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { scanId } = await params;

  const { data: scan } = await supabase
    .from("amazon_scan_results")
    .select("*, amazon_listings!inner(id, product_id, title, user_id)")
    .eq("id", scanId)
    .maybeSingle();

  const listing = scan?.amazon_listings as { user_id: string } | undefined;
  if (!scan || listing?.user_id !== user.id) {
    return NextResponse.json({ error: "Scan result not found." }, { status: 404 });
  }

  return NextResponse.json({ scan });
}