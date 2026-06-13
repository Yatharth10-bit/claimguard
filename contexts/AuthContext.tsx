"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  loading: true,
});

function readDevUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("claimguard-dev-user");
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { email?: string; full_name?: string };
    if (!parsed.email) return null;
    return {
      id: parsed.email,
      email: parsed.email,
      user_metadata: { full_name: parsed.full_name || "" },
    } as unknown as User;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase || !isSupabaseConfigured()) {
      setUser(readDevUser());
      setLoading(false);
      return;
    }

    let active = true;

    const syncUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    };

    void syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, isLoggedIn: Boolean(user), loading }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthContext);
}