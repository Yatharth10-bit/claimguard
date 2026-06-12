"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCheckFirstClaimHref, loadBrandProfile, resolveUserId } from "@/lib/brandProfile";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type CheckFirstClaimCTAProps = {
  className?: string;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
};

export function CheckFirstClaimCTA({ className = "primary !rounded-full !px-6", variant = "primary", children }: CheckFirstClaimCTAProps) {
  const [href, setHref] = useState("/signup?next=%2Fonboarding");

  useEffect(() => {
    const resolve = async () => {
      const supabase = getSupabaseBrowser();
      let isLoggedIn = false;
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        isLoggedIn = Boolean(user);
      } else if (typeof window !== "undefined" && localStorage.getItem("claimguard-dev-user")) {
        isLoggedIn = true;
      }
      const userId = await resolveUserId();
      const profile = await loadBrandProfile(userId);
      setHref(getCheckFirstClaimHref({ isLoggedIn, profile }));
    };
    void resolve();
  }, []);

  const classes = variant === "secondary" ? `secondary relative !rounded-full !border-white !px-6 ${className}` : className;

  return (
    <Link href={href} className={classes}>
      {children ?? <>Check Your First Claim <ArrowRight size={17} /></>}
    </Link>
  );
}