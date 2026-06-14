export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "reddit"
  | "x"
  | "facebook"
  | "linkedin";

export type FetchedPost = {
  post_url: string;
  caption: string;
  visible_likes: number | null;
  visible_comments: number | null;
  posted_at: string | null;
};

export type PublicFetchResult = {
  platform: SocialPlatform;
  handle: string;
  profile_url: string;
  bio: string;
  follower_count_public: number | null;
  posts: FetchedPost[];
  fetch_method: "public_fetch" | "manual_required";
  message: string;
};

const PLATFORM_PATTERNS: { platform: SocialPlatform; regex: RegExp; handleGroup: number }[] = [
  { platform: "instagram", regex: /(?:instagram\.com\/)([A-Za-z0-9._]+)/i, handleGroup: 1 },
  { platform: "tiktok", regex: /(?:tiktok\.com\/@)([A-Za-z0-9._]+)/i, handleGroup: 1 },
  { platform: "youtube", regex: /(?:youtube\.com\/(?:@|channel\/|c\/))([A-Za-z0-9._-]+)/i, handleGroup: 1 },
  { platform: "reddit", regex: /(?:reddit\.com\/(?:u|user)\/)([A-Za-z0-9._-]+)/i, handleGroup: 1 },
  { platform: "reddit", regex: /(?:reddit\.com\/r\/)([A-Za-z0-9._-]+)/i, handleGroup: 1 },
  { platform: "x", regex: /(?:(?:twitter|x)\.com\/)([A-Za-z0-9._]+)/i, handleGroup: 1 },
  { platform: "facebook", regex: /(?:facebook\.com\/)([A-Za-z0-9._-]+)/i, handleGroup: 1 },
  { platform: "linkedin", regex: /(?:linkedin\.com\/(?:company|in)\/)([A-Za-z0-9._-]+)/i, handleGroup: 1 },
];

export function parseSocialInput(input: string): { platform: SocialPlatform; handle: string; profile_url: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    for (const { platform, regex, handleGroup } of PLATFORM_PATTERNS) {
      const match = trimmed.match(regex);
      if (match?.[handleGroup]) {
        return { platform, handle: match[handleGroup].replace(/^@/, ""), profile_url: trimmed.split("?")[0] };
      }
    }
    return null;
  }

  const handle = trimmed.replace(/^@/, "");
  if (!handle) return null;
  return { platform: "instagram", handle, profile_url: `https://instagram.com/${handle}` };
}

export function detectPlatformFromUrl(url: string): SocialPlatform | null {
  const parsed = parseSocialInput(url);
  return parsed?.platform ?? null;
}

async function fetchRedditPublic(handle: string, isSubreddit: boolean): Promise<Partial<PublicFetchResult>> {
  const path = isSubreddit ? `r/${handle}/new.json?limit=10` : `user/${handle}/submitted.json?limit=10`;
  const res = await fetch(`https://www.reddit.com/${path}`, {
    headers: { "User-Agent": "ClaimGuardSocialLite/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Reddit public API unavailable.");
  const data = await res.json();
  const children = data?.data?.children || [];
  const posts: FetchedPost[] = children.map((child: { data: Record<string, unknown> }) => ({
    post_url: `https://reddit.com${child.data.permalink || ""}`,
    caption: String(child.data.title || "") + (child.data.selftext ? `\n${child.data.selftext}` : ""),
    visible_likes: typeof child.data.ups === "number" ? child.data.ups : null,
    visible_comments: typeof child.data.num_comments === "number" ? child.data.num_comments : null,
    posted_at: child.data.created_utc ? new Date(Number(child.data.created_utc) * 1000).toISOString() : null,
  }));
  return {
    bio: isSubreddit ? `Subreddit r/${handle}` : `Reddit user u/${handle}`,
    posts,
    follower_count_public: null,
    fetch_method: "public_fetch",
    message: "Fetched from Reddit public JSON API.",
  };
}

async function fetchYouTubeOembed(profileUrl: string): Promise<Partial<PublicFetchResult>> {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(profileUrl)}&format=json`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("YouTube oEmbed unavailable.");
  const data = await res.json();
  return {
    bio: String(data.author_name || ""),
    posts: data.title
      ? [{ post_url: profileUrl, caption: String(data.title), visible_likes: null, visible_comments: null, posted_at: null }]
      : [],
    follower_count_public: null,
    fetch_method: "public_fetch",
    message: "Limited YouTube public metadata via oEmbed.",
  };
}

export async function fetchPublicSocialData(
  platform: SocialPlatform,
  handle: string,
  profileUrl: string,
): Promise<PublicFetchResult> {
  const base: PublicFetchResult = {
    platform,
    handle,
    profile_url: profileUrl,
    bio: "",
    follower_count_public: null,
    posts: [],
    fetch_method: "manual_required",
    message: "We could not fetch this profile automatically. Paste captions or post links manually.",
  };

  try {
    if (platform === "reddit") {
      const isSubreddit = /reddit\.com\/r\//i.test(profileUrl);
      const partial = await fetchRedditPublic(handle, isSubreddit);
      return { ...base, ...partial, platform, handle, profile_url: profileUrl } as PublicFetchResult;
    }
    if (platform === "youtube") {
      const partial = await fetchYouTubeOembed(profileUrl);
      return { ...base, ...partial, platform, handle, profile_url: profileUrl } as PublicFetchResult;
    }
  } catch {
    // fall through to manual
  }

  return base;
}