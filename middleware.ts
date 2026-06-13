import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { BRAND_ONBOARDING_ENABLED, isOnboardingComplete } from "@/lib/brandProfile";
import { loadRemoteBrandProfile } from "@/lib/brandProfileRemote";

const protectedRoutes = ["/dashboard", "/onboarding", "/products", "/claim-checker", "/copy-scanner", "/claims", "/regulations", "/impact", "/tasks", "/settings", "/reports", "/saved-claims"];
const appRoutes = [...protectedRoutes];
export const runtime = "nodejs";

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function onboardingCompleteForUser(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const profile = await loadRemoteBrandProfile(admin, userId);
  return isOnboardingComplete(profile);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV !== "development" && matchesRoute(pathname, protectedRoutes)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Supabase is not configured.");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && matchesRoute(pathname, protectedRoutes)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const onboardingDone = BRAND_ONBOARDING_ENABLED
      ? await onboardingCompleteForUser(user.id)
      : true;

    if (["/login", "/signup"].includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = onboardingDone ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(url);
    }

    if (BRAND_ONBOARDING_ENABLED && pathname === "/onboarding" && onboardingDone) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (
      BRAND_ONBOARDING_ENABLED
      && !onboardingDone
      && matchesRoute(pathname, appRoutes)
      && pathname !== "/onboarding"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
