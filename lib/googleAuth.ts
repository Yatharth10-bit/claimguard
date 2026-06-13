import { getSupabaseBrowser } from "@/lib/supabase/client";

export function buildGoogleOAuthRedirectUrl(options?: { next?: string | null; signup?: boolean }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = new URL("/auth/callback", origin);
  if (options?.next) url.searchParams.set("next", options.next);
  if (options?.signup) url.searchParams.set("signup", "1");
  return url.toString();
}

export async function signInWithGoogle(options?: { next?: string | null; signup?: boolean }) {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildGoogleOAuthRedirectUrl(options),
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) throw error;
}