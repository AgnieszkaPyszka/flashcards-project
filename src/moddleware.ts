import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types"; // fixed import path

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// helper
function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname) || PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

  // ✅ NIE throw na top-level, tylko kontrolowany błąd w runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    // API → JSON 500
    if (context.url.pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({
          error: "Server misconfigured",
          details: "Supabase env not set (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY)",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pages → prosty komunikat
    return new Response("Supabase env not set on server", { status: 500 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // cookies (jeśli Twoje API je ustawia)
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // ustaw locals.supabase, bo endpointy tego potrzebują
  context.locals.supabase = supabase;

  // auth guard (opcjonalnie – możesz zostawić jak było)
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

  return next();
});
