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

  // Side-effect: refreshes the session and updates `response` cookies via setAll.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(url);
    // Carry over any session cookies the SSR client wrote during getUser().
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  return response;
}
