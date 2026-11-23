import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function extractHotelSubdomain(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = hostHeader.toLowerCase().split(":")[0];
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000")
    .toLowerCase()
    .split(":")[0];

  // Ignore bare root domain, www, IP addresses, or Vercel preview URLs
  if (
    host === rootDomain ||
    host === `www.${rootDomain}` ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".vercel.app")
  ) {
    return null;
  }

  // Support <slug>.localhost (local dev) and <slug>.<rootDomain> (production)
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    return sub && !sub.includes(".") && sub !== "www" ? sub : null;
  }

  if (host.endsWith(`.${rootDomain}`)) {
    const sub = host.slice(0, -(rootDomain.length + 1));
    return sub && !sub.includes(".") && sub !== "www" ? sub : null;
  }

  return null;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Stage 5: Wildcard subdomain routing (<slug>.<ROOT_DOMAIN> -> /sites/<slug>)
  const subdomain = extractHotelSubdomain(request.headers.get("host"));
  if (
    subdomain &&
    !pathname.startsWith("/sites/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/")
  ) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/sites/${subdomain}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isHotelRoute = pathname === "/hotel" || pathname.startsWith("/hotel/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if ((isHotelRoute || isAdminRoute) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (isHotelRoute || isAdminRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (isAdminRoute && role !== "super_admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role === "hotel_admin" ? "/hotel" : "/";
      return NextResponse.redirect(redirectUrl);
    }

    if (isHotelRoute && role === "super_admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      return NextResponse.redirect(redirectUrl);
    }

    if (isHotelRoute && role !== "hotel_admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
