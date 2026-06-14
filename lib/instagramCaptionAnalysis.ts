/**
 * Rule-based Instagram caption intelligence (hook, CTA, hashtags).
 * // TRADEOFF: LLM caption analysis would be richer but requires paid inference; rules + ClaimGuard engine suffice for compliance risk.
 */

export type HookType =
  | "Question"
  | "Bold claim"
  | "Before/after"
  | "Problem-agitation"
  | "Founder story"
  | "Myth-busting"
  | "Educational"
  | "Listicle"
  | "Curiosity gap"
  | "Offer-led"
  | "Testimonial"
  | "Other";

export type CtaType =
  | "Shop now"
  | "Comment"
  | "DM us"
  | "Save this"
  | "Share this"
  | "Link in bio"
  | "Follow"
  | "Try now"
  | "Book call"
  | "No CTA";

export type PostTypeLabel = "image" | "carousel" | "reel" | "unknown";

export type CaptionIntelligence = {
  hook_text: string;
  hook_type: HookType;
  cta_type: CtaType;
  tone: string;
  hashtag_count: number;
  hashtags: string[];
  caption_length: number;
  confidence_score: number;
};

export const INSTAGRAM_CAPTION_ANALYSIS_PROMPT = `
You are ClaimGuard's Instagram compliance and content intelligence engine.
Analyze captions for claim risk, hooks, CTAs, and safer rewrites.
// TRADEOFF: Reserved for optional LLM enrichment — current build uses rules + analyzeClaim().
`;

export function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[\w\u00C0-\u024F]+/g) || [];
  return [...new Set(matches.map((h) => h.toLowerCase()))];
}

export function extractHookText(caption: string): string {
  const trimmed = caption.trim();
  if (!trimmed) return "";
  const firstLine = trimmed.split(/\n/)[0]?.trim() || trimmed;
  const sentence = firstLine.split(/(?<=[.!?])\s+/)[0] || firstLine;
  return sentence.slice(0, 120);
}

export function detectHookType(caption: string): HookType {
  const t = caption.toLowerCase();
  const hook = extractHookText(caption).toLowerCase();
  if (/\?/.test(hook) || /^(did you|have you|what if|why do)/i.test(hook)) return "Question";
  if (/before.{0,15}after|transformation/i.test(t)) return "Before/after";
  if (/myth|truth is|actually|stop believing/i.test(t)) return "Myth-busting";
  if (/^\d+\s|top \d|ways to|steps to/i.test(hook)) return "Listicle";
  if (/founder|our story|why we started|journey/i.test(t)) return "Founder story";
  if (/review|testimonial|customer said|★|stars/i.test(t)) return "Testimonial";
  if (/% off|sale|limited|shop now|use code/i.test(hook)) return "Offer-led";
  if (/secret|you won't believe|here's why|nobody talks/i.test(t)) return "Curiosity gap";
  if (/tired of|struggling|frustrated|problem/i.test(t)) return "Problem-agitation";
  if (/learn|tip|how to|did you know|guide/i.test(t)) return "Educational";
  if (/(cure|guarantee|results in|clinically|proven to|make you)/i.test(hook)) return "Bold claim";
  return "Other";
}

export function detectCtaType(caption: string): CtaType {
  const t = caption.toLowerCase();
  if (/shop now|buy now|order now|get yours|add to cart/i.test(t)) return "Shop now";
  if (/link in bio|tap the link|bio link/i.test(t)) return "Link in bio";
  if (/dm us|send a dm|message us/i.test(t)) return "DM us";
  if (/comment below|drop a|let us know|tell us/i.test(t)) return "Comment";
  if (/save this|bookmark/i.test(t)) return "Save this";
  if (/share this|tag a friend|repost/i.test(t)) return "Share this";
  if (/follow (us|for|@)|follow along/i.test(t)) return "Follow";
  if (/try now|try it|free trial/i.test(t)) return "Try now";
  if (/book (a )?call|schedule|consultation/i.test(t)) return "Book call";
  return "No CTA";
}

export function detectTone(caption: string): string {
  const t = caption.toLowerCase();
  if (/urgent|last chance|hurry|today only/i.test(t)) return "urgent";
  if (/study|clinical|research|dermatologist|doctor/i.test(t)) return "clinical";
  if (/fear|warning|don't ignore|risk of/i.test(t)) return "fear_based";
  if (/dream|aspire|confidence|glow up/i.test(t)) return "aspirational";
  if (/story|journey|founder|we started/i.test(t)) return "storytelling";
  if (/learn|tip|how to/i.test(t)) return "educational";
  if (/% off|sale|shop|buy/i.test(t)) return "promotional";
  if (/love|happy|friend|community/i.test(t)) return "friendly";
  return "other";
}

export function analyzeCaptionIntelligence(caption: string): CaptionIntelligence {
  const hashtags = extractHashtags(caption);
  const hook_type = detectHookType(caption);
  const cta_type = detectCtaType(caption);
  const hook_text = extractHookText(caption);
  let confidence_score = 55;
  if (caption.length > 40) confidence_score += 15;
  if (hook_type !== "Other") confidence_score += 15;
  if (cta_type !== "No CTA") confidence_score += 10;
  if (hashtags.length > 0) confidence_score += 5;
  return {
    hook_text,
    hook_type,
    cta_type,
    tone: detectTone(caption),
    hashtag_count: hashtags.length,
    hashtags: hashtags.slice(0, 20),
    caption_length: caption.length,
    confidence_score: Math.min(95, confidence_score),
  };
}

export function detectPostTypeFromUrl(postUrl: string): PostTypeLabel {
  if (/instagram\.com\/reel\//i.test(postUrl)) return "reel";
  if (/instagram\.com\/p\//i.test(postUrl)) return "image";
  return "unknown";
}

export function buildHookBreakdown(
  items: { hook_type: HookType }[],
): { hook_type: HookType; count: number }[] {
  const map = new Map<HookType, number>();
  for (const item of items) {
    map.set(item.hook_type, (map.get(item.hook_type) || 0) + 1);
  }
  return [...map.entries()]
    .map(([hook_type, count]) => ({ hook_type, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildCtaBreakdown(
  items: { cta_type: CtaType }[],
): { cta_type: CtaType; count: number }[] {
  const map = new Map<CtaType, number>();
  for (const item of items) {
    map.set(item.cta_type, (map.get(item.cta_type) || 0) + 1);
  }
  return [...map.entries()]
    .map(([cta_type, count]) => ({ cta_type, count }))
    .sort((a, b) => b.count - a.count);
}