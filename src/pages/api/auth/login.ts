import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { Logger } from "@/lib/logger";

const logger = new Logger("auth/login");
export const prerender = false;

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

function getSupabaseEnv(locals: App.Locals) {
  const runtimeEnv = locals.runtime?.env as Record<string, string | undefined> | undefined;
  const url = runtimeEnv?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const key = runtimeEnv?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;
  return { url, key };
}

export const POST: APIRoute = async ({ request, cookies, locals, url }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          message: validationResult.error.errors[0]?.message || "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseEnv(locals);
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: "Server misconfigured",
          message: "Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      logger.error(new Error(error.message), { errorCode: error.status, errorName: error.name, email });

      // throttling / security
      if (error.status === 429 || /security purposes|too many/i.test(error.message)) {
        return new Response(
          JSON.stringify({
            error: "Too many requests",
            message: "Spróbuj ponownie za chwilę (limit bezpieczeństwa).",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Login failed",
          message: "Invalid email or password. Please check your credentials and try again.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.session || !data.user) {
      return new Response(
        JSON.stringify({ error: "Login failed", message: "Failed to create session. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const isSecure = url.protocol === "https:";

    cookies.set("sb-access-token", data.session.access_token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: data.session.expires_in ?? 3600,
    });

    cookies.set("sb-refresh-token", data.session.refresh_token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 60 * 60 * 24 * 7,
    });

    return new Response(
      JSON.stringify({
        message: "Login successful",
        user: { id: data.user.id, email: data.user.email },
        redirect: "/generate",
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in ?? 3600,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    logger.error(err instanceof Error ? err : new Error(String(err)), { operation: "login" });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
