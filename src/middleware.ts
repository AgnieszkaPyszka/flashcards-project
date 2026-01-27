/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { defineMiddleware } from "astro:middleware";
import { getSupabaseServerClient } from "@/db/supabase.client";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
  "/api/auth/me",
  "/api/auth/logout",
];

function isAsset(pathname: string) {
  return (
    pathname.startsWith("/_astro/") ||
    pathname === "/favicon.png" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/assets/")
  );
}

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname) || PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (isAsset(context.url.pathname)) return next();

  // ✅ w dev nie zabijaj całej strony 500, tylko przepuść publiczne trasy
  const isPublic = isPublicRoute(context.url.pathname);

  let supabase;
  try {
    supabase = getSupabaseServerClient(context.locals);
  } catch (e) {
    console.error("[middleware] supabase env error:", e);

    if (isPublic) return next(); // publiczne strony niech działają w dev

    if (context.url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Server misconfigured: missing Supabase env", { status: 500 });
  }

  // cookies → session
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    try {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    } catch (e) {
      console.warn("[middleware] setSession failed:", e);
    }
  }

  (context.locals as any).supabase = supabase;

  if (!isPublic) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      if (context.url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/login");
    }
  }

  return next();
});
