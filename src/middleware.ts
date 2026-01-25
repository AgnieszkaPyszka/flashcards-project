import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./db/database.types";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
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

  const env = context.locals.runtime?.env as Record<string, string | undefined> | undefined;
  const supabaseUrl = env?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (context.url.pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured", details: "Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("Server misconfigured: missing Supabase env", { status: 500 });
  }

  // ✅ SSR/Edge-safe supabase client z pełną obsługą cookies (refresh itp.)
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return context.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          context.cookies.set(name, value, options);
        }
      },
    },
  });

  context.locals.supabase = supabase;

  const isPublic = isPublicRoute(context.url.pathname);

  if (!isPublic) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      if (context.url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/login");
    }
  }

  // ✅ ważne: pozwala supabase/ssr dopisać cookies do odpowiedzi
  const response = await next();
  return response;
});
