"use client";

import { useMemo, useState } from "react";
import type { PostAnalysis } from "@/lib/socialIntelligence";
import { ClaimRiskBadge } from "./ClaimRiskBadge";

const PAGE_SIZE = 10;

export function SocialPostTable({ posts, label }: { posts: PostAnalysis[]; label: string }) {
  const [page, setPage] = useState(0);
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (riskFilter === "all") return posts;
    return posts.filter((p) => p.risk_level === riskFilter);
  }, [posts, riskFilter]);

  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <section className="surface overflow-hidden p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Public post analysis</h3>
          <p className="mt-1 text-xs text-muted">{label}</p>
        </div>
        <select
          className="input !w-auto !py-1.5 text-sm"
          value={riskFilter}
          onChange={(e) => {
            setRiskFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All risk levels</option>
          <option value="High Risk">High Risk</option>
          <option value="Medium Risk">Medium Risk</option>
          <option value="Low Risk">Low Risk</option>
          <option value="Safe">Safe</option>
          <option value="Needs Review">Needs Review</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No posts match this filter. Paste captions in a new scan.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3">Caption</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">~Likes</th>
                  <th className="py-2 pr-3">Comments</th>
                  <th className="py-2 pr-3">Risk</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Hook</th>
                  <th className="py-2">CTA</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((post, i) => (
                  <tr key={`${post.post_url}-${i}`} className="border-b border-slate-100 align-top">
                    <td className="max-w-xs py-3 pr-3">
                      <p>{post.caption_preview}</p>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{post.safer_rewrite}</p>
                    </td>
                    <td className="py-3 pr-3 capitalize">{post.post_type}</td>
                    <td className="py-3 pr-3">{post.visible_likes ?? "—"}</td>
                    <td className="py-3 pr-3">{post.visible_comments ?? "—"}</td>
                    <td className="py-3 pr-3">
                      <ClaimRiskBadge level={post.risk_level} />
                    </td>
                    <td className="py-3 pr-3 text-xs">{post.content_category}</td>
                    <td className="py-3 pr-3 text-xs">{post.hook_type ?? "Other"}</td>
                    <td className="py-3 text-xs">{post.cta_type ?? "No CTA"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted">
                Page {page + 1} of {totalPages} · {filtered.length} posts
              </span>
              <div className="flex gap-2">
                <button type="button" className="secondary !py-1.5 text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button type="button" className="secondary !py-1.5 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}