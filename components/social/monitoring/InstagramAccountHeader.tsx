import type { AccountOverview } from "@/lib/socialIntelligence";
import { ExternalLink, Instagram } from "lucide-react";

export function InstagramAccountHeader({
  account,
  isCompetitor,
}: {
  account: AccountOverview;
  isCompetitor?: boolean;
}) {
  const missing = (v: unknown) => v == null || v === "";

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          {account.profile_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={account.profile_image_url} alt="" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <Instagram size={28} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">@{account.handle}</h3>
            {isCompetitor && (
              <span className="rounded-full bg-stone px-2 py-0.5 text-xs font-bold text-muted">Competitor</span>
            )}
          </div>
          {account.display_name && account.display_name !== account.handle && (
            <p className="text-sm text-muted">{account.display_name}</p>
          )}
          {account.bio ? (
            <p className="mt-2 text-sm">{account.bio}</p>
          ) : (
            <p className="mt-2 text-sm italic text-muted">
              Instagram did not expose a public bio. Paste details manually to improve the scan.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span>
              <span className="text-muted">Followers </span>
              <strong>{missing(account.follower_count_public) ? "Unavailable from public data." : account.follower_count_public?.toLocaleString()}</strong>
            </span>
            <span>
              <span className="text-muted">Following </span>
              <strong>{missing(account.following_count_public) ? "—" : account.following_count_public?.toLocaleString()}</strong>
            </span>
            <span>
              <span className="text-muted">Posts </span>
              <strong>{missing(account.post_count_public) ? "—" : account.post_count_public?.toLocaleString()}</strong>
            </span>
          </div>
          {account.website_url && (
            <a href={account.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-lavender">
              {account.website_url} <ExternalLink size={12} />
            </a>
          )}
          {account.profile_url && (
            <a href={account.profile_url} target="_blank" rel="noreferrer" className="mt-2 ml-3 inline-flex items-center gap-1 text-xs font-semibold text-lavender">
              Open profile <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}