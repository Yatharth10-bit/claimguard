import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { parseSocialInput } from "@/lib/socialPublicFetch";

const createSchema = z.object({
  input: z.string().trim().min(1).max(2000),
  is_competitor: z.boolean().optional().default(false),
  platform: z.enum(["instagram", "tiktok", "youtube", "reddit", "x", "facebook", "linkedin"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid account input.", details: parsed.error.flatten() }, { status: 400 });
  }

  let platform = parsed.data.platform;
  let handle = parsed.data.input.replace(/^@/, "").trim();
  let profile_url = "";

  const detected = parseSocialInput(parsed.data.input);
  if (detected) {
    platform = detected.platform;
    handle = detected.handle;
    profile_url = detected.profile_url;
  } else if (!platform) {
    return NextResponse.json({ error: "Could not detect platform. Paste a full profile URL or select a platform." }, { status: 400 });
  } else {
    profile_url = platform === "instagram" ? `https://instagram.com/${handle}`
      : platform === "tiktok" ? `https://tiktok.com/@${handle}`
      : platform === "youtube" ? `https://youtube.com/@${handle}`
      : platform === "reddit" ? `https://reddit.com/u/${handle}`
      : platform === "x" ? `https://x.com/${handle}`
      : platform === "facebook" ? `https://facebook.com/${handle}`
      : `https://linkedin.com/company/${handle}`;
  }

  const { data, error } = await admin
    .from("social_intelligence_accounts")
    .insert({
      user_id: user.id,
      platform,
      handle,
      profile_url,
      is_competitor: parsed.data.is_competitor,
      scan_status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({ error: "Run supabase/social-intelligence-lite.sql migration first." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data });
}