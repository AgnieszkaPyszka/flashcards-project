import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { Logger } from "@/lib/logger";

const logger = new Logger("auth/register");
export const prerender = false;

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEnv(locals: any) {
  const runtimeEnv = locals?.runtime?.env as Record<string, string | undefined> | undefined;
  const url = runtimeEnv?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const key = runtimeEnv?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;
  return { url, key };
}

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const { url: supabaseUrl, key: supabaseAnonKey } = getEnv(locals);

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error(new Error("Missing Supabase env"), {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      });

      return new Response(
        JSON.stringify({
          error: "Server misconfigured",
          message: "Supabase env not set (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY)",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json().catch(() => null);
    const validationResult = registerSchema.safeParse(body);

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

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      logger.error(new Error(error.message), { status: error.status, name: error.name, email });

      if (error.status === 429 || /security purposes|too many/i.test(error.message)) {
        return new Response(
          JSON.stringify({
            error: "Too many requests",
            message: "Spróbuj ponownie za chwilę (limit bezpieczeństwa).",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      if (
        error.message.includes("already registered") ||
        error.message.includes("already exists") ||
        error.message.includes("User already registered")
      ) {
        return new Response(
          JSON.stringify({
            error: "User already exists",
            message: "Konto z tym adresem już istnieje. Jeśli nie pamiętasz hasła, użyj opcji resetowania.",
            redirect: "/forgot-password",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Registration failed",
          message: error.message || "Failed to create account. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: "Registration failed", message: "Failed to create user account" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Jeśli Supabase zwróci session (gdy nie ma email confirmation)
    if (data.session) {
      const headers = new Headers({ "Content-Type": "application/json" });

      const isSecure = url.protocol === "https:";
      const maxAgeAccess = data.session.expires_in || 3600;

      headers.append(
        "Set-Cookie",
        `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; ${isSecure ? "Secure; " : ""}Max-Age=${maxAgeAccess}`
      );
      headers.append(
        "Set-Cookie",
        `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; ${isSecure ? "Secure; " : ""}Max-Age=604800`
      );

      return new Response(
        JSON.stringify({
          message: "Registration successful",
          user: { id: data.user.id, email: data.user.email },
          redirect: "/generate",
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in ?? 3600,
        }),
        { status: 201, headers }
      );
    }

    // Jeśli wymagane potwierdzenie maila
    return new Response(
      JSON.stringify({
        message: "Registration successful. Please check your email to confirm your account.",
        user: { id: data.user.id, email: data.user.email },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    logger.error(err instanceof Error ? err : new Error(String(err)), { operation: "register" });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
