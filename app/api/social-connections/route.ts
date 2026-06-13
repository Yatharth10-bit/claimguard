import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";

const createSchema = z.object({
  platform: z.enum(["instagram", "tiktok"]),
  account_handle: z.string().trim().min(1).max(100),
});

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data, error } = await admin
    .from("social_connections")
    .select("id, platform, account_handle, is_active, last_synced_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connections: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await admin
    .from("social_connections")
    .insert({
      user_id: user.id,
      platform: parsed.data.platform,
      account_handle: parsed.data.account_handle.replace(/^@/, ""),
      access_token: "manual",
      refresh_token: "",
    })
    .select("id, platform, account_handle, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: data });
}