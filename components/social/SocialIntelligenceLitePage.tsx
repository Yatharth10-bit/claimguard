"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, Instagram, LoaderCircle, Plus, ScanText, Upload, X,
} from "lucide-react";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import { BioRiskCard } from "@/components/social/monitoring/BioRiskCard";
import { CompetitorSocialCompare } from "@/components/social/monitoring/CompetitorSocialCompare";
import { ContentCategoryChart } from "@/components/social/monitoring/ContentCategoryChart";
import { DataLimitationsBanner } from "@/components/social/monitoring/DataLimitationsBanner";
import { HookLibrary } from "@/components/social/monitoring/HookLibrary";
import { InstagramAccountHeader } from "@/components/social/monitoring/InstagramAccountHeader";
import { SocialAISummary } from "@/components/social/monitoring/SocialAISummary";
import { SocialHealthCards } from "@/components/social/monitoring/SocialHealthCards";
import { SocialPostTable } from "@/components/social/monitoring/SocialPostTable";
import { parseInstagramInput } from "@/lib/socialPublicFetch";
import type { SocialScanPayload } from "@/lib/socialIntelligence";

type Account = {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  is_competitor: boolean;
  latest_scan: {
    id: string;
    overall_score: number;
    high_risk_posts_count: number;
    payload?: SocialScanPayload;
  } | null;
};

const riskStyles: Record<string, string> = {
  "High Risk": "bg-rose text-high",
  "Medium Risk": "bg-apricot text-medium",
  "Low Risk": "bg-mint text-safe",
  Safe: "bg-emerald-50 text-safe",
};

function ScanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="surface animate-pulse p-5">
          <div className="h-4 w-1/2 rounded bg-stone" />
          <div className="mt-3 h-8 w-1/3 rounded bg-stone" />
        </div>
      ))}
    </div>
  );
}

export function SocialIntelligenceLitePage() {
  const { profile, isComplete } = useBrandProfile();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeScan, setActiveScan] = useState<SocialScanPayload | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [tab, setTab] = useState<"url" | "manual">("url");

  const [form, setForm] = useState({
    input: "",
    platform: "instagram" as string,
    is_competitor: false,
    bio: "",
    follower_count: "",
    captions: "",
  });

  const activeAccountIdRef = useRef<string | null>(null);

  const scrollToAnalytics = () => {
    requestAnimationFrame(() => {
      document.getElementById("social-analytics")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/social-intelligence");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load");
      setAccounts(body.accounts || []);
      setMigrationRequired(Boolean(body.migration_required));
      const list = (body.accounts || []) as Account[];
      if (!list.length) {
        setActiveAccount(null);
        setActiveScan(null);
        activeAccountIdRef.current = null;
        return;
      }

      const preferredId = activeAccountIdRef.current;
      const pick =
        (preferredId ? list.find((a) => a.id === preferredId) : null) ||
        list.find((a) => a.latest_scan?.payload) ||
        list[0];

      setActiveAccount(pick);
      activeAccountIdRef.current = pick.id;
      setActiveScan((pick.latest_scan?.payload as SocialScanPayload) || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runScan = async (
    accountId: string,
    options?: { bio?: string; captions?: string; follower_count?: string; tryPublicFetch?: boolean; post_url?: string },
  ) => {
    setScanning(true);
    setError("");
    try {
      const manualPosts = (options?.captions ?? form.captions)
        .split(/\n---\n|\n\n(?=[A-Z])/)
        .map((c) => c.trim())
        .filter((c) => c.length > 5)
        .map((caption) => ({ caption, post_url: "", visible_likes: null, visible_comments: null }));

      const scanRes = await fetch("/api/social-intelligence/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          post_url: options?.post_url,
          bio: options?.bio ?? form.bio,
          follower_count_public: (options?.follower_count ?? form.follower_count)
            ? Number(options?.follower_count ?? form.follower_count)
            : null,
          manual_posts: manualPosts,
          try_public_fetch: options?.tryPublicFetch ?? (tab === "url" && manualPosts.length === 0),
        }),
      });
      const scanBody = await scanRes.json();
      if (!scanRes.ok) {
        if (scanRes.status === 422) {
          setPendingAccountId(accountId);
          setError(scanBody.error || "Auto-fetch failed. Paste bio and captions, then run scan again.");
          setTab("manual");
          setModalOpen(true);
          return false;
        }
        throw new Error(scanBody.error || "Scan failed");
      }

      setActiveScan(scanBody.payload);
      const scannedAccount = { ...scanBody.account, latest_scan: scanBody.scan } as Account;
      setActiveAccount(scannedAccount);
      activeAccountIdRef.current = scannedAccount.id;
      setPendingAccountId(null);
      setModalOpen(false);
      setForm({ input: "", platform: "instagram", is_competitor: false, bio: "", follower_count: "", captions: "" });
      await load();
      scrollToAnalytics();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
      return false;
    } finally {
      setScanning(false);
    }
  };

  const addAccount = async () => {
    if (!pendingAccountId && !form.input.trim()) {
      setError("Enter a profile URL or handle.");
      return;
    }
    setScanning(true);
    setError("");
    try {
      let accountId = pendingAccountId;
      let accountRecord: Account | null = activeAccount;

      const igInput = parseInstagramInput(form.input);

      if (!accountId && igInput?.kind === "post") {
        const scanRes = await fetch("/api/social-intelligence/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post_url: igInput.post_url,
            bio: form.bio,
            is_competitor: form.is_competitor,
            manual_posts: form.captions
              .split(/\n---\n|\n\n(?=[A-Z])/)
              .map((c) => c.trim())
              .filter((c) => c.length > 5)
              .map((caption) => ({ caption, post_url: igInput.post_url })),
            try_public_fetch: true,
          }),
        });
        const scanBody = await scanRes.json();
        if (!scanRes.ok) {
          if (scanRes.status === 422) {
            setError(scanBody.error || "Auto-fetch failed. Paste the caption manually.");
            setTab("manual");
            return;
          }
          throw new Error(scanBody.error || "Scan failed");
        }
        setActiveScan(scanBody.payload);
        setActiveAccount({ ...scanBody.account, latest_scan: scanBody.scan });
        activeAccountIdRef.current = scanBody.account.id;
        setModalOpen(false);
        await load();
        scrollToAnalytics();
        setScanning(false);
        return;
      }

      if (!accountId) {
        const accRes = await fetch("/api/social-intelligence/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: form.input,
            platform: "instagram",
            is_competitor: form.is_competitor,
          }),
        });
        const accBody = await accRes.json();
        if (!accRes.ok) throw new Error(accBody.error || "Failed to add account");
        accountId = accBody.account.id;
        accountRecord = accBody.account;
        setActiveAccount(accBody.account);
        activeAccountIdRef.current = accBody.account.id;
      }

      await runScan(accountId!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
      setScanning(false);
    }
  };

  const selectAccount = async (account: Account) => {
    setActiveAccount(account);
    activeAccountIdRef.current = account.id;
    setError("");
    if (account.latest_scan?.payload) {
      setActiveScan(account.latest_scan.payload as SocialScanPayload);
      scrollToAnalytics();
      return;
    }
    setActiveScan(null);
    scrollToAnalytics();
    await runScan(account.id, { tryPublicFetch: true });
  };

  const scan = activeScan;
  const health = scan?.health_overview;

  return (
    <div className="space-y-6">
      <DataLimitationsBanner limitations={scan?.limitations} />

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
        <p className="font-bold text-ink">Instagram Claim Intelligence · Social Monitoring</p>
        <p className="mt-1 text-muted">
          Free public Instagram claim audit — compliance risk scanner, safer rewrites, and competitor content intelligence.
          {isComplete && profile?.sector ? ` Tuned for ${profile.sector} brands.` : ""}
        </p>
      </div>

      {migrationRequired && (
        <div className="surface border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-bold">Database migration needed</p>
          <p className="mt-1 text-muted">Run <code className="text-xs">supabase/deploy-all.sql</code> in Supabase SQL Editor. Manual paste still works after migration.</p>
        </div>
      )}

      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Paste @handle, profile URL, post/reel URL, or competitor handle.</p>
        <button type="button" className="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Scan Instagram
        </button>
      </div>

      {loading ? (
        <ScanSkeleton />
      ) : (
        <>
          {accounts.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((a) => {
                const hasAnalytics = Boolean(a.latest_scan?.payload);
                const score = a.latest_scan?.overall_score;
                const isActive = activeAccount?.id === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={scanning && isActive}
                    onClick={() => void selectAccount(a)}
                    className={`surface text-left p-4 transition hover:-translate-y-0.5 ${isActive ? "ring-2 ring-lavender" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold capitalize">{a.platform} @{a.handle}</p>
                        {a.is_competitor && <p className="mt-1 text-xs text-muted">Competitor</p>}
                      </div>
                      {hasAnalytics ? (
                        <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-safe">{score ?? "—"}/100</span>
                      ) : (
                        <span className="rounded-full bg-apricot/30 px-2.5 py-1 text-xs font-bold text-medium">No scan</span>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      {hasAnalytics
                        ? `${a.latest_scan?.high_risk_posts_count ?? 0} high-risk posts · View analytics below`
                        : scanning && isActive
                          ? "Fetching public profile…"
                          : "Click to fetch & open analytics"}
                    </p>
                    {a.profile_url && (
                      <a
                        href={a.profile_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-lavender"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open profile ↗
                      </a>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeAccount && !scan && !scanning && (
            <div id="social-analytics" className="surface scroll-mt-6 border-amber-100 bg-amber-50/60 p-6 text-center">
              <ScanText size={32} className="mx-auto text-medium" />
              <h3 className="mt-4 text-lg font-bold">No analytics yet for @{activeAccount.handle}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                This account was saved but never scanned (or auto-fetch failed). Run a scan to see health scores, post risks, and safer rewrites.
              </p>
              <button
                type="button"
                className="primary mt-5"
                onClick={() => void runScan(activeAccount.id, { tryPublicFetch: true })}
              >
                <ScanText size={16} /> Run scan now
              </button>
              <button
                type="button"
                className="secondary mt-3 ml-2"
                onClick={() => {
                  setPendingAccountId(activeAccount.id);
                  setForm((f) => ({ ...f, input: activeAccount.profile_url || `@${activeAccount.handle}` }));
                  setModalOpen(true);
                  setTab("manual");
                }}
              >
                Paste captions manually
              </button>
            </div>
          )}

          {scanning && !scan && (
            <div id="social-analytics" className="surface scroll-mt-6 p-8 text-center">
              <LoaderCircle size={32} className="mx-auto animate-spin text-lavender" />
              <p className="mt-4 font-bold">Scanning @{activeAccount?.handle || "profile"}…</p>
              <p className="mt-2 text-sm text-muted">Fetching public bio and captions, then running claim analysis.</p>
            </div>
          )}

          {!scan && accounts.length === 0 && (
            <div className="surface p-10 text-center">
              <Instagram size={36} className="mx-auto text-muted" />
              <h3 className="mt-4 text-lg font-bold">Start your free Instagram claim scan</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Paste a public Instagram handle, profile URL, post URL, or reel URL. Add competitor handles to compare claim patterns.
              </p>
              <button type="button" className="primary mt-6" onClick={() => setModalOpen(true)}>
                <ScanText size={16} /> Run free public scan
              </button>
              {!isComplete && (
                <p className="mt-4 text-xs text-muted">
                  <Link href="/onboarding" className="font-semibold text-lavender">Complete onboarding</Link> for sector-specific claim detection.
                </p>
              )}
            </div>
          )}

          {scan && health && (
            <div id="social-analytics" className="scroll-mt-6 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{scan.estimated_label}</p>

              <SocialHealthCards scan={scan} />

              {scan.account_overview && (
                <InstagramAccountHeader
                  account={scan.account_overview}
                  isCompetitor={activeAccount?.is_competitor}
                />
              )}

              <CompetitorSocialCompare accounts={accounts} />

              <div className="grid gap-5 lg:grid-cols-2">
                <BioRiskCard bio={scan.bio} label={scan.estimated_label} />
                <section className="surface p-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-lavender" />
                    <h3 className="font-bold">Instagram performance intelligence</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted">{scan.engagement.engagement_note}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted">~Avg likes</span><p className="font-bold">{scan.engagement.avg_likes ?? "Unavailable from public data."}</p></div>
                    <div><span className="text-muted">~Avg comments</span><p className="font-bold">{scan.engagement.avg_comments ?? "—"}</p></div>
                    <div><span className="text-muted">~Engagement rate</span><p className="font-bold">{scan.engagement.engagement_rate_estimate != null ? `~${scan.engagement.engagement_rate_estimate}%` : "Unavailable from public data."}</p></div>
                    <div><span className="text-muted">~Caption length</span><p className="font-bold">{scan.engagement.avg_caption_length ?? "—"}</p></div>
                  </div>
                  {scan.engagement.best_posts.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-muted">Best visible posts</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted">{scan.engagement.best_posts.map((p, i) => <li key={i}>· {p}</li>)}</ul>
                    </div>
                  )}
                  {scan.engagement.highest_risk_posts && scan.engagement.highest_risk_posts.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-muted">Highest-risk posts</p>
                      <ul className="mt-2 space-y-1 text-sm text-high">{scan.engagement.highest_risk_posts.map((p, i) => <li key={i}>· {p}</li>)}</ul>
                    </div>
                  )}
                </section>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <ContentCategoryChart scan={scan} />
                <HookLibrary scan={scan} />
              </div>

              <SocialPostTable posts={scan.posts} label={scan.estimated_label} />

              {scan.posts.some((p) => p.risky_phrases.length > 0) && (
                <section className="surface p-5">
                  <h3 className="font-bold">Claim risk detection</h3>
                  <div className="mt-4 space-y-3">
                    {scan.posts.flatMap((p) => p.risky_phrases).slice(0, 12).map((r, i) => (
                      <div key={i} className="rounded-xl bg-stone p-4 text-sm">
                        <p className="font-bold">{r.phrase}</p>
                        <p className="mt-1 text-muted">{r.why}</p>
                        <p className="mt-2 text-safe"><strong>Safer:</strong> {r.safer}</p>
                        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${riskStyles[r.severity === "high" ? "High Risk" : r.severity === "medium" ? "Medium Risk" : "Low Risk"]}`}>{r.severity}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {scan.strategic_summary && scan.strategic_summary.length > 0 && (
                <SocialAISummary sections={scan.strategic_summary} />
              )}

              <section className="surface p-5">
                <h3 className="font-bold">Quick insights</h3>
                <ul className="mt-4 space-y-4">
                  {scan.insights.map((ins, i) => (
                    <li key={i} className="text-sm">
                      <p className="font-bold">{ins.title}</p>
                      <p className="mt-1 text-muted">{ins.description}</p>
                      <p className="mt-2 text-xs font-semibold text-lavender">{ins.action}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {scan.competitor_note && (
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-stone p-4 text-sm text-muted">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  {scan.competitor_note}
                </div>
              )}

              <Link href="/claim-checker" className="secondary inline-flex">
                Deep-check a caption in Claim Checker <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center" onClick={() => setModalOpen(false)}>
          <div className="surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Instagram public scan</h3>
                <p className="mt-1 text-xs text-muted">Profile, post, or reel URL · manual fallback if blocked</p>
              </div>
              <button type="button" className="secondary !px-2.5 !py-2" onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className={tab === "url" ? "primary" : "secondary"} onClick={() => setTab("url")}>Profile link</button>
              <button type="button" className={tab === "manual" ? "primary" : "secondary"} onClick={() => setTab("manual")}>Manual paste</button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">{tab === "url" ? "Instagram @handle, profile, post, or reel URL" : "Handle (for labeling)"}</label>
                <input className="input" value={form.input} onChange={(e) => setForm({ ...form, input: e.target.value })} placeholder="@brand · instagram.com/brand · instagram.com/p/… · instagram.com/reel/…" />
              </div>
              {tab === "manual" && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs text-muted">
                  <p className="font-bold text-ink">Public scan limited</p>
                  <p className="mt-1">Instagram did not expose enough public data. Paste bio and captions below — ClaimGuard will still generate a full claim risk report.</p>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_competitor} onChange={(e) => setForm({ ...form, is_competitor: e.target.checked })} />
                Competitor account
              </label>
              {(tab === "manual" || form.bio || form.captions) && (
                <>
                  <div>
                    <label className="label">Bio / profile description</label>
                    <textarea className="input min-h-20 resize-none" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Paste profile bio..." />
                  </div>
                  <div>
                    <label className="label">Public follower count (optional)</label>
                    <input className="input" type="number" value={form.follower_count} onChange={(e) => setForm({ ...form, follower_count: e.target.value })} placeholder="Only if publicly visible" />
                  </div>
                  <div>
                    <label className="label">Captions (one per block, separate with blank line)</label>
                    <textarea className="input min-h-40 resize-none font-mono text-sm" value={form.captions} onChange={(e) => setForm({ ...form, captions: e.target.value })} placeholder={"Post 1 caption...\n\nPost 2 caption..."} />
                  </div>
                </>
              )}
              {tab === "manual" && (
                <p className="text-xs text-muted">
                  <Upload size={12} className="inline" /> Paste bio + captions when auto-fetch is unavailable.
                </p>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" className="primary" disabled={scanning} onClick={() => void addAccount()}>
                {scanning ? <LoaderCircle size={16} className="animate-spin" /> : <ScanText size={16} />}
                {scanning ? "Scanning..." : "Run scan"}
              </button>
              <button type="button" className="secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}