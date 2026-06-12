import { REGULATORY_SOURCES, type RegulatorySource } from "@/lib/regulatorySources";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type SyncedRegulation = {
  organization: string;
  country: string;
  category: string;
  title: string;
  summary: string;
  official_url: string;
  date_found: string;
  status: string;
};

const OFFICIAL_HOSTS = new Set(REGULATORY_SOURCES.map((source) => new URL(source.url).hostname));

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lrm;|&rlm;/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, source: RegulatorySource) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const description = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i)?.[1];
  const cleanTitle = decodeHtml(title || source.title);
  const cleanDescription = decodeHtml(description || "");
  return {
    organization: source.organization,
    country: source.country,
    category: source.category,
    title: (cleanTitle || source.title).slice(0, 300),
    summary: (cleanDescription.length >= 40 ? cleanDescription : source.summary).slice(0, 700),
    official_url: source.url,
    date_found: new Date().toISOString(),
    status: "published",
  };
}

function seededFallback(source: RegulatorySource): SyncedRegulation {
  return {
    organization: source.organization,
    country: source.country,
    category: source.category,
    title: source.title,
    summary: source.summary,
    official_url: source.url,
    date_found: new Date().toISOString(),
    status: "published",
  };
}

async function fetchOfficialSource(source: RegulatorySource): Promise<SyncedRegulation> {
  const url = new URL(source.url);
  if (!OFFICIAL_HOSTS.has(url.hostname)) throw new Error("Source host is not allowlisted.");
  const response = await fetch(source.url, {
    headers: { "User-Agent": "ClaimGuard-Regulation-Sync/1.0" },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Official source returned ${response.status}.`);
  return extractMeta(await response.text(), source);
}

export async function syncRegulations() {
  const updates = await Promise.all(REGULATORY_SOURCES.map(async (source) => {
    if (!source.liveSync) return seededFallback(source);
    try {
      return await fetchOfficialSource(source);
    } catch {
      return seededFallback(source);
    }
  }));

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from("regulation_updates").upsert(updates, { onConflict: "official_url" }).select();
    if (!error) return { updates: data || updates, persisted: true };
  }
  return { updates, persisted: false };
}
