import type { BioAnalysis, PostAnalysis, SocialScanPayload } from "@/lib/socialIntelligence";

/**
 * Template-based strategic brief from scan data.
 * // TRADEOFF: Full LLM strategic report (INSTAGRAM_SOCIAL_SUMMARY_PROMPT) deferred — no blocking on inference API.
 */

export type StrategicSummarySection = {
  id: string;
  title: string;
  body: string;
};

export function buildStrategicSummary(input: {
  handle: string;
  bio: BioAnalysis;
  posts: PostAnalysis[];
  payload: Pick<SocialScanPayload, "content_categories" | "missing_categories" | "engagement" | "health_overview" | "weekly_ideas">;
  isCompetitor?: boolean;
  limitations: string[];
}): StrategicSummarySection[] {
  const { handle, bio, posts, payload, isCompetitor, limitations } = input;
  const topPosts = [...posts]
    .sort((a, b) => (b.visible_likes || 0) - (a.visible_likes || 0))
    .slice(0, 3);
  const riskyPosts = posts.filter((p) => p.risk_level === "High Risk" || p.risk_level === "Medium Risk");
  const topCategory = payload.content_categories[0]?.category || "Unknown";

  const positioning = bio.original_bio
    ? `@${handle} communicates through: "${bio.original_bio.slice(0, 160)}${bio.original_bio.length > 160 ? "…" : ""}". Brand clarity score: ${bio.brand_clarity_score}/100 (public bio only).`
    : `@${handle} has limited public bio data. Paste a bio manually to improve positioning analysis.`;

  const working =
    topPosts.length > 0
      ? `Top visible posts (by public likes) use ${topPosts.map((p) => p.content_category).join(", ")} angles. Best hook styles: ${topPosts.map((p) => p.hook_type).join(", ")}. ${payload.engagement.engagement_note}`
      : "No post engagement data visible — paste captions or wait for a successful public fetch.";

  const risks =
    riskyPosts.length > 0
      ? `${riskyPosts.length} caption(s) flagged for claim risk. Bio risk: ${bio.risk_level}. Priority phrases: ${riskyPosts.flatMap((p) => p.risky_phrases.map((r) => r.phrase)).slice(0, 5).join(", ") || "sector-sensitive language"}.`
      : `No high-risk captions in this scan sample. Bio risk: ${bio.risk_level}. Continue using structure/function language.`;

  const rewriteFirst =
    riskyPosts.length > 0
      ? riskyPosts
          .slice(0, 3)
          .map((p, i) => `${i + 1}. ${p.caption_preview.slice(0, 80)}… → ${p.safer_rewrite.slice(0, 100)}…`)
          .join("\n")
      : bio.risk_level !== "Safe" && bio.risk_level !== "Low Risk"
        ? `Rewrite bio first: ${bio.safer_bio_rewrite.slice(0, 140)}…`
        : "No urgent rewrites — maintain current compliance-safe tone.";

  const gaps =
    payload.missing_categories.length > 0
      ? payload.missing_categories.join(" ")
      : `Your mix is heavy on ${topCategory}. Test educational and FAQ formats to balance promotional posts.`;

  const nextPosts = payload.weekly_ideas
    .slice(0, 7)
    .map((idea, i) => `${i + 1}. **${idea.title}** (${idea.format}) — Hook: "${idea.hook}" · ${idea.compliance_angle}`)
    .join("\n");

  const limitBody = [
    ...limitations,
    "Reach, impressions, saves, shares, and story views are unavailable from public data.",
    isCompetitor ? "Competitor insights are based on public data only." : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    { id: "positioning", title: "Account positioning", body: positioning },
    { id: "working", title: "What is working", body: working },
    { id: "risks", title: "Compliance risks", body: risks },
    { id: "rewrite", title: "Rewrite priorities", body: rewriteFirst },
    { id: "gaps", title: "Content gaps", body: gaps },
    { id: "next", title: "What to post next", body: nextPosts },
    { id: "limitations", title: "Limitations", body: limitBody },
  ];
}

export const INSTAGRAM_SOCIAL_SUMMARY_PROMPT = `
You are ClaimGuard's Instagram social monitoring strategist.
// TRADEOFF: Template summary used in production; swap to LLM when inference is configured.
`;