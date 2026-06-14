import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/apiAuth";
import { loadBrandProfileServer } from "@/lib/brandProfileServer";
import { runSocialIntelligenceScan } from "@/lib/socialIntelligence";
import type { PostAnalysis } from "@/lib/socialIntelligence";
import {
  fetchInstagramPostByUrl,
  fetchPublicSocialData,
  parseInstagramInput,
  type FetchedPost,
} from "@/lib/socialPublicFetch";

const manualPostSchema = z.object({
  caption: z.string().trim().min(1).max(10000),
  post_url: z.string().trim().max(2000).optional().default(""),
  visible_likes: z.number().int().min(0).optional().nullable(),
  visible_comments: z.number().int().min(0).optional().nullable(),
});

const scanSchema = z.object({
  account_id: z.string().uuid().optional(),
  post_url: z.string().trim().max(2000).optional(),
  platform: z.enum(["instagram", "tiktok", "youtube", "reddit", "x", "facebook", "linkedin"]).optional(),
  profile_url: z.string().trim().max(2000).optional(),
  handle: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(5000).optional().default(""),
  follower_count_public: z.number().int().min(0).optional().nullable(),
  is_competitor: z.boolean().optional().default(false),
  manual_posts: z.array(manualPostSchema).max(50).optional().default([]),
  try_public_fetch: z.boolean().optional().default(true),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function persistScanArtifacts(
  admin: any,
  userId: string,
  accountId: string,
  scanId: string,
  payload: ReturnType<typeof runSocialIntelligenceScan>,
  sourceType: string,
  fetchMessage: string,
) {
  const snapshotRow = {
    user_id: userId,
    account_id: accountId,
    scan_id: scanId,
    follower_count_public: payload.account_overview.follower_count_public,
    following_count_public: payload.account_overview.following_count_public,
    post_count_public: payload.account_overview.post_count_public,
    avg_visible_likes: payload.engagement.avg_likes,
    avg_visible_comments: payload.engagement.avg_comments,
    estimated_engagement_rate: payload.engagement.engagement_rate_estimate,
    high_risk_post_count: payload.health_overview.high_risk_posts_count,
    compliance_score: payload.health_overview.claim_compliance_score,
    data_limitations: payload.limitations.join(" "),
    raw_public_data: { source_type: sourceType, fetch_message: fetchMessage },
  };

  const { error: snapErr } = await admin.from("social_intelligence_snapshots").insert(snapshotRow);
  if (snapErr && !snapErr.message.includes("does not exist")) {
    console.warn("[social scan] snapshot insert:", snapErr.message);
  }

  const postRows = payload.posts.map((p: PostAnalysis) => ({
    user_id: userId,
    account_id: accountId,
    scan_id: scanId,
    platform: "instagram",
    post_url: p.post_url,
    caption: p.caption_preview,
    post_type: p.post_type,
    visible_like_count: p.visible_likes,
    visible_comment_count: p.visible_comments,
    posted_at: p.posted_at,
    caption_length: p.caption_length,
    hook_text: p.hook_text,
    hook_type: p.hook_type,
    cta_type: p.cta_type,
    tone: p.tone,
    content_category: p.content_category,
    estimated_engagement_rate: p.engagement_rate_estimate,
    claim_risk_level: p.risk_level,
    claim_risk_score: p.claim_risk_score,
    safer_rewrite: p.safer_rewrite,
    confidence_score: p.confidence_score,
    source_type: sourceType,
    is_analyzed: true,
    analyzed_at: new Date().toISOString(),
  }));

  if (postRows.length) {
    const { error: postsErr } = await admin.from("social_intelligence_posts").insert(postRows);
    if (postsErr && !postsErr.message.includes("does not exist")) {
      console.warn("[social scan] posts insert:", postsErr.message);
    }
  }

  if (payload.health_overview.high_risk_posts_count > 0 || payload.bio.risk_level === "High Risk") {
    const alerts = [];
    if (payload.health_overview.high_risk_posts_count > 0) {
      alerts.push({
        user_id: userId,
        account_id: accountId,
        alert_type: "high_risk_caption",
        severity: "high",
        title: "High-risk Instagram caption detected",
        body: `${payload.health_overview.high_risk_posts_count} caption(s) need safer rewrites.`,
      });
    }
    if (payload.bio.risk_level === "High Risk" || payload.bio.risk_level === "Medium Risk") {
      alerts.push({
        user_id: userId,
        account_id: accountId,
        alert_type: "bio_risk",
        severity: payload.bio.risk_level === "High Risk" ? "high" : "medium",
        title: "Bio claim risk detected",
        body: "Your Instagram bio may include regulated claim language.",
      });
    }
    const { error: alertErr } = await admin.from("social_intelligence_alerts").insert(alerts);
    if (alertErr && !alertErr.message.includes("does not exist")) {
      console.warn("[social scan] alerts insert:", alertErr.message);
    }
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const parsed = scanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid scan input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const brandProfile = await loadBrandProfileServer(user.id);
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

  let platform = account?.platform || parsed.data.platform || "instagram";
  let handle = account?.handle || parsed.data.handle || "";
  let profile_url = account?.profile_url || parsed.data.profile_url || "";

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
  let followingCount: number | null = account?.following_count_public ?? null;
  let postCount: number | null = account?.post_count_public ?? null;
  let displayName = account?.display_name || "";
  let websiteUrl = account?.website_url || "";
  let profileImageUrl = account?.profile_image_url || "";
  let sourceType: "public_fetch" | "manual_paste" = "manual_paste";
  let fetchMessage = "";

  // Flow 2 — single post / reel URL scan
  if (parsed.data.post_url) {
    const igPost = parseInstagramInput(parsed.data.post_url);
    if (igPost?.kind === "post" && parsed.data.try_public_fetch) {
      const { post, message } = await fetchInstagramPostByUrl(parsed.data.post_url);
      fetchMessage = message;
      if (post) {
        posts = [post];
        sourceType = "public_fetch";
        if (!handle && igPost.shortcode) handle = `post-${igPost.shortcode}`;
        if (!profile_url) profile_url = post.post_url;
        platform = "instagram";
      }
    }
  }

  if (parsed.data.try_public_fetch && profile_url && posts.length === 0 && !parsed.data.post_url) {
    const fetched = await fetchPublicSocialData(platform, handle, profile_url);
    const hasFetchedContent = Boolean(fetched.bio?.trim() || fetched.posts.length > 0);
    if (fetched.fetch_method === "public_fetch" && hasFetchedContent) {
      bio = bio || fetched.bio;
      posts = fetched.posts.length ? fetched.posts : posts;
      followerCount = followerCount ?? fetched.follower_count_public ?? null;
      followingCount = followingCount ?? fetched.following_count_public ?? null;
      postCount = postCount ?? fetched.post_count_public ?? null;
      displayName = displayName || fetched.display_name || "";
      websiteUrl = websiteUrl || fetched.website_url || "";
      profileImageUrl = profileImageUrl || fetched.profile_image_url || "";
      sourceType = "public_fetch";
      fetchMessage = fetched.message;
    } else if (fetched.bio?.trim() || fetched.posts.length > 0) {
      bio = bio || fetched.bio;
      posts = fetched.posts.length ? fetched.posts : posts;
      followerCount = followerCount ?? fetched.follower_count_public ?? null;
      followingCount = followingCount ?? fetched.following_count_public ?? null;
      postCount = postCount ?? fetched.post_count_public ?? null;
      displayName = displayName || fetched.display_name || "";
      websiteUrl = websiteUrl || fetched.website_url || "";
      profileImageUrl = profileImageUrl || fetched.profile_image_url || "";
      fetchMessage = fetched.message || "Partial public data retrieved.";
    } else {
      fetchMessage = fetched.message;
    }
  }

  if (!bio && posts.length === 0) {
    return NextResponse.json({
      error: "We could not fetch this profile automatically. Paste your bio, captions, or post links manually to continue the free scan.",
      fetch_message: fetchMessage,
      status: "fallback_required",
      limitations: ["Public data only", "Instagram may block automated server fetches"],
    }, { status: 422 });
  }

  if (!handle) {
    const ig = parseInstagramInput(profile_url || parsed.data.post_url || "");
    if (ig?.kind === "profile") handle = ig.handle;
    else if (ig?.kind === "post") handle = `post-${ig.shortcode}`;
  }

  if (!handle) {
    return NextResponse.json({ error: "Handle or profile URL is required." }, { status: 400 });
  }

  const payload = runSocialIntelligenceScan({
    platform,
    handle,
    profile_url: profile_url || `https://instagram.com/${handle}`,
    bio,
    posts,
    follower_count_public: followerCount,
    following_count_public: followingCount,
    post_count_public: postCount,
    display_name: displayName,
    website_url: websiteUrl,
    profile_image_url: profileImageUrl,
    profile: brandProfile,
    is_competitor: parsed.data.is_competitor || account?.is_competitor,
    scan_status: sourceType === "public_fetch" ? "completed" : "manual",
    fetch_message: fetchMessage,
  });

  if (fetchMessage && sourceType === "manual_paste") {
    payload.insights.unshift({
      type: "fetch",
      title: "Public scan limited",
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
        profile_url: profile_url || `https://instagram.com/${handle}`,
        bio,
        display_name: displayName,
        website_url: websiteUrl,
        profile_image_url: profileImageUrl,
        follower_count_public: followerCount,
        following_count_public: followingCount,
        post_count_public: postCount,
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
      compliance_score: payload.health_overview.claim_compliance_score,
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
      return NextResponse.json({ error: "Run supabase/deploy-all.sql migration first." }, { status: 503 });
    }
    return NextResponse.json({ error: scanErr.message }, { status: 500 });
  }

  await admin
    .from("social_intelligence_accounts")
    .update({
      bio,
      display_name: displayName || payload.account_overview.display_name,
      website_url: websiteUrl,
      profile_image_url: profileImageUrl,
      follower_count_public: followerCount,
      following_count_public: followingCount,
      post_count_public: postCount,
      last_scanned_at: new Date().toISOString(),
      scan_status: "completed",
      scan_error: sourceType === "manual_paste" ? fetchMessage : "",
    })
    .eq("id", account.id);

  await persistScanArtifacts(admin, user.id, account.id, scan.id, payload, sourceType, fetchMessage);

  if (payload.health_overview.high_risk_posts_count > 0) {
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "social_intel_high_risk",
      title: "Social claim risk detected",
      body: `${payload.health_overview.high_risk_posts_count} high-risk post(s) on @${handle}. Review safer rewrites.`,
      link: "/social",
    });
  }

  return NextResponse.json({
    scan,
    account,
    payload,
    status: "completed",
    limitations: payload.limitations,
  });
}