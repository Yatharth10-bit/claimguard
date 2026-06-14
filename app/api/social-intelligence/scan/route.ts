import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { loadBrandProfileServer } from "@/lib/brandProfileServer";
import { runSocialIntelligenceScan } from "@/lib/socialIntelligence";
import { fetchPublicSocialData, type FetchedPost } from "@/lib/socialPublicFetch";

const manualPostSchema = z.object({
  caption: z.string().trim().min(1).max(10000),
  post_url: z.string().trim().max(2000).optional().default(""),
  visible_likes: z.number().int().min(0).optional().nullable(),
  visible_comments: z.number().int().min(0).optional().nullable(),
});

const scanSchema = z.object({
  account_id: z.string().uuid().optional(),
  platform: z.enum(["instagram", "tiktok", "youtube", "reddit", "x", "facebook", "linkedin"]).optional(),
  profile_url: z.string().trim().max(2000).optional(),
  handle: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(5000).optional().default(""),
  follower_count_public: z.number().int().min(0).optional().nullable(),
  is_competitor: z.boolean().optional().default(false),
  manual_posts: z.array(manualPostSchema).max(50).optional().default([]),
  try_public_fetch: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = scanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid scan input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await loadBrandProfileServer(user.id);
  let account = null;

  if (parsed.data.account_id) {
    const { data } = await admin
      .from("social_intelligence_accounts")
      .select("*")
      .eq("id", parsed.data.account_id)
      .eq("user_id", user.id)
      .maybeSingle();
    account = data;
    if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const platform = account?.platform || parsed.data.platform;
  const handle = account?.handle || parsed.data.handle;
  const profile_url = account?.profile_url || parsed.data.profile_url;

  if (!platform || !handle) {
    return NextResponse.json({ error: "Platform and handle are required." }, { status: 400 });
  }

  const scanStarted = new Date().toISOString();
  let bio = parsed.data.bio || account?.bio || "";
  let posts: FetchedPost[] = parsed.data.manual_posts.map((p) => ({
    post_url: p.post_url || "",
    caption: p.caption,
    visible_likes: p.visible_likes ?? null,
    visible_comments: p.visible_comments ?? null,
    posted_at: null,
  }));
  let followerCount = parsed.data.follower_count_public ?? account?.follower_count_public ?? null;
  let sourceType: "public_fetch" | "manual_paste" = "manual_paste";
  let fetchMessage = "";

  if (parsed.data.try_public_fetch && profile_url && posts.length === 0) {
    const fetched = await fetchPublicSocialData(platform, handle, profile_url);
    if (fetched.fetch_method === "public_fetch" && fetched.posts.length > 0) {
      bio = bio || fetched.bio;
      posts = fetched.posts;
      followerCount = followerCount ?? fetched.follower_count_public;
      sourceType = "public_fetch";
      fetchMessage = fetched.message;
    } else {
      fetchMessage = fetched.message;
    }
  }

  if (!bio && posts.length === 0) {
    return NextResponse.json({
      error: "We could not fetch this profile automatically. Paste captions, bio, or post links manually.",
      fetch_message: fetchMessage,
    }, { status: 422 });
  }

  const payload = runSocialIntelligenceScan({
    platform,
    bio,
    posts,
    follower_count_public: followerCount,
    profile,
    is_competitor: parsed.data.is_competitor || account?.is_competitor,
  });

  if (fetchMessage && sourceType === "manual_paste") {
    payload.insights.unshift({
      type: "fetch",
      title: "Public fetch limited",
      description: fetchMessage,
      action: "Paste captions manually for a full free public scan.",
    });
  }

  if (!account) {
    const { data: created } = await admin
      .from("social_intelligence_accounts")
      .insert({
        user_id: user.id,
        platform,
        handle,
        profile_url: profile_url || "",
        bio,
        follower_count_public: followerCount,
        is_competitor: parsed.data.is_competitor,
        scan_status: "completed",
        last_scanned_at: new Date().toISOString(),
      })
      .select()
      .single();
    account = created;
  }

  if (!account) return NextResponse.json({ error: "Could not create account." }, { status: 500 });

  const { data: scan, error: scanErr } = await admin
    .from("social_intelligence_scans")
    .insert({
      user_id: user.id,
      account_id: account.id,
      scan_started_at: scanStarted,
      scan_completed_at: new Date().toISOString(),
      status: posts.length ? "completed" : "manual",
      source_type: sourceType,
      errors: fetchMessage,
      overall_score: payload.health_overview.overall_social_health,
      compliance_score: Math.max(0, 100 - payload.health_overview.high_risk_posts_count * 18 - (payload.bio.bio_risk_score > 50 ? 12 : 0)),
      engagement_estimate: payload.engagement.engagement_rate_estimate
        ? Math.min(100, Math.round(payload.engagement.engagement_rate_estimate * 10))
        : 0,
      content_consistency_score: payload.health_overview.content_consistency_score,
      bio_risk_score: payload.bio.bio_risk_score,
      high_risk_posts_count: payload.health_overview.high_risk_posts_count,
      payload,
    })
    .select()
    .single();

  if (scanErr) {
    if (scanErr.message.includes("does not exist")) {
      return NextResponse.json({ error: "Run supabase/social-intelligence-lite.sql migration first." }, { status: 503 });
    }
    return NextResponse.json({ error: scanErr.message }, { status: 500 });
  }

  await admin
    .from("social_intelligence_accounts")
    .update({
      bio,
      follower_count_public: followerCount,
      last_scanned_at: new Date().toISOString(),
      scan_status: "completed",
    })
    .eq("id", account.id);

  if (payload.health_overview.high_risk_posts_count > 0) {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "social_intel_high_risk",
      title: "Social claim risk detected",
      body: `${payload.health_overview.high_risk_posts_count} high-risk post(s) on @${handle}. Review safer rewrites.`,
      link: "/social",
    });
  }

  return NextResponse.json({ scan, account, payload });
}