import { analyzeClaim } from "@/lib/analyzeClaim";
import {
  analyzeCaptionIntelligence,
  buildCtaBreakdown,
  buildHookBreakdown,
  detectPostTypeFromUrl,
  type CtaType,
  type HookType,
  type PostTypeLabel,
} from "@/lib/instagramCaptionAnalysis";
import { buildStrategicSummary, type StrategicSummarySection } from "@/lib/instagramStrategicSummary";
import { scanSocialCaption } from "@/lib/socialScanner";
import type { BrandComplianceProfile } from "@/lib/brandProfile";
import { regionToMarket, sectorToProductCategory } from "@/lib/sectorMapping";
import type { FetchedPost, SocialPlatform } from "@/lib/socialPublicFetch";

export type ContentCategory =
  | "Educational"
  | "Promotional"
  | "Founder Story"
  | "Testimonial"
  | "Product Feature"
  | "Customer FAQ"
  | "Before / After"
  | "Scientific Explanation"
  | "Lifestyle"
  | "Offer / Sale"
  | "Meme / Trend"
  | "Other";

export type RiskLevelLabel = "Safe" | "Low Risk" | "Medium Risk" | "High Risk" | "Needs Review";

export type PostAnalysis = {
  platform: SocialPlatform;
  post_url: string;
  caption_preview: string;
  post_type: PostTypeLabel;
  visible_likes: number | null;
  visible_comments: number | null;
  engagement_rate_estimate: number | null;
  engagement_note: string;
  risk_level: RiskLevelLabel;
  claim_risk_score: number;
  risk_reason: string;
  safer_rewrite: string;
  content_category: ContentCategory;
  hook_text: string;
  hook_type: HookType;
  cta_type: CtaType;
  tone: string;
  hashtag_count: number;
  caption_length: number;
  confidence_score: number;
  posted_at: string | null;
  risky_phrases: { phrase: string; why: string; safer: string; severity: string }[];
};

export type BioAnalysis = {
  bio_risk_score: number;
  risk_level: RiskLevelLabel;
  risky_words: string[];
  safer_bio_rewrite: string;
  cta_improvement: string;
  brand_clarity_score: number;
  original_bio: string;
};

export type WeeklyIdea = {
  title: string;
  format: string;
  hook: string;
  caption_direction: string;
  cta: string;
  compliance_angle: string;
};

export type AccountOverview = {
  handle: string;
  display_name: string;
  bio: string;
  profile_url: string;
  website_url: string;
  follower_count_public: number | null;
  following_count_public: number | null;
  post_count_public: number | null;
  profile_image_url: string;
  last_scanned_label: string;
  scan_status: string;
  data_limitations: string[];
};

export type SocialScanPayload = {
  estimated_label: string;
  health_overview: {
    overall_social_health: number;
    compliance_risk: RiskLevelLabel;
    caption_risk: RiskLevelLabel;
    estimated_engagement: "Low" | "Fair" | "Good" | "Unavailable";
    content_consistency_score: number;
    bio_claim_risk: RiskLevelLabel;
    high_risk_posts_count: number;
    claim_compliance_score: number;
  };
  account_overview: AccountOverview;
  bio: BioAnalysis;
  posts: PostAnalysis[];
  content_categories: { category: ContentCategory; count: number }[];
  missing_categories: string[];
  hook_breakdown: { hook_type: HookType; count: number }[];
  cta_breakdown: { cta_type: CtaType; count: number }[];
  engagement: {
    avg_likes: number | null;
    avg_comments: number | null;
    engagement_rate_estimate: number | null;
    engagement_note: string;
    best_posts: string[];
    worst_posts: string[];
    highest_risk_posts: string[];
    avg_caption_length: number | null;
    avg_hashtag_count: number | null;
  };
  insights: { type: string; title: string; description: string; action: string }[];
  weekly_ideas: WeeklyIdea[];
  strategic_summary: StrategicSummarySection[];
  limitations: string[];
  competitor_note?: string;
};

function profileContext(profile: BrandComplianceProfile | null) {
  return {
    category: sectorToProductCategory(profile?.sector || "Other"),
    market: profile?.salesRegions?.[0] ? regionToMarket(profile.salesRegions[0]) : "United States FDA + FTC",
    ingredients: profile?.ingredients?.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean) || [],
    sector: profile?.sector || "Other",
    brandName: profile?.brandName || "your brand",
  };
}

function toRiskLabel(level: import("@/lib/workspaceTypes").RiskLevel, score: number): RiskLevelLabel {
  if (level === "high" || score >= 75) return "High Risk";
  if (level === "needs_review") return "Needs Review";
  if (level === "medium" || score >= 40) return "Medium Risk";
  if (score >= 20) return "Low Risk";
  return "Safe";
}

function categorizeCaption(caption: string): ContentCategory {
  const t = caption.toLowerCase();
  if (/before.{0,20}after|transformation|results/i.test(t)) return "Before / After";
  if (/testimonial|review|customer said|★|stars/i.test(t)) return "Testimonial";
  if (/\?|faq|how to|why does|what is/i.test(t)) return "Customer FAQ";
  if (/study|science|research|ingredient|clinical/i.test(t)) return "Scientific Explanation";
  if (/% off|sale|discount|shop now|link in bio|use code/i.test(t)) return "Offer / Sale";
  if (/founder|our story|behind the scenes|journey/i.test(t)) return "Founder Story";
  if (/meme|trend|viral|pov/i.test(t)) return "Meme / Trend";
  if (/learn|tip|did you know|guide|how to/i.test(t)) return "Educational";
  if (/new product|feature|formula|launch/i.test(t)) return "Product Feature";
  if (/lifestyle|morning routine|day in/i.test(t)) return "Lifestyle";
  if (/buy|shop|order|available now/i.test(t)) return "Promotional";
  return "Other";
}

function sectorPriorityPatterns(sector: string): RegExp {
  if (/skincare|cosmetic/i.test(sector)) return /acne|anti-aging|wrinkle|repair|heal|dermatologist|cure/i;
  if (/food|functional/i.test(sector)) return /prevent|disease|nutrition|cure|weight|cholesterol/i;
  if (/wellness|herbal|ayurvedic/i.test(sector)) return /stress|anxiety|sleep|cure|detox|hormone/i;
  return /cure|prevent|treat|immune|inflammation|weight|guarantee|clinically|doctor recommended/i;
}

export function analyzeBioText(bio: string, profile: BrandComplianceProfile | null): BioAnalysis {
  const ctx = profileContext(profile);
  const analysis = analyzeClaim({
    claimText: bio || "No bio provided.",
    productCategory: ctx.category,
    ingredients: ctx.ingredients,
    market: ctx.market,
    contextType: "Social media",
  });
  const risky = analysis.riskyPhrases;
  const safer = analysis.saferRewrite || bio;
  const clarity = bio.length > 20 && bio.length < 160 ? 85 : bio.length > 0 ? 60 : 30;
  return {
    bio_risk_score: analysis.riskScore,
    risk_level: toRiskLabel(analysis.riskLevel, analysis.riskScore),
    risky_words: risky,
    safer_bio_rewrite: safer,
    cta_improvement: /link in bio|shop|learn more/i.test(bio)
      ? "CTA present — ensure it matches compliance-safe landing copy."
      : "Add a clear CTA (e.g. 'Learn more' or 'Shop — link in bio') with compliant product pages.",
    brand_clarity_score: clarity,
    original_bio: bio,
  };
}

export function analyzePost(
  post: FetchedPost,
  platform: SocialPlatform,
  profile: BrandComplianceProfile | null,
  followerCount: number | null,
): PostAnalysis {
  const ctx = profileContext(profile);
  const caption = post.caption || "";
  const social = scanSocialCaption(caption, { category: ctx.category, ingredients: ctx.ingredients, market: ctx.market }, platform);
  const analysis = analyzeClaim({
    claimText: caption,
    productCategory: ctx.category,
    ingredients: ctx.ingredients,
    market: ctx.market,
    contextType: "Social media",
  });

  const risky_phrases = social.flags.map((f) => ({
    phrase: f.phrase,
    why: f.rule_triggered === "FTC endorsement disclosure"
      ? "FTC requires clear disclosure when promoting products for compensation."
      : "This may be high-risk because it implies disease treatment or unsubstantiated outcomes. Consider softer structure/function wording.",
    safer: f.rewrite_suggestion,
    severity: f.severity,
  }));

  if (sectorPriorityPatterns(ctx.sector).test(caption) && risky_phrases.length === 0) {
    risky_phrases.push({
      phrase: "(sector-sensitive language)",
      why: `Common ${ctx.sector} compliance patterns suggest reviewing this caption for regulated claim language.`,
      safer: analysis.saferRewrite,
      severity: analysis.riskLevel === "needs_review" ? "medium" : analysis.riskLevel,
    });
  }

  let engagement_rate_estimate: number | null = null;
  let engagement_note = "Engagement rate unavailable because follower count is not public.";
  if (followerCount && followerCount > 0) {
    const likes = post.visible_likes || 0;
    const comments = post.visible_comments || 0;
    engagement_rate_estimate = Number((((likes + comments) / followerCount) * 100).toFixed(2));
    engagement_note = `Estimated from public data: (${likes} + ${comments}) / ${followerCount} followers.`;
  }

  const risk_level = toRiskLabel(analysis.riskLevel, analysis.riskScore);
  const intel = analyzeCaptionIntelligence(caption);
  const post_type = post.post_type || detectPostTypeFromUrl(post.post_url);

  return {
    platform,
    post_url: post.post_url,
    caption_preview: caption.slice(0, 280) + (caption.length > 280 ? "…" : ""),
    post_type,
    visible_likes: post.visible_likes,
    visible_comments: post.visible_comments,
    engagement_rate_estimate,
    engagement_note: post.visible_likes == null && post.visible_comments == null
      ? "Likes are hidden or unavailable from public data."
      : engagement_note,
    risk_level,
    claim_risk_score: analysis.riskScore,
    risk_reason: analysis.explanation.split(".")[0] + ".",
    safer_rewrite: analysis.saferRewrite,
    content_category: categorizeCaption(caption),
    hook_text: intel.hook_text,
    hook_type: intel.hook_type,
    cta_type: intel.cta_type,
    tone: intel.tone,
    hashtag_count: intel.hashtag_count,
    caption_length: intel.caption_length,
    confidence_score: intel.confidence_score,
    posted_at: post.posted_at,
    risky_phrases,
  };
}

function buildInsights(
  posts: PostAnalysis[],
  bio: BioAnalysis,
  categories: { category: ContentCategory; count: number }[],
  profile: BrandComplianceProfile | null,
): SocialScanPayload["insights"] {
  const ctx = profileContext(profile);
  const promo = categories.find((c) => c.category === "Promotional")?.count || 0;
  const edu = categories.find((c) => c.category === "Educational")?.count || 0;
  const insights: SocialScanPayload["insights"] = [];

  if (promo > edu && posts.length >= 2) {
    insights.push({
      type: "content_mix",
      title: "Balance promotional posts",
      description: "You post mostly promotional content. Add more educational and FAQ-style posts to build trust.",
      action: "Create 2 educational posts explaining ingredients and compliance-safe benefits.",
    });
  }

  if (bio.risk_level === "High Risk" || bio.risk_level === "Medium Risk") {
    insights.push({
      type: "bio",
      title: "Bio claim risk detected",
      description: "Your profile bio may include regulated claim language.",
      action: `Try: "${bio.safer_bio_rewrite.slice(0, 120)}…"`,
    });
  }

  const highRisk = posts.filter((p) => p.risk_level === "High Risk").length;
  if (highRisk > 0) {
    insights.push({
      type: "compliance",
      title: `${highRisk} high-risk post(s) found`,
      description: "Review flagged captions before they stay live on your profile.",
      action: "Use the safer rewrites below and re-check in Claim Checker.",
    });
  }

  insights.push({
    type: "strategy",
    title: "Posting strategy for " + ctx.sector,
    description: `Prioritize compliance-safe ${ctx.sector} language on ${ctx.brandName}'s social channels.`,
    action: "Connect APIs later for deeper analytics — this scan uses public data only.",
  });

  return insights;
}

function buildWeeklyIdeas(profile: BrandComplianceProfile | null, posts: PostAnalysis[]): WeeklyIdea[] {
  const ctx = profileContext(profile);
  const templates: WeeklyIdea[] = [
    {
      title: "Ingredient spotlight",
      format: "Carousel or Reel",
      hook: `What's actually inside ${ctx.brandName}?`,
      caption_direction: "Explain one key ingredient using structure/function language — no disease claims.",
      cta: "Learn more — link in bio",
      compliance_angle: "Educational, substantiation-friendly",
    },
    {
      title: "How to use it",
      format: "Short video",
      hook: "My daily routine with [product]",
      caption_direction: "Show usage without promising specific health outcomes or timelines.",
      cta: "Shop now #ad",
      compliance_angle: "Lifestyle + FTC disclosure",
    },
    {
      title: "FAQ Friday",
      format: "Static post",
      hook: "You asked — we answered",
      caption_direction: "Answer one customer question with qualified, evidence-aligned wording.",
      cta: "DM us your questions",
      compliance_angle: "Customer FAQ — builds trust",
    },
    {
      title: "Founder note",
      format: "Story / post",
      hook: "Why we started " + ctx.brandName,
      caption_direction: "Share mission and quality standards — avoid cure/treatment language.",
      cta: "Explore the collection",
      compliance_angle: "Founder story — low claim risk",
    },
    {
      title: "Safer claim swap",
      format: "Text post",
      hook: "Say this, not that",
      caption_direction: "Show a risky phrase vs. your compliance-safe alternative from today's scan.",
      cta: "Save for your next caption",
      compliance_angle: "Educational compliance content",
    },
    {
      title: "Behind the label",
      format: "Carousel",
      hook: "What our label really means",
      caption_direction: "Walk through disclaimers and structure/function claims on your packaging.",
      cta: "Read the full label on our site",
      compliance_angle: "Scientific explanation",
    },
    {
      title: "Community check-in",
      format: "Poll / question",
      hook: "What wellness goal are you focused on?",
      caption_direction: "Engage without promising results — invite conversation, not treatment claims.",
      cta: "Comment below",
      compliance_angle: "Lifestyle — minimal claim risk",
    },
  ];

  if (posts.some((p) => p.content_category === "Educational")) {
    templates[0].hook = "Build on your educational posts — go deeper on one benefit.";
  }

  return templates;
}

export function runSocialIntelligenceScan(input: {
  platform: SocialPlatform;
  handle: string;
  profile_url: string;
  bio: string;
  posts: FetchedPost[];
  follower_count_public: number | null;
  following_count_public?: number | null;
  post_count_public?: number | null;
  display_name?: string;
  website_url?: string;
  profile_image_url?: string;
  profile: BrandComplianceProfile | null;
  is_competitor?: boolean;
  scan_status?: string;
  fetch_message?: string;
}): SocialScanPayload {
  const bio = analyzeBioText(input.bio, input.profile);
  const posts = input.posts.map((p) =>
    analyzePost(p, input.platform, input.profile, input.follower_count_public),
  );

  const categoryMap = new Map<ContentCategory, number>();
  for (const p of posts) {
    categoryMap.set(p.content_category, (categoryMap.get(p.content_category) || 0) + 1);
  }
  const content_categories = [...categoryMap.entries()].map(([category, count]) => ({ category, count }));
  const allCats: ContentCategory[] = ["Educational", "Promotional", "Testimonial", "Customer FAQ", "Lifestyle"];
  const missing_categories = allCats
    .filter((c) => !categoryMap.has(c))
    .map((c) => `Add more ${c} posts`);

  const high_risk = posts.filter((p) => p.risk_level === "High Risk").length;
  const med_risk = posts.filter((p) => p.risk_level === "Medium Risk").length;
  const compliance_score = Math.max(0, 100 - high_risk * 18 - med_risk * 8 - (bio.bio_risk_score > 50 ? 15 : 0));
  const overall = Math.round((compliance_score + bio.brand_clarity_score) / 2);

  const likesArr = posts.map((p) => p.visible_likes).filter((v): v is number => v != null);
  const commentsArr = posts.map((p) => p.visible_comments).filter((v): v is number => v != null);
  const avg_likes = likesArr.length ? Math.round(likesArr.reduce((a, b) => a + b, 0) / likesArr.length) : null;
  const avg_comments = commentsArr.length ? Math.round(commentsArr.reduce((a, b) => a + b, 0) / commentsArr.length) : null;

  let engagement_rate_estimate: number | null = null;
  let engagement_note = "Engagement rate unavailable because follower count is not public.";
  if (input.follower_count_public && input.follower_count_public > 0 && (avg_likes != null || avg_comments != null)) {
    engagement_rate_estimate = Number((((avg_likes || 0) + (avg_comments || 0)) / input.follower_count_public * 100).toFixed(2));
    engagement_note = `Estimated from public data only.`;
  }

  const sorted = [...posts].sort((a, b) => (b.visible_likes || 0) - (a.visible_likes || 0));
  const estimated_engagement =
    engagement_rate_estimate == null ? "Unavailable"
    : engagement_rate_estimate >= 3 ? "Good"
    : engagement_rate_estimate >= 1 ? "Fair"
    : "Low";

  const compliance_risk: RiskLevelLabel =
    high_risk > 0 ? "High Risk" : med_risk > 0 ? "Medium Risk" : bio.risk_level;

  const captionScores = posts.map((p) => p.claim_risk_score);
  const avgCaptionRisk = captionScores.length
    ? Math.round(captionScores.reduce((a, b) => a + b, 0) / captionScores.length)
    : 0;
  const caption_risk: RiskLevelLabel =
    avgCaptionRisk >= 75 ? "High Risk"
    : avgCaptionRisk >= 40 ? "Medium Risk"
    : avgCaptionRisk >= 20 ? "Low Risk"
    : posts.length ? "Safe" : "Low Risk";

  const limitations: string[] = [
    "Public data only — no private Instagram analytics.",
    "Estimated from visible likes, comments, and follower count where available.",
  ];
  if (input.follower_count_public == null) {
    limitations.push("Follower count not publicly visible — engagement rate unavailable.");
  }
  if (posts.some((p) => p.visible_likes == null)) {
    limitations.push("Some posts hide like counts from public view.");
  }
  if (input.fetch_message?.includes("failed") || input.fetch_message?.includes("manual")) {
    limitations.push("Manual scan — auto-fetch was limited.");
  }

  const riskySorted = [...posts]
    .filter((p) => p.risk_level === "High Risk" || p.risk_level === "Medium Risk")
    .sort((a, b) => b.claim_risk_score - a.claim_risk_score);

  const hook_breakdown = buildHookBreakdown(posts);
  const cta_breakdown = buildCtaBreakdown(posts);
  const avg_caption_length = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.caption_length, 0) / posts.length)
    : null;
  const avg_hashtag_count = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.hashtag_count, 0) / posts.length)
    : null;

  const healthPayload = {
    overall_social_health: overall,
    compliance_risk,
    caption_risk,
    estimated_engagement: estimated_engagement as "Low" | "Fair" | "Good" | "Unavailable",
    content_consistency_score: posts.length >= 3 ? 75 : posts.length >= 1 ? 50 : 25,
    bio_claim_risk: bio.risk_level,
    high_risk_posts_count: high_risk,
    claim_compliance_score: compliance_score,
  };

  const engagementPayload = {
    avg_likes,
    avg_comments,
    engagement_rate_estimate,
    engagement_note,
    best_posts: sorted.slice(0, 2).map((p) => p.caption_preview.slice(0, 60)),
    worst_posts: sorted.slice(-2).reverse().map((p) => p.caption_preview.slice(0, 60)),
    highest_risk_posts: riskySorted.slice(0, 3).map((p) => p.caption_preview.slice(0, 60)),
    avg_caption_length,
    avg_hashtag_count,
  };

  const weekly_ideas = buildWeeklyIdeas(input.profile, posts);

  return {
    estimated_label: "Estimated from public data",
    health_overview: healthPayload,
    account_overview: {
      handle: input.handle,
      display_name: input.display_name || input.handle,
      bio: input.bio,
      profile_url: input.profile_url,
      website_url: input.website_url || "",
      follower_count_public: input.follower_count_public,
      following_count_public: input.following_count_public ?? null,
      post_count_public: input.post_count_public ?? null,
      profile_image_url: input.profile_image_url || "",
      last_scanned_label: "Just now",
      scan_status: input.scan_status || "completed",
      data_limitations: limitations,
    },
    bio,
    posts,
    content_categories,
    missing_categories,
    hook_breakdown,
    cta_breakdown,
    engagement: engagementPayload,
    insights: buildInsights(posts, bio, content_categories, input.profile),
    weekly_ideas,
    strategic_summary: buildStrategicSummary({
      handle: input.handle,
      bio,
      posts,
      payload: {
        content_categories,
        missing_categories,
        engagement: engagementPayload,
        health_overview: healthPayload,
        weekly_ideas,
      },
      isCompetitor: input.is_competitor,
      limitations,
    }),
    limitations,
    competitor_note: input.is_competitor
      ? "Based on public data only — competitor claim style and frequency are estimates."
      : undefined,
  };
}