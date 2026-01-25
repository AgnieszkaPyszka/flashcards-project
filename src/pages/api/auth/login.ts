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

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: "Server misconfigured",
          message: "Supabase env not set (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY)",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
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

    // Fresh Supabase client for login operation
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      logger.error(new Error(error.message), {
        errorCode: error.status,
        errorName: error.name,
        email, // safe
      });

      // Generic error for security
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
        JSON.stringify({
          error: "Login failed",
          message: "Failed to create session. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = new Response(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        redirect: "/",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    // Cookies (Cloudflare Pages = HTTPS → Secure ok)
    const accessMaxAge = data.session.expires_in ?? 3600;

    response.headers.append(
      "Set-Cookie",
      `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${accessMaxAge}`
    );

    response.headers.append(
      "Set-Cookie",
      `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`
    );

    return response;
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      operation: "login",
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
