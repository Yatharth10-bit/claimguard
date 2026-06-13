"use client";

import { useCallback, useEffect, useState } from "react";
import { Instagram, LoaderCircle, Plus, ScanText } from "lucide-react";
import { useProducts } from "@/contexts/WorkspaceDataContext";

type Connection = {
  id: string;
  platform: string;
  account_handle: string;
};

type Post = {
  id: string;
  caption: string;
  scan_status: string;
  platform: string;
  created_at: string;
  flags: { phrase: string; severity: string; rewrite_suggestion: string }[];
  social_connections?: { platform: string; account_handle: string };
};

const riskStyles: Record<string, string> = {
  flagged: "bg-rose text-high",
  clean: "bg-mint text-safe",
  pending: "bg-stone text-muted",
  high: "bg-rose text-high",
  medium: "bg-apricot text-medium",
  low: "bg-mint text-safe",
};

export function SocialMonitorPage() {
  const { products } = useProducts();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");
  const [handle, setHandle] = useState("");
  const [caption, setCaption] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [productId, setProductId] = useState("");
  const [addingConnection, setAddingConnection] = useState(false);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [connRes, postRes] = await Promise.all([
        fetch("/api/social-connections"),
        fetch("/api/social-posts"),
      ]);
      const connBody = await connRes.json();
      const postBody = await postRes.json();
      if (!connRes.ok) throw new Error(connBody.error || "Failed to load connections");
      if (!postRes.ok) throw new Error(postBody.error || "Failed to load posts");
      const conns = connBody.connections || [];
      setConnections(conns);
      setPosts(postBody.posts || []);
      if (!connectionId && conns[0]) setConnectionId(conns[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addConnection = async () => {
    if (!handle.trim()) {
      setError("Account handle is required.");
      return;
    }
    setAddingConnection(true);
    setError("");
    try {
      const res = await fetch("/api/social-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, account_handle: handle }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add connection");
      setHandle("");
      await load();
      if (body.connection?.id) setConnectionId(body.connection.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add connection");
    } finally {
      setAddingConnection(false);
    }
  };

  const scanCaption = async () => {
    if (!connectionId) {
      setError("Add a social account first.");
      return;
    }
    if (!caption.trim()) {
      setError("Caption is required.");
      return;
    }
    setScanning(true);
    setError("");
    try {
      const res = await fetch("/api/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connection_id: connectionId,
          caption,
          product_id: productId || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Scan failed");
      setCaption("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="surface border-rose/30 bg-rose/10 p-4 text-sm text-high">{error}</div>}

      <section className="surface p-5">
        <h3 className="font-bold">Connect social account</h3>
        <p className="mt-1 text-sm text-muted">Track handles and scan captions manually (OAuth sync coming later).</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Platform</label>
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value as "instagram" | "tiktok")}>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
          <div>
            <label className="label">Handle</label>
            <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@brand" />
          </div>
          <div className="flex items-end">
            <button type="button" className="primary w-full" disabled={addingConnection} onClick={() => void addConnection()}>
              {addingConnection ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
              Add account
            </button>
          </div>
        </div>
        {connections.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {connections.map((c) => (
              <span key={c.id} className="rounded-full bg-stone px-3 py-1 text-xs font-bold capitalize">
                {c.platform} @{c.account_handle}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="surface p-5">
        <h3 className="font-bold">Scan caption</h3>
        <p className="mt-1 text-sm text-muted">Check FTC disclosure and FDA claim risk before posting.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Account</label>
            <select className="input" value={connectionId} onChange={(e) => setConnectionId(e.target.value)}>
              <option value="">Select account</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.platform} @{c.account_handle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Product context (optional)</label>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">General scan</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Caption</label>
          <textarea className="input min-h-32 resize-none" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <button type="button" className="primary mt-4" disabled={scanning} onClick={() => void scanCaption()}>
          {scanning ? <LoaderCircle size={16} className="animate-spin" /> : <ScanText size={16} />}
          Scan caption
        </button>
      </section>

      {loading ? (
        <div className="surface flex items-center gap-2 p-8 text-sm text-muted"><LoaderCircle size={18} className="animate-spin" /> Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="surface p-10 text-center">
          <Instagram size={32} className="mx-auto text-muted" />
          <h3 className="mt-4 font-bold">No scanned posts yet</h3>
          <p className="mt-2 text-sm text-muted">Add an account and scan your first caption.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div key={post.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    {post.social_connections?.platform || post.platform}
                    {post.social_connections?.account_handle ? ` @${post.social_connections.account_handle}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6">{post.caption.slice(0, 280)}{post.caption.length > 280 ? "…" : ""}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${riskStyles[post.scan_status] || riskStyles.pending}`}>
                  {post.scan_status}
                </span>
              </div>
              {post.flags?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {post.flags.map((flag, i) => (
                    <div key={i} className="rounded-xl bg-stone p-3 text-sm">
                      <p className="font-medium">{flag.phrase}</p>
                      <p className="mt-1 text-muted">{flag.rewrite_suggestion}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${riskStyles[flag.severity]}`}>{flag.severity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}