/* eslint-disable no-console */
import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

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

function getEnv(context: Parameters<Parameters<typeof defineMiddleware>[0]>[0]) {
  const runtimeEnv = (context.locals as any)?.runtime?.env as Record<string, string | undefined> | undefined;

  return {
    supabaseUrl: runtimeEnv?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL,
    supabaseAnonKey: runtimeEnv?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY,
  };
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === "/api/generations") {
    console.log("[middleware] hit /api/generations marker");
  }

  if (isAsset(context.url.pathname)) return next();

  const { supabaseUrl, supabaseAnonKey } = getEnv(context);

  if (!supabaseUrl || !supabaseAnonKey) {
    // Uwaga: tu właśnie robiłaś 500 na cały serwis
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
    try {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    } catch (e) {
      console.warn("[middleware] setSession failed:", e);
    }
  }

  (context.locals as any).supabase = supabase;

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
