"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { AmazonListingsTab } from "@/components/amazon/AmazonListingsTab";
import { InfluencerTab } from "@/components/influencer/InfluencerTab";
import { LabelScansTab } from "@/components/label/LabelScansTab";
import { SubstantiationTab } from "@/components/substantiation/SubstantiationTab";
import { useProducts } from "@/contexts/WorkspaceDataContext";

const TABS = ["overview", "amazon", "label", "influencer", "substantiation"] as const;

export function ProductDetailPage({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TABS.includes(tabParam as (typeof TABS)[number])
    ? (tabParam as (typeof TABS)[number])
    : "overview";
  const listingId = searchParams.get("listing");
  const { products, loading } = useProducts();
  const product = products.find((p) => p.id === productId);

  if (loading) {
    return <div className="surface p-8 text-sm text-muted">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="surface p-8 text-center">
        <p className="font-bold">Product not found</p>
        <Link href="/products" className="primary mt-4 inline-flex">Back to products</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/products" className="secondary mb-5 inline-flex"><ArrowLeft size={16} /> Products</Link>
      <div className="surface p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Package size={22} /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-.03em]">{product.name}</h1>
            <p className="mt-1 text-sm text-muted">{product.category} · {product.market || "United States"}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/products/${productId}?tab=${t}`}
              className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === t ? "bg-ink text-white" : "bg-stone text-muted hover:text-ink"}`}
            >
              {t === "amazon" ? "Amazon Listings" : t}
            </Link>
          ))}
        </div>
        <div className="mt-6">
          {tab === "overview" && (
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div><span className="text-muted">Ingredients</span><p className="mt-1 font-medium">{product.ingredients.length ? product.ingredients.join(", ") : "None listed"}</p></div>
              <div><span className="text-muted">Claims checked</span><p className="mt-1 font-medium">{product.checks}</p></div>
              <div><span className="text-muted">Platforms</span><p className="mt-1 font-medium">{product.platforms?.join(", ") || "—"}</p></div>
              <div><span className="text-muted">Last scanned</span><p className="mt-1 font-medium">{product.lastScanned}</p></div>
              <Link href={`/claim-checker?product=${productId}`} className="primary mt-2 w-fit">Check a claim</Link>
            </div>
          )}
          {tab === "amazon" && <AmazonListingsTab productId={productId} initialListingId={listingId} />}
          {tab === "label" && <LabelScansTab productId={productId} />}
          {tab === "influencer" && <InfluencerTab productId={productId} />}
          {tab === "substantiation" && <SubstantiationTab productId={productId} />}
        </div>
      </div>
    </div>
  );
}