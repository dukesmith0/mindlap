import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE, RECOVERY_COOKIE_TTL_S } from "@/lib/auth/recovery-cookie";

// OAuth + email-confirmation callback. Exchanges the code for a session,
// then sends the user on. New users land on /onboarding (proxy enforces this
// for any user with onboarded_at = null, but we hint here to skip a redirect).
//
// Recovery flows that target /auth/set-password get a short-lived cookie
// crumb so setNewPasswordAction can prove the visitor came through the email
// link. A stolen-cookie session alone does not satisfy this gate.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  // Same-origin guard: reject absolute URLs and protocol-relative ("//evil.com").
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/today";

  // Bound the OAuth code to a sane size to avoid log spam / reflect attacks.
  if (code && code.length > 1024) {
    const errorUrl = new URL("/login", url.origin);
    errorUrl.searchParams.set("error", "Invalid authentication code");
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errorUrl = new URL("/login", url.origin);
      errorUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(errorUrl);
    }
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  if (next === "/auth/set-password") {
    response.cookies.set(RECOVERY_COOKIE, "1", {
      path: "/",
      maxAge: RECOVERY_COOKIE_TTL_S,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}
