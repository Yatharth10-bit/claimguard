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

/** Public web client id used by instagram.com (same as their logged-out web app). */
const INSTAGRAM_WEB_APP_ID = "936619743392459";

const INSTAGRAM_RESERVED = new Set([
  "p", "reel", "reels", "stories", "explore", "accounts", "direct", "tv", "about", "legal", "api",
]);

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "*/*",
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
        const handle = match[handleGroup].replace(/^@/, "");
        if (platform === "instagram" && INSTAGRAM_RESERVED.has(handle.toLowerCase())) continue;
        return { platform, handle, profile_url: trimmed.split("?")[0] };
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

type InstagramTimelineNode = {
  shortcode?: string;
  edge_media_to_caption?: { edges?: { node?: { text?: string } }[] };
  edge_liked_by?: { count?: number };
  edge_media_to_comment?: { count?: number };
  taken_at_timestamp?: number;
};

function mapInstagramPosts(edges: { node?: InstagramTimelineNode }[] | undefined, handle: string): FetchedPost[] {
  if (!edges?.length) return [];
  return edges.slice(0, 12).map(({ node }) => {
    const shortcode = node?.shortcode || "";
    const caption = node?.edge_media_to_caption?.edges?.[0]?.node?.text || "";
    return {
      post_url: shortcode ? `https://www.instagram.com/p/${shortcode}/` : `https://www.instagram.com/${handle}/`,
      caption,
      visible_likes: typeof node?.edge_liked_by?.count === "number" ? node.edge_liked_by.count : null,
      visible_comments: typeof node?.edge_media_to_comment?.count === "number" ? node.edge_media_to_comment.count : null,
      posted_at: node?.taken_at_timestamp
        ? new Date(node.taken_at_timestamp * 1000).toISOString()
        : null,
    };
  }).filter((p) => p.caption.trim().length > 0);
}

async function fetchInstagramWebProfileInfo(handle: string): Promise<Partial<PublicFetchResult>> {
  const username = handle.replace(/^@/, "").trim();
  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    {
      headers: {
        ...BROWSER_HEADERS,
        "X-IG-App-ID": INSTAGRAM_WEB_APP_ID,
        "X-Requested-With": "XMLHttpRequest",
        Referer: `https://www.instagram.com/${username}/`,
      },
      signal: AbortSignal.timeout(12000),
    },
  );

  if (!res.ok) {
    throw new Error(`Instagram profile API returned ${res.status}`);
  }

  const json = await res.json();
  const user = json?.data?.user;
  if (!user) throw new Error("Instagram profile payload missing user.");

  const bio = String(user.biography || "").trim();
  const follower_count_public =
    typeof user.edge_followed_by?.count === "number" ? user.edge_followed_by.count : null;
  const posts = mapInstagramPosts(user.edge_owner_to_timeline_media?.edges, username);

  if (!bio && !posts.length) {
    throw new Error("Instagram returned an empty public profile.");
  }

  return {
    bio,
    follower_count_public,
    posts,
    fetch_method: "public_fetch",
    message: `Fetched public Instagram profile @${username} (${posts.length} recent posts).`,
  };
}

async function fetchInstagramHtmlFallback(handle: string): Promise<Partial<PublicFetchResult>> {
  const username = handle.replace(/^@/, "").trim();
  const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: {
      ...BROWSER_HEADERS,
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Instagram HTML returned ${res.status}`);

  const html = await res.text();
  const bioMatch =
    html.match(/"biography":"((?:\\.|[^"\\])*)"/)?.[1]
    || html.match(/property="og:description" content="([^"]+)"/)?.[1];
  const bio = bioMatch
    ? bioMatch.replace(/\\n/g, "\n").replace(/\\u([\dA-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    : "";

  const posts: FetchedPost[] = [];
  const captionRegex = /"edge_media_to_caption":\{"edges":\[\{"node":\{"text":"((?:\\.|[^"\\])*)"/g;
  const shortcodeRegex = /"shortcode":"([A-Za-z0-9_-]+)"/g;
  const captions: string[] = [];
  const shortcodes: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = captionRegex.exec(html)) !== null && captions.length < 12) {
    captions.push(m[1].replace(/\\n/g, "\n"));
  }
  while ((m = shortcodeRegex.exec(html)) !== null && shortcodes.length < 12) {
    shortcodes.push(m[1]);
  }
  for (let i = 0; i < Math.min(captions.length, shortcodes.length, 12); i++) {
    posts.push({
      post_url: `https://www.instagram.com/p/${shortcodes[i]}/`,
      caption: captions[i],
      visible_likes: null,
      visible_comments: null,
      posted_at: null,
    });
  }

  if (!bio && !posts.length) {
    throw new Error("Instagram HTML did not contain public profile data (login wall or private account).");
  }

  return {
    bio: bio.trim(),
    posts,
    follower_count_public: null,
    fetch_method: "public_fetch",
    message: `Fetched public Instagram profile @${username} from page HTML (${posts.length} captions).`,
  };
}

async function fetchInstagramPublic(handle: string): Promise<Partial<PublicFetchResult>> {
  const errors: string[] = [];
  for (const attempt of [
    () => fetchInstagramWebProfileInfo(handle),
    () => fetchInstagramHtmlFallback(handle),
  ]) {
    try {
      return await attempt();
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Unknown error");
    }
  }
  throw new Error(errors.join(" | "));
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
    message:
      "We could not fetch this profile automatically. Instagram may block server requests — paste captions or bio manually.",
  };

  try {
    if (platform === "instagram") {
      const partial = await fetchInstagramPublic(handle);
      return { ...base, ...partial, platform, handle, profile_url: profileUrl } as PublicFetchResult;
    }
    if (platform === "reddit") {
      const isSubreddit = /reddit\.com\/r\//i.test(profileUrl);
      const partial = await fetchRedditPublic(handle, isSubreddit);
      return { ...base, ...partial, platform, handle, profile_url: profileUrl } as PublicFetchResult;
    }
    if (platform === "youtube") {
      const partial = await fetchYouTubeOembed(profileUrl);
      return { ...base, ...partial, platform, handle, profile_url: profileUrl } as PublicFetchResult;
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "";
    return {
      ...base,
      message: detail
        ? `Public Instagram fetch failed: ${detail} Paste bio and captions manually if needed.`
        : base.message,
    };
  }

  return base;
}