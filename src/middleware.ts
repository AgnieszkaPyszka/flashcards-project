import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health", // jeśli masz
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

  const runtimeEnv = context.locals.runtime?.env as Record<string, string | undefined> | undefined;

  // ✅ runtime env na Cloudflare + fallback na lokalnie
  const supabaseUrl = runtimeEnv?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = runtimeEnv?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (context.url.pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({
          error: "Server misconfigured",
          details: "Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("Server misconfigured: missing Supabase env", { status: 500 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  // cookies → session
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  }

  context.locals.supabase = supabase;

  // guard
  const isPublic = isPublicRoute(context.url.pathname);
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
