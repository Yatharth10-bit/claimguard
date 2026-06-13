import { NextResponse } from "next/server";
import { postAuthPath, profileFromRow } from "@/lib/authRouting";
import { LEGAL_POLICY_VERSION } from "@/lib/legalContent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

function safeRedirectPath(request: Request, path: string) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  if (isLocal) return `${origin}${path}`;
  if (forwardedHost) return `https://${forwardedHost}${path}`;
  return `${origin}${path}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const signup = searchParams.get("signup") === "1";

  if (!code) {
    return NextResponse.redirect(safeRedirectPath(request, "/login?error=auth_callback_failed"));
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.redirect(safeRedirectPath(request, "/login?error=auth_not_configured"));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(safeRedirectPath(request, "/login?error=auth_callback_failed"));
  }

  const { data: { user } } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();

  if (user && admin) {
    const metadata = user.user_metadata ?? {};
    const fullName = String(metadata.full_name || metadata.name || user.email?.split("@")[0] || "");

    if (signup || !metadata.terms_accepted_at) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          full_name: fullName,
          terms_accepted_at: metadata.terms_accepted_at || new Date().toISOString(),
          terms_version: metadata.terms_version || LEGAL_POLICY_VERSION,
        },
      });
    }
  }

  let destination = "/dashboard";
  if (user && admin) {
    const { data: profileRow } = await admin
      .from("profiles")
      .select("brand_compliance_profile")
      .eq("id", user.id)
      .maybeSingle();

    destination = postAuthPath(profileFromRow(profileRow), { next, signup });
  } else if (next?.startsWith("/")) {
    destination = next;
  }

  return NextResponse.redirect(safeRedirectPath(request, destination));
}