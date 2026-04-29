import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that anonymous users can hit. Anything else redirects to /login.
// Static assets and /api/* are already excluded by the matcher in proxy.ts
// (root), so we don't allowlist them here.
const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/today",
  "/leaderboards",
]);

function isPublicPath(path: string): boolean {
  if (PUBLIC_EXACT.has(path)) return true;

  // Friend-code and group-code shareable links (anonymous lands, then signs up).
  if (path.startsWith("/f/") || path.startsWith("/g/")) return true;

  // Public profiles by username are anonymous-readable, but private namespaces
  // under /profile/me must remain gated.
  if (path.startsWith("/profile/")) {
    if (path === "/profile/me" || path.startsWith("/profile/me/")) return false;
    return true;
  }

  return false;
}

// Paths a signed-in but non-onboarded user is allowed to reach. Everything else
// redirects to /onboarding so they finish picking a username + theme.
const ONBOARDING_ALLOWED = new Set([
  "/onboarding",
  "/auth/callback",
  "/auth/set-password",
  "/login",
  "/signup",
]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user) {
    if (isPublicPath(path)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  // Signed-in user: enforce onboarding completion. One DB read per nav, only
  // when the user is authed (anonymous fast path above is unaffected).
  if (!ONBOARDING_ALLOWED.has(path)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .single();

    // Treat a missing profile row as "not yet onboarded" so a user whose
    // handle_new_user trigger raced or failed gets sent to /onboarding rather
    // than landing into /today with a profile-less session.
    const needsOnboarding = !profile || profile.onboarded_at === null;
    if (needsOnboarding) {
      return redirectWithCookies(request, response, "/onboarding");
    }
  } else if (path === "/onboarding") {
    // If onboarded user lands on /onboarding, send them home.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .single();
    if (profile && profile.onboarded_at !== null) {
      return redirectWithCookies(request, response, "/today");
    }
  }

  return response;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}
